const { test } = require('node:test');
const assert = require('node:assert');

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

// Clear localStorage before loading the game module
global.localStorage.clear();

// Import game module
const game = require('../game.cjs');

test('東インド会社船でセーブ・ロードしても船が変わらないこと', () => {
    // Clear any existing save data
    global.localStorage.clear();

    // Initialize port inventory
    game.initializePortInventory();

    // Set up game state with East India Company ship (東インド会社船)
    game.gameState.gold = 100000;
    game.gameState.currentPort = 'lisbon';
    game.gameState.inventory = { wine: 10 };
    game.gameState.ship = {
        name: '東インド会社船',
        capacity: 500,
        speed: 2,
        crew: 100
    };
    game.gameState.logs = [];
    game.gameState.gameTime = 50;

    // Save the game
    game.saveGame();

    // Verify save data exists
    const savedData = global.localStorage.getItem('daikokaiGameSave');
    assert.ok(savedData, 'セーブデータが存在する');

    const parsedSave = JSON.parse(savedData);
    assert.strictEqual(parsedSave.ship.name, '東インド会社船', 'セーブデータに東インド会社船が保存されている');
    assert.strictEqual(parsedSave.ship.capacity, 500, 'セーブデータの積載量が500');

    // Change the ship to a different one (simulating state corruption)
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    // Load the game
    const loadResult = game.loadGame();

    // Verify the ship is restored correctly
    assert.strictEqual(game.gameState.ship.name, '東インド会社船', 'ロード後も東インド会社船が保持されている');
    assert.strictEqual(game.gameState.ship.capacity, 500, 'ロード後の積載量が500（カラベル船の100ではない）');
    assert.strictEqual(game.gameState.ship.speed, 2, 'ロード後の速度が2');
    assert.strictEqual(game.gameState.ship.crew, 100, 'ロード後の乗員数が100');

    // Verify other state is also restored
    assert.strictEqual(game.gameState.gold, 100000, '資金も正しく復元される');
    assert.strictEqual(game.gameState.gameTime, 50, 'ゲーム時間も正しく復元される');
});

test('ガレオン船でセーブ・ロードしても船が変わらないこと', () => {
    // Clear any existing save data
    global.localStorage.clear();

    // Initialize port inventory
    game.initializePortInventory();

    // Set up game state with Galleon ship (ガレオン船)
    game.gameState.gold = 50000;
    game.gameState.currentPort = 'venice';
    game.gameState.inventory = { spices: 50 };
    game.gameState.ship = {
        name: 'ガレオン船',
        capacity: 300,
        speed: 1.5,
        crew: 60
    };
    game.gameState.logs = [];
    game.gameState.gameTime = 30;

    // Save the game
    game.saveGame();

    // Change the ship to a different one
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    // Load the game
    game.loadGame();

    // Verify the ship is restored correctly
    assert.strictEqual(game.gameState.ship.name, 'ガレオン船', 'ロード後もガレオン船が保持されている');
    assert.strictEqual(game.gameState.ship.capacity, 300, 'ロード後の積載量が300（カラベル船の100ではない）');
    assert.strictEqual(game.gameState.ship.speed, 1.5, 'ロード後の速度が1.5');
    assert.strictEqual(game.gameState.ship.crew, 60, 'ロード後の乗員数が60');
});

test('キャラック船でセーブ・ロードしても船が変わらないこと', () => {
    // Clear any existing save data
    global.localStorage.clear();

    // Initialize port inventory
    game.initializePortInventory();

    // Set up game state with Carrack ship (キャラック船)
    game.gameState.gold = 20000;
    game.gameState.currentPort = 'calicut';
    game.gameState.inventory = { silk: 30 };
    game.gameState.ship = {
        name: 'キャラック船',
        capacity: 200,
        speed: 1.2,
        crew: 40
    };
    game.gameState.logs = [];
    game.gameState.gameTime = 20;

    // Save the game
    game.saveGame();

    // Change the ship to a different one
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    // Load the game
    game.loadGame();

    // Verify the ship is restored correctly
    assert.strictEqual(game.gameState.ship.name, 'キャラック船', 'ロード後もキャラック船が保持されている');
    assert.strictEqual(game.gameState.ship.capacity, 200, 'ロード後の積載量が200（カラベル船の100ではない）');
    assert.strictEqual(game.gameState.ship.speed, 1.2, 'ロード後の速度が1.2');
    assert.strictEqual(game.gameState.ship.crew, 40, 'ロード後の乗員数が40');
});

test('船の乗員数がカスタマイズされている場合でも正しく復元される', () => {
    // Clear any existing save data
    global.localStorage.clear();

    // Initialize port inventory
    game.initializePortInventory();

    // Set up game state with East India Company ship with custom crew
    game.gameState.gold = 100000;
    game.gameState.currentPort = 'lisbon';
    game.gameState.inventory = {};
    game.gameState.ship = {
        name: '東インド会社船',
        capacity: 500,
        speed: 2,
        crew: 80  // Custom crew number (default is 100)
    };
    game.gameState.logs = [];
    game.gameState.gameTime = 10;

    // Save the game
    game.saveGame();

    // Change the ship
    game.gameState.ship = {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    };

    // Load the game
    game.loadGame();

    // Verify the ship definition is updated but custom crew is preserved
    assert.strictEqual(game.gameState.ship.name, '東インド会社船', '船の名前が正しく復元される');
    assert.strictEqual(game.gameState.ship.capacity, 500, '最新の船定義の積載量が適用される');
    assert.strictEqual(game.gameState.ship.speed, 2, '最新の船定義の速度が適用される');
    assert.strictEqual(game.gameState.ship.crew, 80, 'カスタム乗員数は保持される');
});

console.log('All ship reload tests completed!');
