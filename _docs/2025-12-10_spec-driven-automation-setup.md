# Spec駆動自動実装ワークフロー セットアップログ

**作成日**: 2025-12-10
**目的**: OpenSpecをマージしたら自動でClaude Assistantが実装してPRを作成するワークフローの構築

---

## 概要

以下のフローを実現:

```
Spec PR マージ
    ↓
Spec Implementation ワークフロー
    ↓
Issue 自動作成 (auto-implement ラベル付き)
    ↓
Claude Assistant 自動トリガー
    ↓
実装 + テスト + PR作成
```

---

## GitHub設定 (Repository Settings)

### 1. Secrets の設定

**Settings → Secrets and variables → Actions → New repository secret**

| Secret名 | 説明 | 必要な権限 |
|----------|------|-----------|
| `ANTHROPIC_API_KEY` | Anthropic API キー | - |
| `PAT` | Personal Access Token | Issues: Read and Write, Contents: Read |

#### PAT (Personal Access Token) の作成手順

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. "Generate new token" をクリック
3. 設定:
   - Token name: `spec-automation` など
   - Expiration: 適切な期間を選択
   - Repository access: 対象リポジトリを選択
   - Permissions:
     - **Issues**: Read and Write
     - **Contents**: Read
4. 生成されたトークンをコピー
5. リポジトリの Secrets に `PAT` として登録

**重要**: `GITHUB_TOKEN` ではなく `PAT` を使う理由
- GitHub のセキュリティ制限により、`GITHUB_TOKEN` で作成された Issue/Event は別のワークフローをトリガーしない
- `PAT` を使うことで、Issue 作成時に Claude Assistant ワークフローがトリガーされる

### 2. Labels の設定

**Issues → Labels → New label**

| Label名 | 説明 | 色 |
|---------|------|-----|
| `auto-implement` | Spec-driven auto implementation | `#0E8A16` (緑) |

---

## ワークフローファイル

### 1. `.github/workflows/spec-implement.yml`

Spec がマージされたら Issue を自動作成するワークフロー。

**ポイント**:
- `GH_TOKEN: ${{ secrets.PAT }}` を使用 (GITHUB_TOKEN ではない)
- `auto-implement` ラベルを付与
- `openspec/changes/` 配下の変更を検知

```yaml
name: Spec Implementation

on:
  push:
    branches:
      - main
    paths:
      - 'openspec/changes/**/proposal.md'
      - 'openspec/changes/**/tasks.md'
      - 'openspec/changes/**/specs/**'

permissions:
  contents: read
  issues: write

jobs:
  create-implementation-issue:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Detect changed spec
        id: detect
        run: |
          CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD -- 'openspec/changes/')
          SPEC_PATH=$(echo "$CHANGED_FILES" | grep -oE 'openspec/changes/[^/]+' | head -1)
          # ... spec検出ロジック

      - name: Create implementation issue
        env:
          GH_TOKEN: ${{ secrets.PAT }}  # 重要: GITHUB_TOKEN ではなく PAT
          # ...
        run: |
          gh issue create \
            --title "feat: $FEATURE の実装" \
            --label "auto-implement" \
            --assignee "$REPO_OWNER" \
            --body "$BODY"
```

### 2. `.github/workflows/claude-assistant.yml`

Issue 作成時や `@claude` メンション時に Claude Code Action を実行するワークフロー。

**ポイント**:
- `id-token: write` 権限が必須
- `allowed_tools` に `Bash(gh:*)` を含めてPR作成を許可
- `prompt` ではなく `custom_instructions` を使用 (prompt は deprecated)

```yaml
name: Claude Assistant

on:
  issues:
    types: [opened, assigned, labeled]
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  pull_request_review:
    types: [submitted]

permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write  # 重要: OIDC トークン取得に必要

jobs:
  claude-response:
    if: |
      (github.event_name == 'issues' && contains(github.event.issue.labels.*.name, 'auto-implement')) ||
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      # ...
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

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

          custom_instructions: |  # prompt ではなく custom_instructions
            # プロジェクト固有の指示
            ## 実装時の注意事項
            - 実装前に必ず `openspec/project.md` と `openspec/AGENTS.md` を読んでください
            - Specに書かれた範囲のみ実装してください
            - 実装完了後は `npm test` を実行してテストを確認してください
            - テストが通ったら `gh pr create` でPRを作成してください
            # ...

          # gh CLI を許可してPR作成を可能にする
          allowed_tools: "Bash,Read,Write,Edit,Glob,Grep,Bash(gh:*)"
          timeout_minutes: 30
```

---

## トラブルシューティング

### 1. Issue 作成後に Claude Assistant がトリガーされない

**原因**: `GITHUB_TOKEN` で作成された Issue は別ワークフローをトリガーしない

**解決**: `secrets.PAT` を使用する

### 2. Claude Assistant で OIDC トークンエラー

**エラー**: `Could not fetch an OIDC token. Did you remember to add 'id-token: write' to your workflow permissions?`

**解決**: permissions に `id-token: write` を追加

### 3. `prompt` パラメータの警告

**警告**: `Unexpected input(s) 'prompt'`

**解決**: `prompt` ではなく `custom_instructions` を使用

### 4. Anthropic API クレジット不足

**エラー**: `Credit balance is too low`

**解決**: Anthropic Console (https://console.anthropic.com) でクレジットを追加

### 5. Claude が PR を自動作成しない

**原因**: `allowed_tools` に `Bash(gh:*)` が含まれていない、または指示が不十分

**解決**:
- `allowed_tools` に `Bash(gh:*)` を追加
- `custom_instructions` に「テストが通ったら `gh pr create` でPRを作成してください」を明記

---

## 動作確認済みの実装フロー

### テスト1: バージョン表示機能 (display-version)

1. PR #74: Spec追加 → マージ
2. Spec Implementation ワークフロー実行
3. Issue #75 自動作成 (最初は Claude Assistant トリガーされず)
4. 手動で `@claude` コメント → Claude Assistant 実行
5. 実装完了、ブランチ作成
6. 手動でPR #78 作成 → マージ

### テスト2: ログタイムスタンプ機能 (log-timestamp)

1. PR #80: Spec追加 → マージ
2. Spec Implementation ワークフロー実行 (PAT使用)
3. Issue #81 自動作成
4. Claude Assistant 自動トリガー (成功!)
5. 実装完了、テスト通過、ブランチ作成
6. PR作成は手動 (Claude が gh pr create を実行しなかった)
7. PR #82 作成

---

## 改善点・TODO

- [ ] PR自動作成の指示を強化、または別ステップとして追加
- [ ] 複数の Claude Assistant が同時起動する問題の調査 (concurrency 設定)
- [ ] テストがフレーキーな問題の修正 (Node.js バージョン差異)

---

## 関連PR一覧

| PR | タイトル | 内容 |
|----|---------|------|
| #74 | docs(openspec): add version display feature spec | バージョン表示のSpec追加 |
| #76 | fix(ci): use PAT for issue creation | GITHUB_TOKEN → PAT 変更 |
| #77 | fix(ci): add id-token permission | id-token: write 追加、prompt → custom_instructions |
| #78 | feat: バージョン表示機能を実装 | Claude による実装 |
| #79 | fix(ci): allow gh CLI for automatic PR creation | Bash(gh:*) を allowed_tools に追加 |
| #80 | docs(openspec): add log timestamp feature spec | ログタイムスタンプのSpec追加 |
| #82 | feat: ログにタイムスタンプを追加 | Claude による実装 |
