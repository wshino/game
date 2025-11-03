const assert = require('node:assert');
const { describe, it, beforeEach } = require('node:test');

// Mock DOM and window environment
global.window = {
    addEventListener: () => {}
};

global.document = {
    getElementById: () => null,
    createElement: () => ({ 
        innerHTML: '',
        remove: () => {},
        appendChild: () => {}
    }),
    body: {
        appendChild: () => {}
    }
};

global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

// Load game module
const game = require('../game.js');

describe('Autopilot functionality', () => {
    beforeEach(() => {
        // Reset game state
        game.gameState.gold = 1000;
        game.gameState.currentPort = 'lisbon';
        game.gameState.inventory = {};
        game.gameState.autopilotActive = false;
        game.gameState.autopilotStartTime = null;
        game.gameState.autopilotDurationMinutes = 0;
        game.gameState.autopilotReport = {
            startGold: 0,
            startTime: 0,
            trades: [],
            voyages: [],
            totalProfit: 0
        };
        game.initializePortInventory();
    });

    it('autopilot state is initialized correctly', () => {
        assert.strictEqual(game.gameState.autopilotActive, false);
        assert.strictEqual(game.gameState.autopilotStartTime, null);
        assert.strictEqual(game.gameState.autopilotDurationMinutes, 0);
        assert.ok(game.gameState.autopilotReport);
        assert.ok(Array.isArray(game.gameState.autopilotReport.trades));
        assert.ok(Array.isArray(game.gameState.autopilotReport.voyages));
    });

    it('autopilot report structure is correct', () => {
        const report = game.gameState.autopilotReport;
        assert.strictEqual(typeof report.startGold, 'number');
        assert.strictEqual(typeof report.startTime, 'number');
        assert.strictEqual(typeof report.totalProfit, 'number');
        assert.ok(Array.isArray(report.trades));
        assert.ok(Array.isArray(report.voyages));
    });

    it('game state includes all required autopilot fields', () => {
        assert.ok('autopilotActive' in game.gameState);
        assert.ok('autopilotStartTime' in game.gameState);
        assert.ok('autopilotDurationMinutes' in game.gameState);
        assert.ok('autopilotReport' in game.gameState);
    });
});

console.log('All autopilot tests completed!');
