# Auto Review-Fix Loop Setup Guide

This guide explains how to set up a fully automatic code review and fix loop using Claude Code Action.

## Overview

```
PR Created
    ↓
Claude Review (automatic)
    ↓ Issues found
[REQUIRES_FIX] comment
    ↓
auto-fix-review job (automatic fix)
    ↓ Push changes
Claude Review (re-review)
    ↓ No issues
[LGTM] comment → Complete!
```

The loop continues until all issues are resolved.

---

## Prerequisites

### 1. GitHub Secrets

Add these secrets to your repository (Settings → Secrets and variables → Actions):

| Secret Name | Description |
|-------------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `PAT` | Personal Access Token (for spec-driven automation, optional) |

### 2. Repository Labels (Optional)

For spec-driven automation, create this label:

| Label | Description | Color |
|-------|-------------|-------|
| `auto-implement` | Triggers auto-implementation | `#0E8A16` |

---

## Workflow Files

Create two workflow files in `.github/workflows/`:

### 1. Claude Code Review (`claude-review.yml`)

This workflow automatically reviews PRs when created or updated.

```yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

permissions:
  contents: read
  pull-requests: write
  id-token: write

jobs:
  review:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run tests first
        id: test
        run: |
          npm test && echo "test_passed=true" >> $GITHUB_OUTPUT || echo "test_passed=false" >> $GITHUB_OUTPUT
        continue-on-error: true

      - name: Run Claude Code Review
        uses: anthropics/claude-code-action@beta
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

          # direct_prompt forces execution without @claude trigger
          direct_prompt: |
            # PR Review Request

            Please review this PR.

            ## Test Results
            Tests: ${{ steps.test.outputs.test_passed == 'true' && 'PASSED' || 'FAILED' }}

            ## Review Criteria

            1. **Functionality**: Does it work as intended?
            2. **Code Quality**: Is it readable and maintainable?
            3. **Security**: Are there any vulnerabilities?
            4. **Performance**: Is it efficient?
            5. **Tests**: Are there sufficient tests?

            ## Output Format

            Post your review as a PR comment in this format:

            ### Review Summary
            [Overall assessment]

            ### Good Points
            [List of positive aspects]

            ### Suggestions
            [Optional improvements]

            ### Required Fixes
            [Critical issues that must be fixed]
            **IMPORTANT**: If fixes are required, include `[REQUIRES_FIX]` at the end.
            If no issues, include `[LGTM]` at the end.

            ---

            End with `[LGTM]` if approved, or `[REQUIRES_FIX]` if changes needed.

          allowed_tools: "Read,Glob,Grep"
          # Allow bot-pushed changes to trigger re-review
          allowed_bots: "claude"
          timeout_minutes: 15
```

### 2. Claude Assistant (`claude-assistant.yml`)

This workflow handles manual @claude mentions and automatic fixes.

```yaml
name: Claude Assistant

on:
  issues:
    types: [opened, assigned, labeled]

  # Include 'edited' for streaming comment updates
  issue_comment:
    types: [created, edited]

  pull_request_review_comment:
    types: [created]

  pull_request_review:
    types: [submitted]

permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write

jobs:
  # Job 1: Handle @claude mentions and auto-implement labels
  claude-response:
    if: |
      (github.event_name == 'issues' && contains(github.event.issue.labels.*.name, 'auto-implement')) ||
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude'))
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.issue.pull_request && github.event.pull_request.head.ref || github.ref }}

      - name: Checkout PR branch (for issue_comment on PR)
        if: github.event_name == 'issue_comment' && github.event.issue.pull_request
        run: |
          PR_NUMBER=${{ github.event.issue.number }}
          gh pr checkout $PR_NUMBER
        env:
          GH_TOKEN: ${{ github.token }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Configure git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Run Claude Code
        uses: anthropics/claude-code-action@beta
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

          custom_instructions: |
            # Project Instructions

            ## Review Response
            When review comments contain required fixes:
            1. Identify the issues from the review
            2. Fix the code
            3. Run tests to verify
            4. Commit and push changes
            5. Report completion in PR comment

            ## New Implementation (for auto-implement labeled issues)
            1. Read project specs
            2. Implement only what's specified
            3. Run tests
            4. Commit and push
            5. Create PR with `gh pr create`

          allowed_tools: "Bash,Read,Write,Edit,Glob,Grep,Bash(gh:*)"
          timeout_minutes: 30

  # Job 2: Auto-fix from [REQUIRES_FIX] marker
  auto-fix-review:
    if: |
      github.event_name == 'issue_comment' &&
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '[REQUIRES_FIX]')
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Checkout PR branch
        run: |
          PR_NUMBER=${{ github.event.issue.number }}
          gh pr checkout $PR_NUMBER
        env:
          GH_TOKEN: ${{ github.token }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Configure git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Run Claude Code (Auto-Fix)
        uses: anthropics/claude-code-action@beta
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

          # direct_prompt bypasses mode:tag check
          direct_prompt: |
            Fix the required issues marked with [REQUIRES_FIX] in the review.

            ## Steps
            1. Read the review comment and identify required fixes
            2. Fix the issues
            3. Run tests to verify
            4. Commit and push changes
            5. Report completion in PR comment

            **Important**:
            - Only fix "Required Fixes", not optional suggestions
            - Comment "Fixes completed" when done

          custom_instructions: |
            ## Coding Standards
            - Follow project conventions
            - Write clean, readable code

          allowed_tools: "Bash,Read,Write,Edit,Glob,Grep,Bash(gh:*)"
          # Allow Claude Review Bot comments to trigger this job
          allowed_bots: "claude"
          timeout_minutes: 30
```

