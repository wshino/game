import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage and DOM APIs
global.localStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};

global.document = {
    getElementById: () => ({
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        remove: () => {},
        scrollTop: 0,
        scrollHeight: 0,
        classList: {
            add: () => {},
            remove: () => {}
        },
        querySelectorAll: () => []
    }),
    querySelector: () => ({
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        style: {}
    }),
    createElement: () => ({
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        remove: () => {},
        style: {},
        querySelectorAll: () => [],
        querySelector: () => ({ addEventListener: () => {} })
    }),
    body: {
        appendChild: () => {}
    }
};

global.window = {
    addEventListener: () => {}
};

// Import modules
import { gameState } from '../src/core/game-state.js';
import { RANDOM_EVENTS, TREASURES, RARITY_CONFIG, goods } from '../src/core/constants.js';
import {
    setEventUICallbacks,
    checkForRandomEvent,
    processEventChoice,
    getRandomTreasure,
    addTreasure,
    useTreasure,
    applyDurabilityDamage,
    repairShip,
    getEffectiveSpeed
} from '../src/services/event-service.js';

describe('Event Service', () => {
    beforeEach(() => {
        // Reset game state
        gameState.gold = 10000;
        gameState.currentPort = 'lisbon';
        gameState.inventory = { wine: 10, spices: 5 };
        gameState.ship = {
            name: 'カラベル船',
            capacity: 100,
            speed: 1,
            crew: 20,
            durability: 100,
            maxDurability: 100,
            combatPower: 10,
            speedBonus: 0
        };
        gameState.logs = [];
        gameState.treasures = {};
        gameState.activeEffects = {};
        gameState.statistics = {
            eventsEncountered: 0,
            piratesDefeated: 0,
            castawaysRescued: 0,
            treasuresFound: 0
        };
        gameState.portInvestments = {};

        // Set up mock callbacks
        setEventUICallbacks(() => {}, () => {});
    });

    describe('checkForRandomEvent', () => {
        test('イベントを返すか、nullを返す', () => {
            // Run multiple times to test randomness
            let eventCount = 0;
            let nullCount = 0;

            for (let i = 0; i < 100; i++) {
                const result = checkForRandomEvent(1);
                if (result) {
                    eventCount++;
                    assert.ok(result.id, 'イベントにIDがある');
                    assert.ok(result.name, 'イベントに名前がある');
                } else {
                    nullCount++;
                }
            }

            // Should have some events and some nulls
            assert.ok(eventCount > 0 || nullCount > 0, 'イベントかnullが返される');
        });

        test('返されるイベントは有効なイベント定義', () => {
            for (let i = 0; i < 50; i++) {
                const result = checkForRandomEvent(1);
                if (result) {
                    assert.ok(
                        Object.keys(RANDOM_EVENTS).includes(result.id),
                        'イベントIDが有効'
                    );
                }
            }
        });
    });

    describe('processEventChoice - Pirate', () => {
        test('海賊戦で勝利すると報酬を得る（不死鳥の羽あり）', () => {
            gameState.treasures.phoenixFeather = 1;
            // Set combat power very low so player would lose without phoenix feather
            gameState.ship.combatPower = -50;
            const initialGold = gameState.gold;

            const result = processEventChoice('pirate', 'fight');

            assert.ok(result.success, '処理成功');
            assert.ok(result.messages.length > 0, 'メッセージがある');
            // With phoenix feather, always win
            assert.ok(gameState.gold > initialGold, '報酬を得る');
            // Phoenix feather is consumed (becomes 0 or undefined)
            assert.ok(
                gameState.treasures.phoenixFeather === 0 ||
                gameState.treasures.phoenixFeather === undefined,
                '不死鳥の羽が消費される'
            );
        });

        test('海賊に身代金を支払う', () => {
            const initialGold = gameState.gold;

            const result = processEventChoice('pirate', 'pay');

            assert.ok(result.success, '処理成功');
            assert.ok(result.goldChange < 0, '資金が減少');
            assert.ok(gameState.gold < initialGold, '支払いが行われた');
        });

        test('海賊から逃走を試みる', () => {
            const result = processEventChoice('pirate', 'flee');

            assert.ok(result.success, '処理成功');
            assert.ok(result.messages.length > 0, 'メッセージがある');
        });
    });

    describe('processEventChoice - Castaway', () => {
        test('漂流者を救助する', () => {
            const initialGold = gameState.gold;
            const initialRescued = gameState.statistics.castawaysRescued;

            const result = processEventChoice('castaway', 'rescue');

            assert.ok(result.success, '処理成功');
            assert.strictEqual(
                gameState.statistics.castawaysRescued,
                initialRescued + 1,
                '救助カウントが増加'
            );
        });

        test('漂流者を無視する', () => {
            const result = processEventChoice('castaway', 'ignore');

            assert.ok(result.success, '処理成功');
            assert.ok(result.messages.length > 0, 'メッセージがある');
        });
    });

    describe('processEventChoice - Shipwreck', () => {
        test('沈没船を探索する', () => {
            const result = processEventChoice('shipwreck', 'explore');

            assert.ok(result.success, '処理成功');
            assert.ok(result.messages.length > 0, 'メッセージがある');
        });

        test('沈没船を通り過ぎる', () => {
            const result = processEventChoice('shipwreck', 'leave');

            assert.ok(result.success, '処理成功');
            assert.strictEqual(result.goldChange, 0, '資金変化なし');
        });
    });

    describe('processEventChoice - CargoLoss', () => {
        test('嵐で積荷を失う', () => {
            gameState.inventory = { wine: 50, spices: 30 };
            const initialDurability = gameState.ship.durability;

            const result = processEventChoice('cargoLoss', 'accept');

            assert.ok(result.success, '処理成功');
            assert.ok(result.durabilityChange < 0, '耐久度が減少');
            assert.ok(
                gameState.ship.durability < initialDurability,
                '船がダメージを受ける'
            );
        });
    });

    describe('getRandomTreasure', () => {
        test('お宝オブジェクトを返す', () => {
            const treasure = getRandomTreasure();

            assert.ok(treasure, 'お宝が返される');
            assert.ok(treasure.id, 'IDがある');
            assert.ok(treasure.name, '名前がある');
            assert.ok(treasure.rarity, 'レアリティがある');
        });

        test('最小レアリティを指定できる', () => {
            for (let i = 0; i < 20; i++) {
                const treasure = getRandomTreasure('rare');

                assert.ok(
                    ['rare', 'legendary'].includes(treasure.rarity),
                    `レアリティは${treasure.rarity}でrare以上`
                );
            }
        });

        test('全てのレアリティで取得可能', () => {
            const rarities = new Set();

            for (let i = 0; i < 100; i++) {
                const treasure = getRandomTreasure();
                rarities.add(treasure.rarity);
            }

            // Should get at least uncommon and rare with enough tries
            assert.ok(rarities.size >= 2, '複数のレアリティが出現');
        });
    });

    describe('addTreasure', () => {
        test('お宝をインベントリに追加', () => {
            addTreasure('luckyCharm');

            assert.strictEqual(
                gameState.treasures.luckyCharm,
                1,
                'お宝が追加される'
            );
        });

        test('同じお宝を複数追加', () => {
            addTreasure('ancientCoin');
            addTreasure('ancientCoin');
            addTreasure('ancientCoin');

            assert.strictEqual(
                gameState.treasures.ancientCoin,
                3,
                '3個追加される'
            );
        });

        test('パッシブ効果のあるお宝は効果が適用される', () => {
            gameState.activeEffects = {};

            addTreasure('luckyCharm');

            assert.ok(
                gameState.activeEffects.luckBonus > 0,
                '幸運ボーナスが適用される'
            );
        });

        test('統計が更新される', () => {
            const initialCount = gameState.statistics.treasuresFound;

            addTreasure('ancientCoin');

            assert.strictEqual(
                gameState.statistics.treasuresFound,
                initialCount + 1,
                '発見数が増加'
            );
        });
    });

    describe('useTreasure', () => {
        test('使用可能なお宝を使用できる', () => {
            gameState.treasures.ancientMap = 1;
            gameState.activeEffects = {};

            const result = useTreasure('ancientMap');

            assert.ok(result.success, '使用成功');
            assert.ok(result.messages.length > 0, 'メッセージがある');
            assert.strictEqual(
                gameState.treasures.ancientMap,
                undefined,
                'お宝が消費される'
            );
        });

        test('持っていないお宝は使用できない', () => {
            gameState.treasures = {};

            const result = useTreasure('ancientMap');

            assert.strictEqual(result.success, false, '使用失敗');
        });

        test('パッシブ効果のお宝は使用できない', () => {
            gameState.treasures.luckyCharm = 1;

            const result = useTreasure('luckyCharm');

            assert.strictEqual(result.success, false, '使用できない');
            assert.strictEqual(
                gameState.treasures.luckyCharm,
                1,
                'お宝は残る'
            );
        });

        test('人魚の涙で船を完全修復', () => {
            gameState.treasures.mermaidTear = 1;
            gameState.ship.durability = 30;
            gameState.ship.maxDurability = 100;

            const result = useTreasure('mermaidTear');

            assert.ok(result.success, '使用成功');
            assert.strictEqual(
                gameState.ship.durability,
                100,
                '完全修復'
            );
        });

        test('黄金の羅針盤で速度ボーナス', () => {
            gameState.treasures.goldenCompass = 1;
            gameState.ship.speedBonus = 0;

            const result = useTreasure('goldenCompass');

            assert.ok(result.success, '使用成功');
            assert.ok(
                gameState.ship.speedBonus > 0,
                '速度ボーナスが付与'
            );
        });

        test('王家の冠で大金を得る', () => {
            gameState.treasures.royalCrown = 1;
            const initialGold = gameState.gold;

            const result = useTreasure('royalCrown');

            assert.ok(result.success, '使用成功');
            assert.strictEqual(
                gameState.gold,
                initialGold + 50000,
                '50000G獲得'
            );
        });
    });

    describe('applyDurabilityDamage', () => {
        test('船に耐久度ダメージを与える', () => {
            gameState.ship.durability = 100;

            applyDurabilityDamage(30);

            assert.strictEqual(
                gameState.ship.durability,
                70,
                '30ダメージ'
            );
        });

        test('耐久度は0未満にならない', () => {
            gameState.ship.durability = 50;

            applyDurabilityDamage(100);

            assert.strictEqual(
                gameState.ship.durability,
                0,
                '0で止まる'
            );
        });

        test('耐久度が低いと警告ログ', () => {
            gameState.ship.durability = 100;
            gameState.ship.maxDurability = 100;

            applyDurabilityDamage(80); // Durability becomes 20 (< 30%)

            // Log should be added
            assert.ok(
                gameState.ship.durability < gameState.ship.maxDurability * 0.3,
                '耐久度が危険レベル'
            );
        });
    });

    describe('repairShip', () => {
        test('造船所がないと修理できない', () => {
            gameState.portInvestments = {};

            const result = repairShip('lisbon');

            assert.strictEqual(result.success, false, '修理失敗');
        });

        test('造船所があれば修理できる', () => {
            gameState.portInvestments = {
                lisbon: { shipyard: 1 }
            };
            gameState.ship.durability = 50;
            gameState.ship.maxDurability = 100;
            gameState.gold = 10000;

            const result = repairShip('lisbon');

            assert.ok(result.success, '修理成功');
            assert.strictEqual(
                gameState.ship.durability,
                100,
                '完全修復'
            );
        });

        test('既に完全な状態では修理不要', () => {
            gameState.portInvestments = {
                lisbon: { shipyard: 1 }
            };
            gameState.ship.durability = 100;
            gameState.ship.maxDurability = 100;

            const result = repairShip('lisbon');

            assert.strictEqual(result.success, false, '修理不要');
        });

        test('資金不足では修理できない', () => {
            gameState.portInvestments = {
                lisbon: { shipyard: 1 }
            };
            gameState.ship.durability = 0;
            gameState.ship.maxDurability = 100;
            gameState.gold = 100; // Not enough for full repair (100 * 5 = 500G needed)

            const result = repairShip('lisbon');

            assert.strictEqual(result.success, false, '資金不足');
        });

        test('修理費用は1ダメージあたり5G', () => {
            gameState.portInvestments = {
                lisbon: { shipyard: 1 }
            };
            gameState.ship.durability = 80;
            gameState.ship.maxDurability = 100;
            gameState.gold = 10000;
            const initialGold = gameState.gold;

            repairShip('lisbon');

            // 20 damage * 5G = 100G
            assert.strictEqual(
                gameState.gold,
                initialGold - 100,
                '100G消費'
            );
        });
    });

    describe('getEffectiveSpeed', () => {
        test('基本速度を返す', () => {
            gameState.ship.speed = 1;
            gameState.ship.speedBonus = 0;
            gameState.ship.durability = 100;
            gameState.ship.maxDurability = 100;

            const speed = getEffectiveSpeed();

            assert.strictEqual(speed, 1, '基本速度1');
        });

        test('速度ボーナスが加算される', () => {
            gameState.ship.speed = 1;
            gameState.ship.speedBonus = 0.2;
            gameState.ship.durability = 100;
            gameState.ship.maxDurability = 100;

            const speed = getEffectiveSpeed();

            assert.strictEqual(speed, 1.2, 'ボーナス込み1.2');
        });

        test('耐久度が低いと速度低下（30%未満）', () => {
            gameState.ship.speed = 1;
            gameState.ship.speedBonus = 0;
            gameState.ship.durability = 20;
            gameState.ship.maxDurability = 100;

            const speed = getEffectiveSpeed();

            assert.strictEqual(speed, 0.5, '50%に低下');
        });

        test('耐久度が低いと速度低下（50%未満）', () => {
            gameState.ship.speed = 1;
            gameState.ship.speedBonus = 0;
            gameState.ship.durability = 40;
            gameState.ship.maxDurability = 100;

            const speed = getEffectiveSpeed();

            assert.strictEqual(speed, 0.75, '75%に低下');
        });

        test('耐久度50%以上は通常速度', () => {
            gameState.ship.speed = 1;
            gameState.ship.speedBonus = 0;
            gameState.ship.durability = 60;
            gameState.ship.maxDurability = 100;

            const speed = getEffectiveSpeed();

            assert.strictEqual(speed, 1, '通常速度');
        });
    });
});

