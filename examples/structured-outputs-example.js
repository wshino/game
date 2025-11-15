/**
 * Claude API Structured Outputs 実装例
 *
 * このファイルは、Anthropic Claude APIのStructured Outputs機能を
 * 大航海時代ゲームのコンテキストで使用する方法を示します。
 *
 * 必要なパッケージ:
 * npm install @anthropic-ai/sdk
 */

import Anthropic from '@anthropic-ai/sdk';

// APIクライアントの初期化
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 例1: JSON Schema を使用した取引アドバイスの取得
 *
 * この例では、ゲームの現在の状態を分析して、
 * 構造化された取引アドバイスを取得します。
 */
async function getTradingAdvice(gameState) {
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        // Structured Outputs のベータ版を有効化
        betas: ['structured-outputs-2025-11-13'],
        messages: [{
            role: 'user',
            content: `現在のゲーム状態を分析して、最適な取引戦略を提案してください。

現在地: ${gameState.currentPort}
所持金: ${gameState.money}円
船の容量: ${gameState.shipCapacity}
現在の積荷: ${JSON.stringify(gameState.cargo)}
港の価格情報: ${JSON.stringify(gameState.portPrices)}`
        }],
        // 構造化された出力形式を指定
        output_format: {
            type: 'json_schema',
            schema: {
                type: 'object',
                properties: {
                    recommended_purchases: {
                        type: 'array',
                        description: '購入を推奨する商品のリスト',
                        items: {
                            type: 'object',
                            properties: {
                                good_name: { type: 'string' },
                                quantity: { type: 'integer' },
                                reason: { type: 'string' }
                            },
                            required: ['good_name', 'quantity', 'reason']
                        }
                    },
                    recommended_destination: {
                        type: 'object',
                        description: '推奨される目的地',
                        properties: {
                            port_name: { type: 'string' },
                            expected_profit: { type: 'integer' },
                            reason: { type: 'string' }
                        },
                        required: ['port_name', 'expected_profit', 'reason']
                    },
                    risk_assessment: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                        description: 'この戦略のリスクレベル'
                    },
                    strategy_summary: {
                        type: 'string',
                        description: '戦略の要約'
                    }
                },
                required: ['recommended_purchases', 'recommended_destination', 'risk_assessment', 'strategy_summary']
            }
        }
    });

    // レスポンスから構造化されたデータを取得
    const advice = JSON.parse(message.content[0].text);
    return advice;
}

/**
 * 例2: Tool Use による航海レポートの生成
 *
 * この例では、Tool Use パターンを使用して
 * 構造化された航海レポートを生成します。
 */
async function generateVoyageReport(voyageData) {
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        betas: ['structured-outputs-2025-11-13'],
        messages: [{
            role: 'user',
            content: `以下の航海データから詳細なレポートを作成してください:
${JSON.stringify(voyageData, null, 2)}`
        }],
        // ツール定義を使用した構造化出力
        tools: [{
            name: 'create_voyage_report',
            description: '航海の詳細レポートを作成するツール',
            input_schema: {
                type: 'object',
                properties: {
                    voyage_summary: {
                        type: 'object',
                        properties: {
                            departure_port: { type: 'string' },
                            arrival_port: { type: 'string' },
                            duration_days: { type: 'integer' },
                            distance_km: { type: 'integer' }
                        },
                        required: ['departure_port', 'arrival_port', 'duration_days', 'distance_km']
                    },
                    financial_summary: {
                        type: 'object',
                        properties: {
                            starting_capital: { type: 'integer' },
                            ending_capital: { type: 'integer' },
                            total_profit: { type: 'integer' },
                            profit_percentage: { type: 'number' }
                        },
                        required: ['starting_capital', 'ending_capital', 'total_profit', 'profit_percentage']
                    },
                    trades_executed: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                port: { type: 'string' },
                                action: { type: 'string', enum: ['buy', 'sell'] },
                                good: { type: 'string' },
                                quantity: { type: 'integer' },
                                unit_price: { type: 'integer' },
                                total_value: { type: 'integer' }
                            },
                            required: ['port', 'action', 'good', 'quantity', 'unit_price', 'total_value']
                        }
                    },
                    performance_rating: {
                        type: 'string',
                        enum: ['excellent', 'good', 'average', 'poor'],
                        description: '航海の総合評価'
                    },
                    recommendations: {
                        type: 'array',
                        items: { type: 'string' },
                        description: '次回の航海への推奨事項'
                    }
                },
                required: ['voyage_summary', 'financial_summary', 'trades_executed', 'performance_rating', 'recommendations']
            }
        }],
        // 特定のツールの使用を強制
        tool_choice: {
            type: 'tool',
            name: 'create_voyage_report'
        }
    });

    // ツール呼び出しから構造化されたデータを取得
    const toolUse = message.content.find(block => block.type === 'tool_use');
    return toolUse.input;
}

