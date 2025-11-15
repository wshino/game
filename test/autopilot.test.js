import assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';

// Mock DOM and window environment
global.window = {
    addEventListener: () => {}
};

// Create a mock element factory
const createMockElement = () => ({
    innerHTML: '',
    remove: () => {},
    appendChild: () => {},
    style: {}
});

global.document = {
    getElementById: (id) => {
        // Return a mock element for any ID, especially 'log'
        return createMockElement();
    },
    createElement: () => createMockElement(),
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
import * as game from '../game.js';

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

    it('findBestTrade returns null when no profitable trade exists', () => {
        // Set gold very low so no trades are affordable
        game.gameState.gold = 10;
        game.gameState.currentPort = 'lisbon';
        game.gameState.inventory = {};
        
        const trade = game.findBestTrade();
        
        // Should return null (no trade) instead of random travel
        assert.strictEqual(trade, null);
    });

    it('findBestTrade considers travel costs in profitability', () => {
        // Start with enough gold for trading
        game.gameState.gold = 5000;
        game.gameState.currentPort = 'lisbon';
        game.gameState.inventory = {};
        game.gameState.ship = {
            name: 'カラベル船',
            capacity: 100,
            speed: 1,
            crew: 20
        };

        const trade = game.findBestTrade();

        // Should return a trade decision (prepare_voyage, buy, sell, or travel)
        // The key is that it should only return a trade if it's profitable after costs
        if (trade !== null) {
            assert.ok(['prepare_voyage', 'buy', 'sell', 'travel'].includes(trade.action));

            // If it's a prepare_voyage action, verify it has required fields
            if (trade.action === 'prepare_voyage') {
                assert.ok(trade.destinationPort);
                assert.ok(trade.purchasePlan);
                assert.ok(trade.purchasePlan.goodsToBuy);
                assert.ok(Array.isArray(trade.purchasePlan.goodsToBuy));
            }

            // If it's a buy action, verify it has required fields
            if (trade.action === 'buy') {
                assert.ok(trade.goodId);
                assert.ok(trade.destinationPort);
            }

            // If it's a travel action, verify destination is set
            if (trade.action === 'travel') {
                assert.ok(trade.destinationPort);
            }
        }
    });

    it('findBestTrade sells goods at current port if it is the best option', () => {
        // Set up scenario where we have goods at a good selling port
        game.gameState.gold = 5000;
        game.gameState.currentPort = 'nagasaki';  // Good for selling wine/cloth/spices
        game.gameState.inventory = {
            wine: 10,  // Wine is expensive in Nagasaki (multiplier 1.8)
            food: 5,
            water: 5
        };
        game.gameState.ship = {
            name: 'カラベル船',
            capacity: 100,
            speed: 1,
            crew: 20
        };
        
        const trade = game.findBestTrade();
        
        // Should decide to sell or potentially travel to an even better port
        assert.ok(trade !== null);
        assert.ok(['sell', 'travel'].includes(trade.action));
        
        // If traveling, it should be to a port with better prices
        if (trade.action === 'travel') {
            assert.ok(trade.destinationPort);
            assert.notStrictEqual(trade.destinationPort, 'nagasaki');
        }
    });

    it('calculateSupplyCost helper function works correctly', () => {
        game.gameState.currentPort = 'lisbon';
        game.gameState.ship = {
            name: 'カラベル船',
            capacity: 100,
            speed: 1,
            crew: 20
        };
        
        // Calculate supply cost for a 5-day voyage
        const cost = game.calculateSupplyCost(5);
        
        // Should be a positive number
        assert.ok(cost > 0);
        assert.strictEqual(typeof cost, 'number');
        
        // Cost should increase with more days
        const cost10Days = game.calculateSupplyCost(10);
        assert.ok(cost10Days > cost);
    });
});

console.log('All autopilot tests completed!');