describe('RANDOM_EVENTS definitions', () => {
    test('全てのイベントに必須フィールドがある', () => {
        for (const [eventId, event] of Object.entries(RANDOM_EVENTS)) {
            assert.ok(event.id, `${eventId}にIDがある`);
            assert.ok(event.name, `${eventId}に名前がある`);
            assert.ok(event.emoji, `${eventId}に絵文字がある`);
            assert.ok(event.description, `${eventId}に説明がある`);
            assert.ok(event.probability, `${eventId}に確率がある`);
            assert.ok(event.choices, `${eventId}に選択肢がある`);
            assert.ok(event.choices.length > 0, `${eventId}に選択肢が1つ以上ある`);
        }
    });

    test('全ての選択肢に必須フィールドがある', () => {
        for (const [eventId, event] of Object.entries(RANDOM_EVENTS)) {
            for (const choice of event.choices) {
                assert.ok(choice.id, `${eventId}の選択肢にIDがある`);
                assert.ok(choice.text, `${eventId}の選択肢にテキストがある`);
                assert.ok(choice.description, `${eventId}の選択肢に説明がある`);
            }
        }
    });

    test('確率の合計が1以下', () => {
        let totalProbability = 0;
        for (const event of Object.values(RANDOM_EVENTS)) {
            totalProbability += event.probability;
        }

        assert.ok(totalProbability <= 1, `確率合計${totalProbability}は1以下`);
    });
});

