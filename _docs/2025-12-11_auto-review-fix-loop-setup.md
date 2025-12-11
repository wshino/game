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

## Step-by-Step Setup

Follow these steps in order to set up the Auto Review-Fix Loop in your repository.

### Step 1: Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy the generated key (starts with `sk-ant-`)

> **Note**: You need API credits to use Claude Code Action. Check your balance at the Anthropic Console.

### Step 2: Add GitHub Secret

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Set:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Secret**: Paste your API key from Step 1
6. Click **Add secret**

### Step 3: Create Claude Review Workflow

Create the file `.github/workflows/claude-review.yml` with the following content:

```yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

permissions:
  contents: read
  pull-requests: write
  id-token: write  # Required for OIDC authentication

# Prevent duplicate reviews on the same PR (saves API tokens)
concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: false

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

            ---

            **IMPORTANT**: End your review with one of these markers:
            - `[LGTM]` - If approved, no issues found
            - `[REQUIRES_FIX]` - If changes are needed

          allowed_tools: "Read,Glob,Grep"
          allowed_bots: "claude"  # Allow re-review after bot push
          timeout_minutes: 15
```

**Key points in this file:**
- `direct_prompt`: Forces automatic execution (no @claude mention needed)
- `id-token: write`: Required for OIDC authentication
- `allowed_bots: "claude"`: Enables re-review after Claude pushes fixes
- `concurrency`: Prevents duplicate runs, saves API tokens
- Markers: `[REQUIRES_FIX]` triggers auto-fix, `[LGTM]` ends the loop

### Step 4: Create Claude Assistant Workflow

Create the file `.github/workflows/claude-assistant.yml` with the following content:

```yaml
name: Claude Assistant

on:
  issues:
    types: [opened, assigned, labeled]

  # Include 'edited' for streaming comment updates
  # Claude Review streams output, adding [REQUIRES_FIX] after initial post
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
  id-token: write  # Required for OIDC authentication

# Prevent duplicate executions on the same PR/Issue (saves API tokens)
concurrency:
  group: claude-assistant-${{ github.event.issue.number || github.event.pull_request.number || github.run_id }}
  cancel-in-progress: false

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

  # Job 2: Auto-fix from [REQUIRES_FIX] marker (fully automatic)
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

          # direct_prompt bypasses mode:tag check for automatic execution
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
          allowed_bots: "claude"  # Allow Claude Review Bot to trigger this job
          timeout_minutes: 30
```

**Key points in this file:**
- **Two jobs**: `claude-response` (manual @claude) and `auto-fix-review` (automatic)
- `issue_comment: [created, edited]`: `edited` catches streaming comment updates
- `direct_prompt` in auto-fix job: Bypasses trigger requirement for automatic execution
- `allowed_bots: "claude"`: Allows Claude Review's comments to trigger auto-fix
- `concurrency`: Prevents duplicate runs from streaming events

### Step 5: Commit and Push

```bash
git add .github/workflows/claude-review.yml .github/workflows/claude-assistant.yml
git commit -m "ci: add Claude auto review-fix workflows"
git push
```

### Step 6: Test the Setup

1. Create a new branch:
   ```bash
   git checkout -b test/review-fix-loop
   ```

2. Make a small change with an intentional issue (e.g., XSS vulnerability):
   ```javascript
   // BAD: XSS vulnerability for testing
   element.innerHTML = userInput;
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "test: add intentional issue for review test"
   git push -u origin test/review-fix-loop
   ```

4. Create a Pull Request on GitHub

5. Watch the automation:
   - Claude Review automatically runs and posts a comment
   - If issues found → `[REQUIRES_FIX]` marker triggers auto-fix
   - Claude fixes the code and pushes
   - Re-review runs → `[LGTM]` when all issues resolved

### Step 7: Verify Success

Check that:
- [ ] Claude Review posted a comment on the PR
- [ ] Auto-fix job ran (if issues were found)
- [ ] Code was fixed and pushed by `github-actions[bot]`
- [ ] Re-review posted `[LGTM]` (if all issues resolved)

---

## How It Works

### Flow Diagram

