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
import { portInventory } from '../src/core/game-state.js';
import { ports, inventorySettings, goods } from '../src/core/constants.js';
import {
    initializePortInventory,
    refreshPortInventory,
    getPortStock,
    reducePortStock
} from '../src/services/port-service.js';

describe('Port Service', () => {
    beforeEach(() => {
        // Clear port inventory
        for (const portId in portInventory) {
            delete portInventory[portId];
        }
    });

    describe('initializePortInventory', () => {
        test('全ての港の在庫が初期化される', () => {
            initializePortInventory();

            for (const portId in ports) {
                assert.ok(portInventory[portId], `${portId}の在庫が存在する`);
            }
        });

        test('港のサイズに応じた最大在庫が設定される', () => {
            initializePortInventory();

            // 長崎 (small) - maxStock: 30
            assert.strictEqual(
                portInventory.nagasaki.wine,
                inventorySettings.small.maxStock,
                '長崎は30個'
            );

            // リスボン (large) - maxStock: 100
            assert.strictEqual(
                portInventory.lisbon.wine,
                inventorySettings.large.maxStock,
                'リスボンは100個'
            );

            // ヴェネツィア (very_large) - maxStock: 150
            assert.strictEqual(
                portInventory.venice.wine,
                inventorySettings.very_large.maxStock,
                'ヴェネツィアは150個'
            );

            // アレクサンドリア (medium) - maxStock: 60
            assert.strictEqual(
                portInventory.alexandria.wine,
                inventorySettings.medium.maxStock,
                'アレクサンドリアは60個'
            );
        });

        test('全ての商品タイプが初期化される', () => {
            initializePortInventory();

            for (const goodId in goods) {
                assert.ok(
                    portInventory.lisbon[goodId] !== undefined,
                    `${goodId}が初期化されている`
                );
            }
        });
    });

    describe('getPortStock', () => {
        beforeEach(() => {
            initializePortInventory();
        });

        test('存在する商品の在庫を取得できる', () => {
            const stock = getPortStock('lisbon', 'wine');
            assert.strictEqual(stock, 100, 'リスボンのワイン在庫');
        });

        test('存在しない港は0を返す', () => {
            const stock = getPortStock('unknown_port', 'wine');
            assert.strictEqual(stock, 0, '存在しない港は0');
        });

        test('存在しない商品は0を返す', () => {
            const stock = getPortStock('lisbon', 'unknown_good');
            assert.strictEqual(stock, 0, '存在しない商品は0');
        });

        test('各港サイズの在庫を確認', () => {
            const portSizeTests = [
                { port: 'nagasaki', expected: 30 },     // small
                { port: 'alexandria', expected: 60 },  // medium
                { port: 'calicut', expected: 60 },     // medium
                { port: 'malacca', expected: 60 },     // medium
                { port: 'lisbon', expected: 100 },     // large
                { port: 'seville', expected: 100 },    // large
                { port: 'venice', expected: 150 }      // very_large
            ];

            for (const { port, expected } of portSizeTests) {
                assert.strictEqual(
                    getPortStock(port, 'wine'),
                    expected,
                    `${port}の在庫は${expected}`
                );
            }
        });
    });

    describe('reducePortStock', () => {
        beforeEach(() => {
            initializePortInventory();
        });

        test('在庫を減らせる', () => {
            const initialStock = getPortStock('lisbon', 'wine');
            reducePortStock('lisbon', 'wine', 10);
            assert.strictEqual(
                getPortStock('lisbon', 'wine'),
                initialStock - 10,
                '10個減少'
            );
        });

        test('在庫は0未満にならない', () => {
            reducePortStock('lisbon', 'wine', 200); // More than stock
            assert.strictEqual(
                getPortStock('lisbon', 'wine'),
                0,
                '0以下にはならない'
            );
        });

        test('存在しない港でも在庫を作成して減らせる', () => {
            // Clear and don't initialize
            for (const portId in portInventory) {
                delete portInventory[portId];
            }

            reducePortStock('new_port', 'wine', 10);
            assert.strictEqual(
                getPortStock('new_port', 'wine'),
                0,
                '0になる（負にならない）'
            );
        });

        test('複数回減らせる', () => {
            const initialStock = getPortStock('lisbon', 'wine');
            reducePortStock('lisbon', 'wine', 5);
            reducePortStock('lisbon', 'wine', 5);
            reducePortStock('lisbon', 'wine', 5);

            assert.strictEqual(
                getPortStock('lisbon', 'wine'),
                initialStock - 15,
                '15個減少'
            );
        });
    });

    describe('refreshPortInventory', () => {
        beforeEach(() => {
            initializePortInventory();
        });

        test('時間経過で在庫が回復する', () => {
            // Reduce stock first
            reducePortStock('lisbon', 'wine', 50);
            const reducedStock = getPortStock('lisbon', 'wine');

            // Refresh with 1 day passed
            refreshPortInventory(1);

            const refreshedStock = getPortStock('lisbon', 'wine');

            // large port refreshRate = 8
            assert.strictEqual(
                refreshedStock,
                reducedStock + 8,
                '1日で8個回復'
            );
        });

        test('最大在庫を超えない', () => {
            // Stock is already at max
            const initialStock = getPortStock('lisbon', 'wine');

            refreshPortInventory(100); // Many days

            assert.strictEqual(
                getPortStock('lisbon', 'wine'),
                initialStock,
                '最大在庫を超えない'
            );
        });

        test('港のサイズに応じた回復率', () => {
            // Reduce stock at different sized ports
            reducePortStock('nagasaki', 'wine', 20);    // small: refreshRate 3
            reducePortStock('alexandria', 'wine', 40); // medium: refreshRate 5
            reducePortStock('lisbon', 'wine', 50);     // large: refreshRate 8
            reducePortStock('venice', 'wine', 100);    // very_large: refreshRate 12

            refreshPortInventory(1);

            // Check each port recovered correctly
            assert.strictEqual(
                getPortStock('nagasaki', 'wine'),
                30 - 20 + 3,
                '長崎: 3個回復'
            );
            assert.strictEqual(
                getPortStock('alexandria', 'wine'),
                60 - 40 + 5,
                'アレクサンドリア: 5個回復'
            );
            assert.strictEqual(
                getPortStock('lisbon', 'wine'),
                100 - 50 + 8,
                'リスボン: 8個回復'
            );
            assert.strictEqual(
                getPortStock('venice', 'wine'),
                150 - 100 + 12,
                'ヴェネツィア: 12個回復'
            );
        });

        test('複数日の回復', () => {
            reducePortStock('lisbon', 'wine', 50);
            const reducedStock = getPortStock('lisbon', 'wine');

            refreshPortInventory(5); // 5 days

            // large port refreshRate = 8, so 8 * 5 = 40
            assert.strictEqual(
                getPortStock('lisbon', 'wine'),
                reducedStock + 40,
                '5日で40個回復'
            );
        });

        test('全ての港が同時に回復する', () => {
            // Reduce stock at multiple ports
            for (const portId in ports) {
                reducePortStock(portId, 'wine', 20);
            }

            refreshPortInventory(1);

            // All ports should have recovered
            for (const portId in ports) {
                const portSize = ports[portId].size;
                const refreshRate = inventorySettings[portSize].refreshRate;
                const maxStock = inventorySettings[portSize].maxStock;
                const expected = Math.min(maxStock, maxStock - 20 + refreshRate);

                assert.strictEqual(
                    getPortStock(portId, 'wine'),
                    expected,
                    `${portId}が正しく回復`
                );
            }
        });

        test('全ての商品が回復する', () => {
            // Reduce multiple goods
            for (const goodId in goods) {
                reducePortStock('lisbon', goodId, 30);
            }

            refreshPortInventory(1);

            // All goods should have recovered
            for (const goodId in goods) {
                assert.strictEqual(
                    getPortStock('lisbon', goodId),
                    100 - 30 + 8,
                    `${goodId}が回復`
                );
            }
        });

        test('0日経過では回復しない', () => {
            reducePortStock('lisbon', 'wine', 50);
            const reducedStock = getPortStock('lisbon', 'wine');

            refreshPortInventory(0);

            assert.strictEqual(
                getPortStock('lisbon', 'wine'),
                reducedStock,
                '0日では回復しない'
            );
        });
    });
});

console.log('All port service tests completed!');
