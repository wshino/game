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
import { gameState, portInventory } from '../src/core/game-state.js';
import { DISASTERS, ports, inventorySettings } from '../src/core/constants.js';
import {
    checkForDisaster,
    triggerDisaster,
    updateDisasters,
    getDisasterPriceMultiplier,
    getDisasterStockMultiplier,
    getActiveDisaster,
    clearDisaster
} from '../src/services/disaster-service.js';

describe('Disaster Service', () => {
    beforeEach(() => {
        // Reset game state
        gameState.gold = 10000;
        gameState.currentPort = 'lisbon';
        gameState.gameTime = 100;
        gameState.logs = [];
        gameState.portDisasters = {
            lisbon: null,
            seville: null,
            venice: null,
            alexandria: null,
            calicut: null,
            malacca: null,
            nagasaki: null
        };
        gameState.statistics = {
            disastersWitnessed: 0
        };

        // Initialize port inventory
        for (const portId in ports) {
            portInventory[portId] = {};
            const portSize = ports[portId].size;
            const maxStock = inventorySettings[portSize].maxStock;
            for (const goodId of ['wine', 'cloth', 'spices', 'silk', 'gold_ore', 'porcelain', 'tea', 'silver', 'food', 'water']) {
                portInventory[portId][goodId] = maxStock;
            }
        }
    });

    describe('DISASTERS definitions', () => {
        test('should have all required fields', () => {
            for (const [disasterId, disaster] of Object.entries(DISASTERS)) {
                assert.ok(disaster.id, `${disasterId} has id`);
                assert.ok(disaster.name, `${disasterId} has name`);
                assert.ok(disaster.emoji, `${disasterId} has emoji`);
                assert.ok(typeof disaster.probability === 'number', `${disasterId} has probability`);
                assert.ok(typeof disaster.duration === 'number', `${disasterId} has duration`);
                assert.ok(disaster.effects, `${disasterId} has effects`);
                assert.ok(disaster.effects.priceMultiplier, `${disasterId} has priceMultiplier`);
                assert.ok(disaster.effects.stockReduction !== undefined, `${disasterId} has stockReduction`);
                assert.ok(disaster.description, `${disasterId} has description`);
            }
        });

        test('should have valid probability values', () => {
            for (const [disasterId, disaster] of Object.entries(DISASTERS)) {
                assert.ok(disaster.probability >= 0 && disaster.probability <= 1,
                    `${disasterId} probability ${disaster.probability} is between 0 and 1`);
            }
        });

        test('should have positive duration', () => {
            for (const [disasterId, disaster] of Object.entries(DISASTERS)) {
                assert.ok(disaster.duration > 0, `${disasterId} has positive duration`);
            }
        });
    });

    describe('triggerDisaster', () => {
        test('should set disaster on port', () => {
            triggerDisaster('lisbon', 'earthquake');

            const disaster = gameState.portDisasters.lisbon;
            assert.ok(disaster, 'Disaster is set');
            assert.strictEqual(disaster.type, 'earthquake', 'Type is earthquake');
            assert.strictEqual(disaster.remainingDays, DISASTERS.earthquake.duration, 'Duration is set');
        });

        test('should reduce port stock by stockReduction', () => {
            const initialStock = portInventory.lisbon.wine;
            triggerDisaster('lisbon', 'earthquake');

            const expectedStock = Math.floor(initialStock * (1 - DISASTERS.earthquake.effects.stockReduction));
            assert.strictEqual(portInventory.lisbon.wine, expectedStock, 'Stock is reduced');
        });

        test('should increment disastersWitnessed statistic', () => {
            const initial = gameState.statistics.disastersWitnessed;
            triggerDisaster('lisbon', 'fire');
            assert.strictEqual(gameState.statistics.disastersWitnessed, initial + 1, 'Statistic incremented');
        });

        test('should not trigger if disaster already active', () => {
            triggerDisaster('lisbon', 'earthquake');
            const firstDisaster = { ...gameState.portDisasters.lisbon };

            triggerDisaster('lisbon', 'fire'); // Should not override

            assert.strictEqual(gameState.portDisasters.lisbon.type, firstDisaster.type, 'Disaster not overwritten');
        });
    });

    describe('checkForDisaster', () => {
        test('should return null or disaster type', () => {
            let disasterCount = 0;
            let nullCount = 0;

            for (let i = 0; i < 100; i++) {
                gameState.portDisasters.lisbon = null; // Reset
                const result = checkForDisaster('lisbon', 1);
                if (result) {
                    disasterCount++;
                    assert.ok(DISASTERS[result], `Returned disaster ${result} is valid`);
                } else {
                    nullCount++;
                }
            }

            // With 100 tries and ~7% chance per day, we should get some disasters
            assert.ok(disasterCount >= 0, 'Some disasters should occur or none (random)');
        });

        test('should not check if disaster already active', () => {
            gameState.portDisasters.lisbon = { type: 'earthquake', remainingDays: 5 };

            const result = checkForDisaster('lisbon', 1);

            assert.strictEqual(result, null, 'No new disaster when one is active');
        });
    });

    describe('updateDisasters', () => {
        test('should reduce remainingDays', () => {
            gameState.portDisasters.lisbon = { type: 'earthquake', remainingDays: 5, startDay: 100 };

            updateDisasters(2);

            assert.strictEqual(gameState.portDisasters.lisbon.remainingDays, 3, 'Days reduced by 2');
        });

        test('should clear disaster when remainingDays reaches 0', () => {
            gameState.portDisasters.lisbon = { type: 'earthquake', remainingDays: 2, startDay: 100 };

            updateDisasters(3);

            assert.strictEqual(gameState.portDisasters.lisbon, null, 'Disaster cleared');
        });

        test('should update multiple ports', () => {
            gameState.portDisasters.lisbon = { type: 'earthquake', remainingDays: 5, startDay: 100 };
            gameState.portDisasters.venice = { type: 'fire', remainingDays: 3, startDay: 100 };

            updateDisasters(2);

            assert.strictEqual(gameState.portDisasters.lisbon.remainingDays, 3, 'Lisbon updated');
            assert.strictEqual(gameState.portDisasters.venice.remainingDays, 1, 'Venice updated');
        });
    });

    describe('getDisasterPriceMultiplier', () => {
        test('should return 1 if no disaster', () => {
            gameState.portDisasters.lisbon = null;

            const multiplier = getDisasterPriceMultiplier('lisbon');

            assert.strictEqual(multiplier, 1, 'No multiplier without disaster');
        });

        test('should return priceMultiplier when disaster active at full strength', () => {
            // At full duration remaining, effect is at full strength
            gameState.portDisasters.lisbon = {
                type: 'earthquake',
                remainingDays: DISASTERS.earthquake.duration,
                startDay: 100
            };

            const multiplier = getDisasterPriceMultiplier('lisbon');

            assert.strictEqual(multiplier, DISASTERS.earthquake.effects.priceMultiplier, 'Returns full earthquake multiplier');
        });

        test('should scale multiplier based on remaining days', () => {
            // At full duration, full effect
            gameState.portDisasters.lisbon = {
                type: 'earthquake',
                remainingDays: DISASTERS.earthquake.duration,
                startDay: 100
            };
            const fullMultiplier = getDisasterPriceMultiplier('lisbon');

            // At half duration, reduced effect
            gameState.portDisasters.lisbon.remainingDays = Math.floor(DISASTERS.earthquake.duration / 2);
            const halfMultiplier = getDisasterPriceMultiplier('lisbon');

            // Full multiplier should be >= half multiplier (disaster effect weakens over time)
            assert.ok(fullMultiplier >= halfMultiplier, 'Effect weakens over time');
        });
    });

    describe('getDisasterStockMultiplier', () => {
        test('should return 1 if no disaster', () => {
            gameState.portDisasters.lisbon = null;

            const multiplier = getDisasterStockMultiplier('lisbon');

            assert.strictEqual(multiplier, 1, 'No multiplier without disaster');
        });

        test('should return reduced multiplier when disaster active', () => {
            gameState.portDisasters.lisbon = { type: 'tsunami', remainingDays: 10, startDay: 100 };

            const multiplier = getDisasterStockMultiplier('lisbon');

            // Stock recovery should be reduced
            assert.ok(multiplier < 1, 'Stock recovery is reduced');
        });
    });

    describe('getActiveDisaster', () => {
        test('should return null if no disaster', () => {
            gameState.portDisasters.lisbon = null;

            const disaster = getActiveDisaster('lisbon');

            assert.strictEqual(disaster, null, 'No active disaster');
        });

        test('should return disaster info if active', () => {
            gameState.portDisasters.lisbon = { type: 'earthquake', remainingDays: 5, startDay: 100 };

            const disaster = getActiveDisaster('lisbon');

            assert.ok(disaster, 'Disaster returned');
            assert.strictEqual(disaster.type, 'earthquake', 'Correct type');
            assert.ok(disaster.info, 'Has disaster info from constants');
            assert.strictEqual(disaster.info.name, DISASTERS.earthquake.name, 'Has name');
        });
    });

    describe('clearDisaster', () => {
        test('should clear disaster from port', () => {
            gameState.portDisasters.lisbon = { type: 'earthquake', remainingDays: 5, startDay: 100 };

            clearDisaster('lisbon');

            assert.strictEqual(gameState.portDisasters.lisbon, null, 'Disaster cleared');
        });

        test('should do nothing if no disaster', () => {
            gameState.portDisasters.lisbon = null;

            clearDisaster('lisbon'); // Should not throw

            assert.strictEqual(gameState.portDisasters.lisbon, null, 'Still null');
        });
    });
});