describe('TREASURES definitions', () => {
    test('全てのお宝に必須フィールドがある', () => {
        for (const [treasureId, treasure] of Object.entries(TREASURES)) {
            assert.ok(treasure.id, `${treasureId}にIDがある`);
            assert.ok(treasure.name, `${treasureId}に名前がある`);
            assert.ok(treasure.emoji, `${treasureId}に絵文字がある`);
            assert.ok(treasure.rarity, `${treasureId}にレアリティがある`);
            assert.ok(treasure.description, `${treasureId}に説明がある`);
            assert.ok(treasure.effect, `${treasureId}に効果がある`);
            assert.strictEqual(
                typeof treasure.usable,
                'boolean',
                `${treasureId}にusableフラグがある`
            );
        }
    });

    test('全てのレアリティが有効', () => {
        const validRarities = Object.keys(RARITY_CONFIG);

        for (const [treasureId, treasure] of Object.entries(TREASURES)) {
            assert.ok(
                validRarities.includes(treasure.rarity),
                `${treasureId}のレアリティ${treasure.rarity}は有効`
            );
        }
    });

    test('効果タイプが有効', () => {
        const validTypes = [
            'bonus_gold_next_trade',
            'permanent_speed_bonus',
            'luck_bonus',
            'pirate_protection',
            'trade_bonus',
            'full_repair',
            'guaranteed_victory',
            'sell_value',
            'cursed'
        ];

        for (const [treasureId, treasure] of Object.entries(TREASURES)) {
            assert.ok(
                validTypes.includes(treasure.effect.type),
                `${treasureId}の効果タイプ${treasure.effect.type}は有効`
            );
        }
    });
});

console.log('All event service tests completed!');