/**
 * 例3: 港の在庫分析
 *
 * 複数の港の在庫状況を分析して、
 * 最適な取引ルートを提案します。
 */
async function analyzePortInventories(ports) {
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 2048,
        betas: ['structured-outputs-2025-11-13'],
        messages: [{
            role: 'user',
            content: `各港の在庫と価格を分析して、最も利益が出る取引ルートを提案してください:
${JSON.stringify(ports, null, 2)}`
        }],
        output_format: {
            type: 'json_schema',
            schema: {
                type: 'object',
                properties: {
                    best_routes: {
                        type: 'array',
                        description: '推奨される取引ルート',
                        items: {
                            type: 'object',
                            properties: {
                                route: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: '港の訪問順序'
                                },
                                goods_to_trade: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            good: { type: 'string' },
                                            buy_port: { type: 'string' },
                                            sell_port: { type: 'string' },
                                            profit_per_unit: { type: 'integer' }
                                        },
                                        required: ['good', 'buy_port', 'sell_port', 'profit_per_unit']
                                    }
                                },
                                estimated_profit: { type: 'integer' },
                                estimated_duration_days: { type: 'integer' },
                                difficulty: {
                                    type: 'string',
                                    enum: ['beginner', 'intermediate', 'advanced']
                                }
                            },
                            required: ['route', 'goods_to_trade', 'estimated_profit', 'estimated_duration_days', 'difficulty']
                        }
                    },
                    market_insights: {
                        type: 'array',
                        items: { type: 'string' },
                        description: '市場全体に関する洞察'
                    }
                },
                required: ['best_routes', 'market_insights']
            }
        }
    });

    return JSON.parse(message.content[0].text);
}

/**
 * 使用例
 */
async function main() {
    // 例1: 取引アドバイスの取得
    const gameState = {
        currentPort: 'リスボン',
        money: 50000,
        shipCapacity: 100,
        cargo: { '香辛料': 20 },
        portPrices: {
            'リスボン': { '香辛料': 5000, '絹': 3000 },
            'セビリア': { '香辛料': 6000, '絹': 2500 }
        }
    };

    console.log('=== 取引アドバイスの取得 ===');
    const advice = await getTradingAdvice(gameState);
    console.log(JSON.stringify(advice, null, 2));

    // 例2: 航海レポートの生成
    const voyageData = {
        departure: { port: 'リスボン', date: '1500-01-01' },
        arrival: { port: 'カリカット', date: '1500-02-15' },
        trades: [
            { port: 'リスボン', action: 'buy', good: '羊毛', quantity: 50, price: 200 },
            { port: 'カリカット', action: 'sell', good: '羊毛', quantity: 50, price: 800 }
        ],
        startingMoney: 50000,
        endingMoney: 80000
    };

    console.log('\n=== 航海レポートの生成 ===');
    const report = await generateVoyageReport(voyageData);
    console.log(JSON.stringify(report, null, 2));

    // 例3: 港の在庫分析
    const portsData = [
        {
            name: 'リスボン',
            inventory: { '羊毛': { stock: 100, price: 200 }, '絹': { stock: 50, price: 3000 } }
        },
        {
            name: 'カリカット',
            inventory: { '羊毛': { stock: 20, price: 800 }, '香辛料': { stock: 150, price: 3000 } }
        }
    ];

    console.log('\n=== 港の在庫分析 ===');
    const analysis = await analyzePortInventories(portsData);
    console.log(JSON.stringify(analysis, null, 2));
}

// エラーハンドリング付きで実行
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export {
    getTradingAdvice,
    generateVoyageReport,
    analyzePortInventories
};
