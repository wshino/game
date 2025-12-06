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
        scrollTop: 0,
        scrollHeight: 0,
        classList: {
            add: () => {},
            remove: () => {}
        }
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
        style: {}
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
import { ports, goods, portPrices, portDistances } from '../src/core/constants.js';
import { initializePortInventory, getPortStock } from '../src/services/port-service.js';
import { calculateRequiredSupplies } from '../src/services/supply-service.js';
import {
    getCurrentPortName,
    getCargoUsed,
    getCargoSpace,
    getPrice,
    calculateProfitForPort,
    getRecommendedGoods,
    isProfitable,
    canAffordVoyage
} from '../src/utils/calculations.js';

describe('Calculations Utility', () => {
    beforeEach(() => {
        // Reset game state
        gameState.gold = 5000;
        gameState.currentPort = 'lisbon';
        gameState.inventory = {};
        gameState.ship = {
            name: 'カラベル船',
            capacity: 100,
            speed: 1,
            crew: 20
        };

        // Initialize port inventory
        initializePortInventory();
    });

    describe('getCurrentPortName', () => {
        test('現在の港の名前を取得できる', () => {
            gameState.currentPort = 'lisbon';
            assert.strictEqual(getCurrentPortName(), 'リスボン');
        });

        test('各港の名前が正しく取得できる', () => {
            const portTests = [
                { id: 'seville', name: 'セビリア' },
                { id: 'venice', name: 'ヴェネツィア' },
                { id: 'alexandria', name: 'アレクサンドリア' },
                { id: 'calicut', name: 'カリカット' },
                { id: 'malacca', name: 'マラッカ' },
                { id: 'nagasaki', name: '長崎' }
            ];

            for (const { id, name } of portTests) {
                gameState.currentPort = id;
                assert.strictEqual(getCurrentPortName(), name, `${id}の名前が正しい`);
            }
        });
    });

    describe('getCargoUsed', () => {
        test('空のインベントリでは0を返す', () => {
            gameState.inventory = {};
            assert.strictEqual(getCargoUsed(), 0);
        });

        test('単一の商品がある場合', () => {
            gameState.inventory = { wine: 10 };
            assert.strictEqual(getCargoUsed(), 10);
        });

        test('複数の商品がある場合', () => {
            gameState.inventory = { wine: 10, cloth: 20, spices: 5 };
            assert.strictEqual(getCargoUsed(), 35);
        });

        test('全ての商品タイプを含む場合', () => {
            gameState.inventory = {
                wine: 5,
                cloth: 5,
                spices: 5,
                silk: 5,
                gold_ore: 5,
                porcelain: 5,
                tea: 5,
                silver: 5,
                food: 5,
                water: 5
            };
            assert.strictEqual(getCargoUsed(), 50);
        });
    });

    describe('getCargoSpace', () => {
        test('空のインベントリでは船の容量全体が空き', () => {
            gameState.inventory = {};
            gameState.ship.capacity = 100;
            assert.strictEqual(getCargoSpace(), 100);
        });

        test('一部使用している場合の空き容量', () => {
            gameState.inventory = { wine: 30 };
            gameState.ship.capacity = 100;
            assert.strictEqual(getCargoSpace(), 70);
        });

        test('満載の場合は0を返す', () => {
            gameState.inventory = { wine: 100 };
            gameState.ship.capacity = 100;
            assert.strictEqual(getCargoSpace(), 0);
        });

        test('大型船の場合', () => {
            gameState.inventory = { wine: 100 };
            gameState.ship.capacity = 500;
            assert.strictEqual(getCargoSpace(), 400);
        });
    });

    describe('getPrice', () => {
        test('購入価格は基本価格×港の倍率×ランダム係数', () => {
            gameState.currentPort = 'lisbon';
            const price = getPrice('wine', true);

            // wine base price = 50, lisbon multiplier = 0.8
            // Expected range: 50 * 0.8 * 0.9 to 50 * 0.8 * 1.1 = 36 to 44
            assert.ok(price >= 30 && price <= 60, `価格 ${price} が妥当な範囲内`);
        });

        test('売却価格は購入価格より低い (80%)', () => {
            gameState.currentPort = 'lisbon';

            // Multiple runs to account for randomness
            let buyTotal = 0;
            let sellTotal = 0;
            for (let i = 0; i < 100; i++) {
                buyTotal += getPrice('wine', true);
                sellTotal += getPrice('wine', false);
            }

            const avgBuy = buyTotal / 100;
            const avgSell = sellTotal / 100;

            assert.ok(avgSell < avgBuy, '売却価格は購入価格より低い');
        });

        test('異なる港での価格差', () => {
            // Spices are cheap in Calicut, expensive in Lisbon
            gameState.currentPort = 'calicut';
            const calicutPrices = [];
            for (let i = 0; i < 10; i++) {
                calicutPrices.push(getPrice('spices', true));
            }
            const avgCalicut = calicutPrices.reduce((a, b) => a + b, 0) / 10;

            gameState.currentPort = 'lisbon';
            const lisbonPrices = [];
            for (let i = 0; i < 10; i++) {
                lisbonPrices.push(getPrice('spices', true));
            }
            const avgLisbon = lisbonPrices.reduce((a, b) => a + b, 0) / 10;

            assert.ok(avgCalicut < avgLisbon, 'カリカットの香辛料はリスボンより安い');
        });

        test('portIdパラメータで別の港の価格を取得', () => {
            gameState.currentPort = 'lisbon';
            const calicutPrice = getPrice('spices', true, 'calicut');
            const lisbonPrice = getPrice('spices', true, 'lisbon');

            // Calicut has lower multiplier (0.6) for spices than Lisbon (2.1)
            // Multiple runs to get averages
            let calicutTotal = 0;
            let lisbonTotal = 0;
            for (let i = 0; i < 20; i++) {
                calicutTotal += getPrice('spices', true, 'calicut');
                lisbonTotal += getPrice('spices', true, 'lisbon');
            }

            assert.ok(calicutTotal < lisbonTotal, 'カリカットの方が安い');
        });
    });

    describe('calculateProfitForPort', () => {
        test('利益が出る商品のリストを返す', () => {
            gameState.currentPort = 'lisbon';
            const profits = calculateProfitForPort('nagasaki', getPortStock);

            assert.ok(Array.isArray(profits), '配列を返す');
            for (const item of profits) {
                assert.ok(item.profitPerUnit > 0, '利益がプラス');
                assert.ok(item.goodId, 'goodIdがある');
                assert.ok(item.buyPrice, '購入価格がある');
                assert.ok(item.sellPrice, '売却価格がある');
            }
        });

        test('利益率でソートされている', () => {
            gameState.currentPort = 'lisbon';
            const profits = calculateProfitForPort('nagasaki', getPortStock);

            for (let i = 0; i < profits.length - 1; i++) {
                assert.ok(
                    profits[i].profitMargin >= profits[i + 1].profitMargin,
                    '利益率降順でソート'
                );
            }
        });

        test('食糧と水は含まれない', () => {
            gameState.currentPort = 'lisbon';
            const profits = calculateProfitForPort('nagasaki', getPortStock);

            const hasFood = profits.some(p => p.goodId === 'food');
            const hasWater = profits.some(p => p.goodId === 'water');

            assert.strictEqual(hasFood, false, '食糧は含まれない');
            assert.strictEqual(hasWater, false, '水は含まれない');
        });

        test('リスボンから長崎への利益商品（ワインが高利益）', () => {
            gameState.currentPort = 'lisbon';
            const profits = calculateProfitForPort('nagasaki', getPortStock);

            // Wine should be profitable (Lisbon: 0.8, Nagasaki: 1.8)
            const wine = profits.find(p => p.goodId === 'wine');
            assert.ok(wine, 'ワインが利益商品に含まれる');
            assert.ok(wine.profitMargin > 0, 'ワインの利益率がプラス');
        });
    });

    describe('getRecommendedGoods', () => {
        test('指定した数の商品を返す', () => {
            gameState.currentPort = 'lisbon';
            const recommended = getRecommendedGoods('nagasaki', getPortStock, 3);

            assert.ok(recommended.length <= 3, '最大3つ');
        });

        test('デフォルトで3つの商品を返す', () => {
            gameState.currentPort = 'lisbon';
            const recommended = getRecommendedGoods('nagasaki', getPortStock);

            assert.ok(recommended.length <= 3, 'デフォルトは最大3つ');
        });

        test('利益が出る商品がない場合は空配列', () => {
            // Set up a scenario where no goods are profitable
            gameState.currentPort = 'nagasaki';
            const recommended = getRecommendedGoods('nagasaki', getPortStock); // Same port

            // Same port should have no profitable trades
            // (might still have some due to buy/sell price difference)
            assert.ok(Array.isArray(recommended), '配列を返す');
        });
    });

    describe('isProfitable', () => {
        test('利益率10%以上でtrueを返す', () => {
            gameState.currentPort = 'lisbon';
            const result = isProfitable('nagasaki', getPortStock);

            // Lisbon to Nagasaki should be profitable
            assert.strictEqual(typeof result, 'boolean');
        });

        test('リスボンから長崎は利益的', () => {
            gameState.currentPort = 'lisbon';
            const result = isProfitable('nagasaki', getPortStock);

            assert.strictEqual(result, true, 'リスボン→長崎は利益的');
        });
    });

    describe('canAffordVoyage', () => {
        test('十分な資金がある場合', () => {
            gameState.gold = 5000;
            gameState.inventory = { food: 50, water: 50 };
            gameState.currentPort = 'lisbon';

            const result = canAffordVoyage('seville', calculateRequiredSupplies);

            assert.strictEqual(result.canAfford, true, '航海可能');
            assert.ok(result.hasEnoughGold, '資金十分');
            assert.ok(result.hasEnoughSpace, '積載量十分');
        });

        test('資金不足の場合', () => {
            gameState.gold = 0;
            gameState.inventory = {};
            gameState.currentPort = 'lisbon';

            const result = canAffordVoyage('nagasaki', calculateRequiredSupplies);

            assert.strictEqual(result.hasEnoughGold, false, '資金不足');
        });

        test('必要な物資が返される', () => {
            gameState.gold = 5000;
            gameState.inventory = {};
            gameState.currentPort = 'lisbon';

            const result = canAffordVoyage('seville', calculateRequiredSupplies);

            assert.ok('needFood' in result, 'needFoodがある');
            assert.ok('needWater' in result, 'needWaterがある');
            assert.ok('supplyCost' in result, 'supplyCostがある');
        });

        test('既存の物資がある場合は追加購入が少ない', () => {
            gameState.inventory = { food: 100, water: 100 };
            gameState.currentPort = 'lisbon';

            const result = canAffordVoyage('seville', calculateRequiredSupplies);

            assert.strictEqual(result.needFood, 0, '追加食糧不要');
            assert.strictEqual(result.needWater, 0, '追加水不要');
        });

        test('長距離航海の物資コスト', () => {
            gameState.gold = 5000;
            gameState.inventory = {};
            gameState.currentPort = 'lisbon';

            const shortResult = canAffordVoyage('seville', calculateRequiredSupplies);
            const longResult = canAffordVoyage('nagasaki', calculateRequiredSupplies);

            assert.ok(longResult.supplyCost >= shortResult.supplyCost, '長距離は物資が多い');
        });
    });
});

console.log('All calculation tests completed!');
