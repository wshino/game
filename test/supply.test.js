import { test } from 'node:test';
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

// Import game module
import * as game from '../game.js';

test('calculateRequiredSupplies - 必要な物資を正しく計算する', () => {
    // Reset game state
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    const required = game.calculateRequiredSupplies(10);

    // crew=20, days=10, rate=0.07
    // food = ceil(20 * 10 * 0.07) = ceil(14.000000000000002) = 15 (floating point precision)
    // water = ceil(20 * 10 * 0.07) = ceil(14.000000000000002) = 15
    assert.strictEqual(required.food, 15, '必要な食糧が正しく計算されている');
    assert.strictEqual(required.water, 15, '必要な水が正しく計算されている');
});

test('calculateRequiredSupplies - 乗員数が多い場合', () => {
    game.gameState.ship = {
        name: 'ガレオン船',
        capacity: 300,
        speed: 1.5,
        crew: 60
    };

    const required = game.calculateRequiredSupplies(15);

    // crew=60, days=15, rate=0.07
    // food = ceil(60 * 15 * 0.07) = ceil(63.00000000000001) = 64 (floating point precision)
    assert.strictEqual(required.food, 64, '乗員数が多い場合も正しく計算されている');
    assert.strictEqual(required.water, 64, '乗員数が多い場合も正しく計算されている');
});

test('hasEnoughSupplies - 十分な物資がある場合', () => {
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };
    game.gameState.inventory = {
        food: 20,
        water: 20
    };

    const result = game.hasEnoughSupplies(10);

    assert.strictEqual(result.hasEnough, true, '十分な物資があることを検出できている');
    assert.strictEqual(result.required.food, 15);
    assert.strictEqual(result.required.water, 15);
    assert.strictEqual(result.current.food, 20);
    assert.strictEqual(result.current.water, 20);
});

test('hasEnoughSupplies - 物資が不足している場合', () => {
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };
    game.gameState.inventory = {
        food: 10,
        water: 5
    };

    const result = game.hasEnoughSupplies(10);

    assert.strictEqual(result.hasEnough, false, '物資不足を検出できている');
    assert.strictEqual(result.current.food, 10);
    assert.strictEqual(result.current.water, 5);
});

test('buySupply - 物資を購入できる', () => {
    // Setup
    game.initializePortInventory();
    game.gameState.currentPort = 'lisbon';
    game.gameState.gold = 1000;
    game.gameState.inventory = {};
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    const initialGold = game.gameState.gold;
    const initialStock = game.getPortStock('lisbon', 'food');

    const bought = game.buySupply('food', 10);

    assert.strictEqual(bought, 10, '10個の食糧を購入できる');
    assert.ok(game.gameState.gold < initialGold, '資金が減少している');
    assert.strictEqual(game.gameState.inventory.food, 10, 'インベントリに追加されている');
    assert.strictEqual(game.getPortStock('lisbon', 'food'), initialStock - 10, '港の在庫が減少している');
});

test('buySupply - 資金が不足している場合は購入できない', () => {
    // Setup
    game.initializePortInventory();
    game.gameState.currentPort = 'lisbon';
    game.gameState.gold = 5; // Very low gold
    game.gameState.inventory = {};
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    const bought = game.buySupply('food', 100);

    assert.ok(bought < 100, '資金不足の場合は要求数より少ない');
    assert.ok(game.gameState.gold >= 0, '資金はマイナスにならない');
});

test('buySupply - 積載量が不足している場合は購入できない', () => {
    // Setup
    game.initializePortInventory();
    game.gameState.currentPort = 'lisbon';
    game.gameState.gold = 10000;
    game.gameState.inventory = {
        wine: 95 // Already 95 items
    };
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    const bought = game.buySupply('food', 20);

    // Only 5 spaces left
    assert.ok(bought <= 5, '積載量不足の場合は空きスペース分のみ購入');
});

test('autoSupplyForVoyage - 必要な物資を自動購入する', () => {
    // Setup
    game.initializePortInventory();
    game.gameState.currentPort = 'lisbon';
    game.gameState.gold = 1000;
    game.gameState.inventory = {};
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    const result = game.autoSupplyForVoyage(10);

    assert.strictEqual(result.success, true, '自動補給が成功する');
    assert.strictEqual(result.alreadyEnough, false, '補給が必要だった');
    assert.ok(result.boughtFood > 0, '食糧を購入した');
    assert.ok(result.boughtWater > 0, '水を購入した');
    assert.ok(game.gameState.inventory.food >= 15, '必要な食糧が確保されている');
    assert.ok(game.gameState.inventory.water >= 15, '必要な水が確保されている');
});

test('autoSupplyForVoyage - 既に十分な物資がある場合', () => {
    // Setup
    game.initializePortInventory();
    game.gameState.currentPort = 'lisbon';
    game.gameState.gold = 1000;
    game.gameState.inventory = {
        food: 50,
        water: 50
    };
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    const result = game.autoSupplyForVoyage(10);

    assert.strictEqual(result.success, true, '成功する');
    assert.strictEqual(result.alreadyEnough, true, '既に十分な物資がある');
});

test('autoSupplyForVoyage - 資金不足で補給できない場合', () => {
    // Setup
    game.initializePortInventory();
    game.gameState.currentPort = 'lisbon';
    game.gameState.gold = 1; // Very low gold
    game.gameState.inventory = {};
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    const result = game.autoSupplyForVoyage(10);

    assert.strictEqual(result.success, false, '補給失敗');
    assert.ok(result.required, '必要物資の情報がある');
    assert.ok(result.current, '現在の物資の情報がある');
});

test('selectDestination - requiredが正しく定義されている（バグ修正確認）', () => {
    // Setup
    game.initializePortInventory();
    game.gameState.currentPort = 'lisbon';
    game.gameState.gold = 1000;
    game.gameState.inventory = {};
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };
    game.gameState.isVoyaging = false;
    game.gameState.selectedDestination = null;
    game.gameState.logs = [];

    // This should not throw an error
    let error = null;
    try {
        game.selectDestination('seville');
    } catch (e) {
        error = e;
    }

    assert.strictEqual(error, null, 'selectDestinationでエラーが発生しない');
    assert.strictEqual(game.gameState.selectedDestination, 'seville', '目的地が選択される');
});

test('selectDestination - 自動補給が実行される', () => {
    // Setup
    game.initializePortInventory();
    game.gameState.currentPort = 'lisbon';
    game.gameState.gold = 1000;
    game.gameState.inventory = {};
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };
    game.gameState.isVoyaging = false;
    game.gameState.selectedDestination = null;
    game.gameState.logs = [];

    const initialGold = game.gameState.gold;
    game.selectDestination('seville');

    assert.strictEqual(game.gameState.selectedDestination, 'seville', '目的地が選択される');
    assert.ok(game.gameState.gold < initialGold, '資金が減少している（補給が実行された）');
    assert.ok(game.gameState.inventory.food > 0, '食糧が補給されている');
    assert.ok(game.gameState.inventory.water > 0, '水が補給されている');

    // Check if supplies are sufficient for the voyage
    const baseDays = game.portDistances['lisbon']['seville'];
    const estimatedDays = Math.max(1, Math.round(baseDays / game.gameState.ship.speed));
    const required = game.calculateRequiredSupplies(estimatedDays);

    assert.ok(game.gameState.inventory.food >= required.food, '必要な食糧が確保されている');
    assert.ok(game.gameState.inventory.water >= required.water, '必要な水が確保されている');
});

console.log('All supply tests completed!');
