# Structured Outputs セットアップガイド

このガイドでは、Claude API の Structured Outputs をこのプロジェクトで使えるようにする手順を説明します。

## 📋 前提条件

- Node.js v20 以上がインストールされていること
- Anthropic API キーを取得していること（[console.anthropic.com](https://console.anthropic.com/)）

## 🚀 セットアップ手順

### ステップ1: 依存関係のインストール

```bash
npm install
```

これで以下がインストールされます：
- `@anthropic-ai/sdk` - Anthropic の公式 SDK
- `dotenv` - 環境変数管理

### ステップ2: API キーの設定

#### 方法A: 環境変数ファイルを使う（推奨）

1. `.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

2. `.env` ファイルを編集して、APIキーを設定：

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-api-key-here
```

#### 方法B: シェルで直接設定

```bash
export ANTHROPIC_API_KEY='sk-ant-api03-your-actual-api-key-here'
```

### ステップ3: サンプルを実行

#### シンプルな例を試す

```bash
npm run example:simple
```

これにより、以下が実行されます：
- ✅ 基本的な構造化出力
- ✅ 配列を含む出力
- ✅ Enum を使った型制約
- ✅ Tool Use パターン
- ✅ ネストされたオブジェクト

#### ゲーム関連の例を試す

```bash
npm run example:game
```

これにより、以下が実行されます：
- 🎯 AI による取引アドバイス
- 🚢 航海レポート自動生成
- 📊 港の在庫分析

## 🎮 アプローチ別の使い方

### アプローチA: スタンドアロンスクリプト（現在の設定）

**用途**: 開発・テスト・分析ツール

**メリット**:
- ✅ セットアップが簡単
- ✅ すぐに試せる
- ✅ APIキーがサーバーサイドで安全

**デメリット**:
- ❌ ブラウザから直接使えない
- ❌ リアルタイムのゲーム機能には不向き

**実装例**:

```javascript
// scripts/analyze-game-state.js
import Anthropic from '@anthropic-ai/sdk';
import { gameState } from './src/core/game-state.js';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// ゲーム状態を分析
const advice = await anthropic.messages.create({
    // ...
});

console.log('AI のアドバイス:', advice);
```

実行:
```bash
node scripts/analyze-game-state.js
```

---

### アプローチB: バックエンド API を追加（本格的）

**用途**: リアルタイムのゲーム機能

**メリット**:
- ✅ ブラウザから使える
- ✅ リアルタイム AI 機能
- ✅ APIキーが安全（サーバーサイド）

**デメリット**:
- ❌ セットアップが複雑
- ❌ デプロイが必要

**実装手順**:

#### 1. Express をインストール

```bash
npm install express cors
```

#### 2. サーバーを作成

```javascript
// server.js
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// 取引アドバイスAPIを追加
app.post('/api/trading-advice', async (req, res) => {
    try {
        const { gameState } = req.body;

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250514',
            max_tokens: 1024,
            betas: ['structured-outputs-2025-11-13'],
            messages: [{
                role: 'user',
                content: `ゲーム状態: ${JSON.stringify(gameState)}`
            }],
            output_format: {
                type: 'json_schema',
                schema: {
                    // スキーマ定義...
                }
            }
        });

        const advice = JSON.parse(message.content[0].text);
        res.json(advice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

#### 3. package.json にスクリプトを追加

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}
```

#### 4. サーバーを起動

```bash
npm start
```

#### 5. フロントエンドから使用

```javascript
// ゲームの UI から呼び出し
async function getAIAdvice() {
    const response = await fetch('http://localhost:3000/api/trading-advice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            gameState: {
                currentPort: gameState.currentPort,
                money: gameState.money,
                cargo: gameState.cargo
            }
        })
    });

    const advice = await response.json();
    console.log('AI のアドバイス:', advice);

    // UI に表示
    displayAdvice(advice);
}
```

---

### アプローチC: サーバーレス（Vercel/Netlify）

**用途**: GitHub Pages + サーバーレス関数

**メリット**:
- ✅ 自動デプロイ
- ✅ 無料枠で使える
- ✅ スケーラブル

**実装手順（Vercel の例）**:

#### 1. Vercel CLI をインストール

```bash
npm install -g vercel
```

#### 2. API 関数を作成

```javascript
// api/trading-advice.js
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    const { gameState } = req.body;

    const message = await anthropic.messages.create({
        // ...
    });

    const advice = JSON.parse(message.content[0].text);
    res.json(advice);
}
```

#### 3. デプロイ

```bash
vercel
```

#### 4. 環境変数を設定

```bash
vercel env add ANTHROPIC_API_KEY
```

---

## 🔒 セキュリティ注意事項

### ❌ 絶対にやってはいけないこと

```javascript
// ❌ ブラウザから直接 API を呼ぶ（APIキーが漏洩する！）
const anthropic = new Anthropic({
    apiKey: 'sk-ant-api03-...'  // これは危険！
});
```

### ✅ 正しい方法

1. **サーバーサイドで API を呼ぶ**
   - Node.js スクリプト
   - Express サーバー
   - サーバーレス関数

2. **環境変数で管理**
   - `.env` ファイル（gitignore に追加）
   - Vercel/Netlify の環境変数設定

3. **APIキーを絶対にコミットしない**
   - `.gitignore` に `.env` を追加済み
   - `.env.example` のみコミット

---

## 🧪 動作確認

### 1. APIキーが正しく設定されているか確認

```bash
echo $ANTHROPIC_API_KEY
```

### 2. サンプルを実行

```bash
npm run example:simple
```

成功すると、以下のような出力が表示されます：

```
=== シンプルな構造化出力の例 ===

結果: { location: '東京', weather: '晴れ', temperature: 25 }
型チェック:
  location は string? true
  weather は string? true
  temperature は number? true
```

---

## 📚 次のステップ

1. **[Structured Outputs ガイド](STRUCTURED_OUTPUTS_GUIDE.md)** を読む
2. **[実装例](../examples/)** を確認する
3. 自分のユースケースに合わせてカスタマイズする

---

## ❓ トラブルシューティング

### エラー: `ANTHROPIC_API_KEY is not set`

**原因**: 環境変数が設定されていません

**解決策**:
```bash
export ANTHROPIC_API_KEY='your-api-key'
```

### エラー: `401 Unauthorized`

**原因**: APIキーが無効です

**解決策**:
- [console.anthropic.com](https://console.anthropic.com/) でAPIキーを確認
- 新しいAPIキーを生成して設定

### エラー: `Cannot find module '@anthropic-ai/sdk'`

**原因**: 依存関係がインストールされていません

**解決策**:
```bash
npm install
```

### エラー: `beta header structured-outputs-2025-11-13 not found`

**原因**: SDK のバージョンが古い可能性があります

**解決策**:
```bash
npm install @anthropic-ai/sdk@latest
```

---

## 💬 サポート

問題が発生した場合は、GitHub Issues でお知らせください。
