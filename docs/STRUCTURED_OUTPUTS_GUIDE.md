# Claude API Structured Outputs ガイド

## 📅 いつから使える？

**2025年11月14日から利用可能**（パブリックベータ）

### 対応モデル

- ✅ **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250514`)
- ✅ **Claude Opus 4.1** (`claude-opus-4-1-20250514`)
- 🔜 **Claude Haiku 4.5**（近日対応予定）

## 🎯 Structured Outputs とは？

Structured Outputs は、Claude API のレスポンスを指定した JSON スキーマに完全に準拠させる機能です。これにより、以下のメリットがあります：

- ✅ **完全な型安全性**: レスポンスが常に指定した構造と一致
- ✅ **パースエラーの排除**: JSON パースエラーやバリデーションエラーがゼロに
- ✅ **本番環境での信頼性向上**: 予測可能な出力形式
- ✅ **パフォーマンス維持**: モデルの性能に影響なし

## 🚀 セットアップ

### 1. パッケージのインストール

```bash
npm install @anthropic-ai/sdk
```

### 2. 環境変数の設定

```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

### 3. API クライアントの初期化

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
```

## 💡 使用方法

### 方法1: JSON Schema による出力制御

`output_format` パラメータで JSON スキーマを指定します。

```javascript
const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    // ベータ機能を有効化
    betas: ['structured-outputs-2025-11-13'],
    messages: [{
        role: 'user',
        content: 'ユーザー情報を分析してください'
    }],
    // 構造化された出力形式を指定
    output_format: {
        type: 'json_schema',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                age: { type: 'integer' },
                interests: {
                    type: 'array',
                    items: { type: 'string' }
                }
            },
            required: ['name', 'age', 'interests']
        }
    }
});

// レスポンスをパース
const result = JSON.parse(message.content[0].text);
console.log(result);
// 出力例: { name: "太郎", age: 25, interests: ["プログラミング", "旅行"] }
```

### 方法2: Tool Use による出力制御

ツール定義を使用して、より厳密な型制約を実現します。

```javascript
const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    betas: ['structured-outputs-2025-11-13'],
    messages: [{
        role: 'user',
        content: 'データを分析してレポートを作成してください'
    }],
    tools: [{
        name: 'create_report',
        description: 'データ分析レポートを作成',
        input_schema: {
            type: 'object',
            properties: {
                summary: { type: 'string' },
                score: { type: 'integer', minimum: 0, maximum: 100 },
                status: { type: 'string', enum: ['success', 'warning', 'error'] }
            },
            required: ['summary', 'score', 'status']
        }
    }],
    // 特定のツールの使用を強制
    tool_choice: {
        type: 'tool',
        name: 'create_report'
    }
});

// ツール呼び出しから構造化データを取得
const toolUse = message.content.find(block => block.type === 'tool_use');
console.log(toolUse.input);
// 出力例: { summary: "分析完了", score: 85, status: "success" }
```

## 📊 JSON Schema の基本

### サポートされる型

```javascript
{
    // 基本型
    string_field: { type: 'string' },
    integer_field: { type: 'integer' },
    number_field: { type: 'number' },
    boolean_field: { type: 'boolean' },

    // 配列
    array_field: {
        type: 'array',
        items: { type: 'string' }
    },

    // オブジェクト
    object_field: {
        type: 'object',
        properties: {
            nested_field: { type: 'string' }
        },
        required: ['nested_field']
    },

    // Enum（列挙型）
    status_field: {
        type: 'string',
        enum: ['pending', 'completed', 'failed']
    }
}
```

### バリデーション制約

```javascript
{
    // 文字列の制約
    name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: '^[A-Za-z]+$'
    },

    // 数値の制約
    age: {
        type: 'integer',
        minimum: 0,
        maximum: 150
    },

    // 配列の制約
    tags: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10
    }
}
```

## 🎮 ゲームでの活用例

このプロジェクト（大航海時代ゲーム）での具体的な使用例：

### 1. AI による取引アドバイス

```javascript
const advice = await getTradingAdvice({
    currentPort: 'リスボン',
    money: 50000,
    cargo: { '香辛料': 20 }
});