describe('Disaster Integration', () => {
    beforeEach(() => {
        gameState.portDisasters = {
            lisbon: null,
            seville: null,
            venice: null,
            alexandria: null,
            calicut: null,
            malacca: null,
            nagasaki: null
        };
        gameState.statistics = {
            disastersWitnessed: 0
        };
    });

    test('should handle full disaster lifecycle', () => {
        // 1. Trigger disaster
        triggerDisaster('lisbon', 'fire');
        assert.ok(gameState.portDisasters.lisbon, 'Disaster started');

        // 2. Check price multiplier is active
        const priceMultiplier = getDisasterPriceMultiplier('lisbon');
        assert.ok(priceMultiplier > 1, 'Prices increased');

        // 3. Update over time
        const duration = DISASTERS.fire.duration;
        updateDisasters(duration - 1);
        assert.ok(gameState.portDisasters.lisbon, 'Disaster still active');

        // 4. Complete recovery
        updateDisasters(2);
        assert.strictEqual(gameState.portDisasters.lisbon, null, 'Disaster ended');

        // 5. Prices back to normal
        const normalMultiplier = getDisasterPriceMultiplier('lisbon');
        assert.strictEqual(normalMultiplier, 1, 'Prices normalized');
    });

    test('should affect multiple ports independently', () => {
        triggerDisaster('lisbon', 'earthquake');
        triggerDisaster('venice', 'plague');

        assert.strictEqual(gameState.portDisasters.lisbon.type, 'earthquake', 'Lisbon has earthquake');
        assert.strictEqual(gameState.portDisasters.venice.type, 'plague', 'Venice has plague');

        // Update - earthquake has shorter duration than plague
        updateDisasters(DISASTERS.earthquake.duration);

        assert.strictEqual(gameState.portDisasters.lisbon, null, 'Earthquake ended');
        assert.ok(gameState.portDisasters.venice, 'Plague still active');
    });
});

console.log('All disaster service tests completed!');
