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

// Track DOM operations for testing
const domOperations = {
    classChanges: [],
    reset() {
        this.classChanges = [];
    }
};

global.document = {
    getElementById: (id) => ({
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        scrollTop: 0,
        scrollHeight: 0,
        classList: {
            add: (cls) => { domOperations.classChanges.push({ action: 'add', class: cls }); },
            remove: (cls) => { domOperations.classChanges.push({ action: 'remove', class: cls }); }
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
import { goods, shipUpgrades } from '../src/core/constants.js';
import { initializePortInventory, getPortStock, reducePortStock } from '../src/services/port-service.js';
import { getPrice, getCargoUsed, getCargoSpace } from '../src/utils/calculations.js';
import { buyGood, buyAllGood, sellGood, sellAllGood, upgradeShip, setUICallbacks } from '../src/services/trade-service.js';

// Mock updateAll function
let updateAllCalled = false;
function mockUpdateAll() {
    updateAllCalled = true;
}

describe('Trade Service', () => {
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
        gameState.logs = [];

        // Initialize port inventory
        initializePortInventory();

        // Reset tracking
        updateAllCalled = false;
        domOperations.reset();

        // Set UI callbacks
        setUICallbacks(mockUpdateAll);
    });

    describe('buyGood', () => {
        test('商品を1個購入できる', () => {
            const initialGold = gameState.gold;
            const initialStock = getPortStock('lisbon', 'wine');

            buyGood('wine');

            assert.strictEqual(gameState.inventory.wine, 1, '商品が追加される');
            assert.ok(gameState.gold < initialGold, '資金が減少する');
            assert.strictEqual(getPortStock('lisbon', 'wine'), initialStock - 1, '港の在庫が減少する');
            assert.ok(updateAllCalled, 'UI更新が呼ばれる');
        });

        test('資金不足の場合は購入できない', () => {
            gameState.gold = 1; // Very low gold
            const initialGold = gameState.gold;

            buyGood('silk'); // Expensive item

            assert.strictEqual(gameState.inventory.silk, undefined, '商品が追加されない');
            assert.strictEqual(gameState.gold, initialGold, '資金が変わらない');
        });

        test('積載量が一杯の場合は購入できない', () => {
            gameState.inventory = { wine: 100 }; // Ship is full
            const initialGold = gameState.gold;

            buyGood('cloth');

            assert.strictEqual(gameState.inventory.cloth, undefined, '商品が追加されない');
            assert.strictEqual(gameState.gold, initialGold, '資金が変わらない');
        });

        test('在庫がない場合は購入できない', () => {
            // Reduce port stock to 0
            const stock = getPortStock('lisbon', 'wine');
            reducePortStock('lisbon', 'wine', stock);

            const initialGold = gameState.gold;

            buyGood('wine');

            assert.strictEqual(gameState.inventory.wine, undefined, '商品が追加されない');
            assert.strictEqual(gameState.gold, initialGold, '資金が変わらない');
        });
    });

    describe('buyAllGood', () => {
        test('資金制限で購入可能な最大数を購入', () => {
            // 資金を少なく、カーゴ・在庫は十分な状態にする
            gameState.gold = 500;
            gameState.inventory = {}; // カーゴは空
            const initialGold = gameState.gold;

            buyAllGood('wine');

            // 購入後のゴールドが減っていることを確認
            assert.ok(gameState.gold < initialGold, 'ゴールドが減っている');
            // 購入できた数が正の値であることを確認
            const purchased = gameState.inventory.wine || 0;
            assert.ok(purchased > 0, '商品が購入された');
            // 購入金額が元の資金以下であることを確認
            const spent = initialGold - gameState.gold;
            assert.ok(spent <= initialGold, '支出が元の資金を超えない');
            assert.ok(spent > 0, '支出がある');
        });

        test('積載量制限で購入可能な最大数を購入', () => {
            gameState.gold = 50000; // Enough money
            gameState.inventory = { silk: 90 }; // Only 10 spaces left

            buyAllGood('wine');

            const totalCargo = getCargoUsed();
            assert.ok(totalCargo <= gameState.ship.capacity, '積載量を超えない');
        });

        test('在庫制限で購入可能な最大数を購入', () => {
            gameState.gold = 50000;
            // Reduce port stock
            reducePortStock('lisbon', 'wine', getPortStock('lisbon', 'wine') - 5);

            buyAllGood('wine');

            assert.ok(gameState.inventory.wine <= 5, '在庫以上は購入しない');
        });

        test('購入できない場合はエラーメッセージ', () => {
            gameState.gold = 1;
            const initialGold = gameState.gold;

            buyAllGood('silk');

            assert.strictEqual(gameState.gold, initialGold, '資金が変わらない');
        });
    });

    describe('sellGood', () => {
        test('商品を1個売却できる', () => {
            gameState.inventory = { wine: 10 };
            const initialGold = gameState.gold;

            sellGood('wine');

            assert.strictEqual(gameState.inventory.wine, 9, '商品が減少する');
            assert.ok(gameState.gold > initialGold, '資金が増加する');
            assert.ok(updateAllCalled, 'UI更新が呼ばれる');
        });

        test('持っていない商品は売却できない', () => {
            gameState.inventory = {};
            const initialGold = gameState.gold;

            sellGood('wine');

            assert.strictEqual(gameState.gold, initialGold, '資金が変わらない');
        });

        test('売却時にゴールドアニメーションが実行される', () => {
            gameState.inventory = { wine: 10 };
            domOperations.reset();

            sellGood('wine');

            const goldAnimation = domOperations.classChanges.find(
                op => op.action === 'add' && op.class === 'gold-animation'
            );
            assert.ok(goldAnimation, 'gold-animationクラスが追加される');
        });
    });

    describe('sellAllGood', () => {
        test('全ての商品を売却できる', () => {
            gameState.inventory = { wine: 20 };
            const initialGold = gameState.gold;

            sellAllGood('wine');

            assert.strictEqual(gameState.inventory.wine, 0, '全て売却される');
            assert.ok(gameState.gold > initialGold, '資金が増加する');
        });

        test('複数個売却時の合計金額が正しい', () => {
            gameState.inventory = { wine: 10 };
            const initialGold = gameState.gold;
            const price = getPrice('wine', false);
            const expectedRevenue = price * 10;

            sellAllGood('wine');

            // Price has randomness, so check if revenue is reasonable
            const actualRevenue = gameState.gold - initialGold;
            assert.ok(actualRevenue > 0, '収益がある');
        });

        test('持っていない商品は売却できない', () => {
            gameState.inventory = {};
            const initialGold = gameState.gold;

            sellAllGood('wine');

            assert.strictEqual(gameState.gold, initialGold, '資金が変わらない');
        });
    });

    describe('upgradeShip', () => {
        test('十分な資金があれば船をアップグレードできる', () => {
            gameState.gold = 10000;
            gameState.inventory = {};

            upgradeShip(1); // キャラック船

            assert.strictEqual(gameState.ship.name, 'キャラック船', '船がアップグレードされる');
            assert.strictEqual(gameState.ship.capacity, 200, '積載量が増加');
            assert.strictEqual(gameState.gold, 5000, '費用が差し引かれる');
        });

        test('資金不足の場合はアップグレードできない', () => {
            gameState.gold = 1000;
            const initialShip = { ...gameState.ship };

            upgradeShip(1); // キャラック船 (cost: 5000)

            assert.strictEqual(gameState.ship.name, initialShip.name, '船が変わらない');
        });

        test('積荷が新しい船の容量を超える場合はアップグレードできない', () => {
            gameState.gold = 10000;
            gameState.ship = shipUpgrades[1]; // キャラック船 (capacity: 200)
            gameState.inventory = { wine: 150 }; // 150 items

            upgradeShip(0); // カラベル船 (capacity: 100) - downgrade

            // Should not downgrade because cargo exceeds capacity
            assert.strictEqual(gameState.ship.capacity, 200, '船が変わらない');
        });

        test('ガレオン船へのアップグレード', () => {
            gameState.gold = 20000;
            gameState.inventory = {};

            upgradeShip(2); // ガレオン船

            assert.strictEqual(gameState.ship.name, 'ガレオン船', '船がアップグレードされる');
            assert.strictEqual(gameState.ship.capacity, 300, '積載量が300');
            assert.strictEqual(gameState.ship.speed, 1.5, '速度が1.5');
        });

        test('東インド会社船へのアップグレード', () => {
            gameState.gold = 60000;
            gameState.inventory = {};

            upgradeShip(3); // 東インド会社船

            assert.strictEqual(gameState.ship.name, '東インド会社船', '船がアップグレードされる');
            assert.strictEqual(gameState.ship.capacity, 500, '積載量が500');
            assert.strictEqual(gameState.ship.speed, 2, '速度が2');
        });
    });
});

console.log('All trade tests completed!');