```
1. PR Created
   └─→ pull_request.opened triggers Claude Review

2. Claude Review runs
   └─→ Posts comment with [REQUIRES_FIX] or [LGTM]

3. If [REQUIRES_FIX]:
   └─→ issue_comment.created/edited triggers auto-fix-review job
   └─→ Claude fixes issues, runs tests, commits, pushes

4. Push triggers re-review
   └─→ pull_request.synchronize triggers Claude Review
   └─→ allowed_bots: "claude" allows bot-pushed changes

5. Repeat until [LGTM]
```

### Why Each Setting Matters

| Setting | Purpose |
|---------|---------|
| `direct_prompt` | Forces execution without @claude trigger |
| `allowed_bots: "claude"` | Allows bot-to-bot interaction (review → fix → re-review) |
| `issue_comment: [created, edited]` | Catches streaming updates with markers |
| `id-token: write` | Required for OIDC authentication |
| `concurrency` | Prevents duplicate API calls from streaming events |

### Preventing Infinite Loops

The loop naturally ends when:
- No `[REQUIRES_FIX]` marker → auto-fix job doesn't trigger
- `[LGTM]` marker → indicates approval, loop complete

---

## Troubleshooting

### "Workflow initiated by non-human actor"

**Cause**: Claude Code Action blocks bot-initiated triggers by default.

**Solution**: Add `allowed_bots: "claude"` to the workflow.

### Auto-fix not triggering on review comment

**Check**:
1. Does the comment contain `[REQUIRES_FIX]`? (exact match required)
2. Is `edited` included in `issue_comment` types?
3. Is `allowed_bots: "claude"` set in `claude-assistant.yml`?

### "Credit balance is too low"

**Cause**: Anthropic API credits exhausted.

**Solution**: Add credits at https://console.anthropic.com

### Review not posting after bot push

**Cause**: Bot-pushed changes blocked by default.

**Solution**: Add `allowed_bots: "claude"` to `claude-review.yml`

### Too many workflow runs (token waste)

**Cause**: Streaming comments trigger multiple `edited` events.

**Solution**: Add `concurrency` block to both workflows (already included in templates above).

---

## Cost Considerations

Each loop iteration uses API credits:
- Initial review: ~1 API call
- Auto-fix: ~1-3 API calls (depending on complexity)
- Re-review: ~1 API call

Tips to manage costs:
- Set appropriate `timeout_minutes`
- Use `concurrency` to prevent duplicate runs
- Review API usage in Anthropic Console

---

## Customization

### Changing Review Criteria

Edit the `direct_prompt` in `claude-review.yml`:

```yaml
direct_prompt: |
  Please review this PR focusing on:
  - Security vulnerabilities (CRITICAL)
  - Performance issues
  - Code style (follow our style guide)

  Ignore:
  - Minor formatting issues
  - package-lock.json changes
```

### Adding Project-Specific Instructions

Edit `custom_instructions` in `claude-assistant.yml`:

```yaml
custom_instructions: |
  ## Project Rules
  - Use TypeScript strict mode
  - All functions must have JSDoc comments
  - Follow our naming conventions
```

### Using Different Languages

For Japanese projects:

```yaml
direct_prompt: |
  このPRをレビューしてください。

  ## 出力形式
  - コメントは日本語で記述
  - 問題があれば `[REQUIRES_FIX]` を含める
  - 問題なければ `[LGTM]` を含める
```

---

## Quick Reference

### Required Secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude API authentication |
| `PAT` | No | Only for spec-driven automation |

### Markers

| Marker | Meaning | Action |
|--------|---------|--------|
| `[REQUIRES_FIX]` | Issues need fixing | Triggers auto-fix job |
| `[LGTM]` | Approved | Loop ends |

### Key Configuration Checklist

- [ ] `ANTHROPIC_API_KEY` secret added
- [ ] `id-token: write` permission in both workflows
- [ ] `allowed_bots: "claude"` in both workflows
- [ ] `edited` in `issue_comment` types
- [ ] `concurrency` blocks in both workflows
- [ ] `direct_prompt` for automatic execution jobs

---

## Related PRs (Reference Implementation)

These PRs implemented this feature in the wshino/game repository:

| PR | Description |
|----|-------------|
| #97 | Add `[REQUIRES_FIX]` / `[LGTM]` markers |
| #99 | Split auto-fix into separate job with `direct_prompt` |
| #101 | Add `edited` event type for streaming support |
| #103 | Add `allowed_bots` to assistant workflow |
| #105 | Add `allowed_bots` to review workflow |
| #108 | Add concurrency control for token savings |