// 必ず以下の構造で返ってくる
console.log(advice.recommended_purchases);  // 配列
console.log(advice.recommended_destination); // オブジェクト
console.log(advice.risk_assessment);         // 'low' | 'medium' | 'high'
console.log(advice.strategy_summary);        // 文字列
```

### 2. 航海レポートの自動生成

```javascript
const report = await generateVoyageReport({
    departure: { port: 'リスボン', date: '1500-01-01' },
    arrival: { port: 'カリカット', date: '1500-02-15' },
    // ...
});

// 必ず以下の構造で返ってくる
console.log(report.voyage_summary);      // 航海の概要
console.log(report.financial_summary);   // 財務サマリー
console.log(report.trades_executed);     // 取引履歴の配列
console.log(report.performance_rating);  // 'excellent' | 'good' | 'average' | 'poor'
console.log(report.recommendations);     // 推奨事項の配列
```

### 3. 複数港の在庫分析

```javascript
const analysis = await analyzePortInventories(portsData);

// 必ず以下の構造で返ってくる
console.log(analysis.best_routes);       // ルート情報の配列
console.log(analysis.market_insights);   // 市場洞察の配列
```

詳細な実装例は [`examples/structured-outputs-example.js`](../examples/structured-outputs-example.js) を参照してください。

## ⚠️ 重要な注意点

### 1. ベータヘッダーの指定

**必ず** `betas: ['structured-outputs-2025-11-13']` を指定してください。

```javascript
// ✅ 正しい
const message = await anthropic.messages.create({
    betas: ['structured-outputs-2025-11-13'],
    // ...
});

// ❌ 間違い（ベータヘッダーなし）
const message = await anthropic.messages.create({
    // betas が指定されていない
    // ...
});
```

### 2. required フィールドの指定

重要なフィールドは必ず `required` 配列に含めてください。

```javascript
// ✅ 推奨
{
    type: 'object',
    properties: {
        name: { type: 'string' },
        email: { type: 'string' }
    },
    required: ['name', 'email']  // 必須フィールドを明示
}

// ⚠️ 注意: required がないとフィールドが省略される可能性
{
    type: 'object',
    properties: {
        name: { type: 'string' },
        email: { type: 'string' }
    }
    // required がない
}
```

### 3. スキーマの複雑さ

- スキーマが複雑すぎると、レスポンスの生成に時間がかかる場合があります
- 適度な粒度でスキーマを設計してください

### 4. エラーハンドリング

```javascript
try {
    const message = await anthropic.messages.create({
        // ...
    });
    const result = JSON.parse(message.content[0].text);
} catch (error) {
    if (error.status === 400) {
        console.error('スキーマが無効です:', error.message);
    } else if (error.status === 429) {
        console.error('レート制限に達しました');
    } else {
        console.error('予期しないエラー:', error);
    }
}
```

## 🔧 デバッグのヒント

### 1. スキーマの検証

スキーマが正しいか確認するには、小さなテストケースから始めましょう：

```javascript
// シンプルなスキーマでテスト
const simpleSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' }
    },
    required: ['message']
};
```

### 2. レスポンスの確認

```javascript
console.log('Full response:', JSON.stringify(message, null, 2));
console.log('Content:', message.content[0].text);
```

### 3. スキーマのバリデーション

JSON Schema バリデータを使用して、スキーマ自体が正しいか確認：

```bash
npm install ajv
```

```javascript
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile(yourSchema);
const valid = validate(yourData);

if (!valid) {
    console.log(validate.errors);
}
```

## 📚 参考リンク

- [Anthropic 公式ドキュメント](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)
- [Anthropic ブログ: Structured Outputs 発表](https://www.claude.com/blog/structured-outputs-on-the-claude-developer-platform)
- [JSON Schema 仕様](https://json-schema.org/)
- [@anthropic-ai/sdk on npm](https://www.npmjs.com/package/@anthropic-ai/sdk)

## 💬 フィードバック

質問や問題がある場合は、GitHub Issues でお知らせください。

---

最終更新: 2025-11-15
