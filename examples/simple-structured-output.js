/**
 * シンプルな Structured Outputs の例
 *
 * この例は最小限のコードで Structured Outputs の使い方を示します。
 *
 * セットアップ:
 * 1. npm install @anthropic-ai/sdk
 * 2. export ANTHROPIC_API_KEY='your-api-key'
 * 3. node examples/simple-structured-output.js
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 例1: 最もシンプルな構造化出力
 */
async function simpleExample() {
    console.log('=== シンプルな構造化出力の例 ===\n');

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        betas: ['structured-outputs-2025-11-13'],
        messages: [{
            role: 'user',
            content: '東京の天気について教えてください'
        }],
        output_format: {
            type: 'json_schema',
            schema: {
                type: 'object',
                properties: {
                    location: { type: 'string' },
                    weather: { type: 'string' },
                    temperature: { type: 'integer' }
                },
                required: ['location', 'weather', 'temperature']
            }
        }
    });

    const result = JSON.parse(message.content[0].text);
    console.log('結果:', result);
    console.log('型チェック:');
    console.log('  location は string?', typeof result.location === 'string');
    console.log('  weather は string?', typeof result.weather === 'string');
    console.log('  temperature は number?', typeof result.temperature === 'number');
}

/**
 * 例2: 配列を含む構造化出力
 */
async function arrayExample() {
    console.log('\n=== 配列を含む構造化出力の例 ===\n');

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        betas: ['structured-outputs-2025-11-13'],
        messages: [{
            role: 'user',
            content: '人気のプログラミング言語を5つ教えて、それぞれの特徴を簡潔に説明してください'
        }],
        output_format: {
            type: 'json_schema',
            schema: {
                type: 'object',
                properties: {
                    languages: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                description: { type: 'string' },
                                difficulty: {
                                    type: 'string',
                                    enum: ['beginner', 'intermediate', 'advanced']
                                }
                            },
                            required: ['name', 'description', 'difficulty']
                        }
                    }
                },
                required: ['languages']
            }
        }
    });

    const result = JSON.parse(message.content[0].text);
    console.log('結果:');
    result.languages.forEach((lang, index) => {
        console.log(`${index + 1}. ${lang.name} (難易度: ${lang.difficulty})`);
        console.log(`   ${lang.description}`);
    });
}

/**
 * 例3: Enum を使った厳密な型制約
 */
async function enumExample() {
    console.log('\n=== Enum を使った厳密な型制約の例 ===\n');

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        betas: ['structured-outputs-2025-11-13'],
        messages: [{
            role: 'user',
            content: 'この文章を分析してください: "今日は素晴らしい一日でした！"'
        }],
        output_format: {
            type: 'json_schema',
            schema: {
                type: 'object',
                properties: {
                    sentiment: {
                        type: 'string',
                        enum: ['positive', 'neutral', 'negative'],
                        description: '文章の感情'
                    },
                    confidence: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                        description: '判定の確信度'
                    },
                    language: {
                        type: 'string',
                        enum: ['japanese', 'english', 'other']
                    },
                    summary: {
                        type: 'string',
                        description: '文章の要約'
                    }
                },
                required: ['sentiment', 'confidence', 'language', 'summary']
            }
        }
    });

    const result = JSON.parse(message.content[0].text);
    console.log('分析結果:', result);
    console.log('\n感情:', result.sentiment);
    console.log('確信度:', result.confidence);
    console.log('言語:', result.language);
    console.log('要約:', result.summary);
}

/**
 * 例4: Tool Use パターン
 */
async function toolUseExample() {
    console.log('\n=== Tool Use パターンの例 ===\n');

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        betas: ['structured-outputs-2025-11-13'],
        messages: [{
            role: 'user',
            content: '太郎（25歳、エンジニア）という人物のプロフィールを作成してください'
        }],
        tools: [{
            name: 'create_profile',
            description: 'ユーザープロフィールを作成',
            input_schema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'integer', minimum: 0, maximum: 150 },
                    occupation: { type: 'string' },
                    skills: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    experience_level: {
                        type: 'string',
                        enum: ['junior', 'mid', 'senior', 'expert']
                    }
                },
                required: ['name', 'age', 'occupation', 'skills', 'experience_level']
            }
        }],
        tool_choice: {
            type: 'tool',
            name: 'create_profile'
        }
    });

    const toolUse = message.content.find(block => block.type === 'tool_use');
    console.log('プロフィール:', toolUse.input);
    console.log('\n名前:', toolUse.input.name);
    console.log('年齢:', toolUse.input.age);
    console.log('職業:', toolUse.input.occupation);
    console.log('スキル:', toolUse.input.skills.join(', '));
    console.log('経験レベル:', toolUse.input.experience_level);
}

/**
 * 例5: ネストされたオブジェクト
 */
async function nestedObjectExample() {
    console.log('\n=== ネストされたオブジェクトの例 ===\n');

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        betas: ['structured-outputs-2025-11-13'],
        messages: [{
            role: 'user',
            content: '架空のレストランの情報を作成してください'
        }],
        output_format: {
            type: 'json_schema',
            schema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    cuisine: { type: 'string' },
                    rating: { type: 'number', minimum: 1, maximum: 5 },
                    location: {
                        type: 'object',
                        properties: {
                            city: { type: 'string' },
                            country: { type: 'string' },
                            address: { type: 'string' }
                        },
                        required: ['city', 'country', 'address']
                    },
                    menu_highlights: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                dish: { type: 'string' },
                                price: { type: 'integer' },
                                description: { type: 'string' }
                            },
                            required: ['dish', 'price', 'description']
                        }
                    }
                },
                required: ['name', 'cuisine', 'rating', 'location', 'menu_highlights']
            }
        }
    });

    const result = JSON.parse(message.content[0].text);
    console.log(`レストラン: ${result.name}`);
    console.log(`料理: ${result.cuisine}`);
    console.log(`評価: ${result.rating}/5`);
    console.log(`所在地: ${result.location.city}, ${result.location.country}`);
    console.log(`住所: ${result.location.address}`);
    console.log('\nおすすめメニュー:');
    result.menu_highlights.forEach((item, index) => {
        console.log(`${index + 1}. ${item.dish} - ¥${item.price}`);
        console.log(`   ${item.description}`);
    });
}

/**
 * すべての例を実行
 */
async function main() {
    try {
        await simpleExample();
        await arrayExample();
        await enumExample();
        await toolUseExample();
        await nestedObjectExample();

        console.log('\n=== すべての例が正常に完了しました ===');
    } catch (error) {
        console.error('エラーが発生しました:', error.message);
        if (error.status) {
            console.error('ステータスコード:', error.status);
        }
    }
}

// APIキーのチェック
if (!process.env.ANTHROPIC_API_KEY) {
    console.error('エラー: ANTHROPIC_API_KEY 環境変数が設定されていません');
    console.error('実行方法: export ANTHROPIC_API_KEY="your-api-key"');
    process.exit(1);
}

main();