---

## Key Configuration Points

### 1. `direct_prompt` vs `custom_instructions`

| Parameter | Usage |
|-----------|-------|
| `direct_prompt` | Forces immediate execution without trigger |
| `custom_instructions` | Additional context, requires trigger (@claude or label) |

Use `direct_prompt` for:
- Automatic review on PR creation
- Automatic fix on `[REQUIRES_FIX]` marker

### 2. `allowed_bots: "claude"`

**Required in both workflows** to enable the loop:
- In `claude-review.yml`: Allows re-review of bot-pushed changes
- In `claude-assistant.yml`: Allows response to bot-posted review comments

### 3. `issue_comment` Event Types

```yaml
issue_comment:
  types: [created, edited]  # Include 'edited'!
```

**Why `edited`?** Claude Review streams its output, updating the comment multiple times. The `[REQUIRES_FIX]` marker may not be present in the initial `created` event.

### 4. `id-token: write` Permission

Required for OIDC token authentication with the Claude Code Action.

### 5. Markers

| Marker | Meaning | Action |
|--------|---------|--------|
| `[REQUIRES_FIX]` | Issues need fixing | Triggers auto-fix job |
| `[LGTM]` | Approved | Loop ends |

---

## How It Works

### Step-by-Step Flow

1. **PR Created** → `pull_request.opened` triggers Claude Review
2. **Review Posted** → Claude analyzes code and posts comment
3. **Issues Found** → Comment includes `[REQUIRES_FIX]` marker
4. **Comment Created/Edited** → `issue_comment.created/edited` triggers auto-fix
5. **Auto-Fix Runs** → Claude fixes issues and pushes
6. **Re-Review** → `pull_request.synchronize` triggers Claude Review again
7. **Repeat** → Until `[LGTM]` is posted

### Preventing Infinite Loops

The loop naturally ends when:
- No `[REQUIRES_FIX]` marker → auto-fix job doesn't trigger
- `[LGTM]` marker → indicates approval

---

## Troubleshooting

### Issue: "Workflow initiated by non-human actor"

**Solution**: Add `allowed_bots: "claude"` to the workflow

### Issue: Auto-fix not triggering on review comment

**Check**:
1. Does the comment contain `[REQUIRES_FIX]`?
2. Is `edited` event type included?
3. Is `allowed_bots: "claude"` set?

### Issue: "Credit balance is too low"

**Solution**: Add credits to your Anthropic account at https://console.anthropic.com

### Issue: Review not posting after bot push

**Solution**: Add `allowed_bots: "claude"` to `claude-review.yml`

---

## Cost Considerations

Each loop iteration uses API credits:
- Initial review: ~1 API call
- Auto-fix: ~1-3 API calls (depending on complexity)
- Re-review: ~1 API call

For complex PRs with multiple fix iterations, costs can add up. Consider:
- Setting appropriate `timeout_minutes`
- Reviewing API usage in Anthropic Console

---

## Customization

### Adding Project-Specific Instructions

Modify the `custom_instructions` or `direct_prompt` to include:
- Coding standards
- Project conventions
- Specific review criteria
- Language preferences (e.g., Japanese comments)

### Excluding Certain Files

Add to review prompt:
```
Ignore changes to:
- package-lock.json
- *.min.js
- dist/
```

---

## Related PRs (Reference Implementation)

These PRs implemented this feature in the game repository:

| PR | Description |
|----|-------------|
| #97 | Add `[REQUIRES_FIX]` marker |
| #99 | Split auto-fix into separate job with `direct_prompt` |
| #101 | Add `edited` event type for streaming support |
| #103 | Add `allowed_bots` to assistant workflow |
| #105 | Add `allowed_bots` to review workflow |

---

## Quick Start Checklist

- [ ] Add `ANTHROPIC_API_KEY` to repository secrets
- [ ] Create `.github/workflows/claude-review.yml`
- [ ] Create `.github/workflows/claude-assistant.yml`
- [ ] Verify `allowed_bots: "claude"` in both workflows
- [ ] Verify `id-token: write` permission in both workflows
- [ ] Verify `edited` in `issue_comment` types
- [ ] Test with a PR containing an intentional issue

---

## Example Test

1. Create a branch with an intentional security issue:
   ```javascript
   // BAD: XSS vulnerability
   element.innerHTML = userInput;
   ```

2. Open a PR

3. Watch the magic:
   - Claude Review detects XSS → `[REQUIRES_FIX]`
   - Auto-fix changes to `textContent`
   - Re-review confirms → `[LGTM]`
