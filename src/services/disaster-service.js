import { gameState, portInventory } from '../core/game-state.js';
import { DISASTERS, ports } from '../core/constants.js';
import { addLog } from '../utils/logger.js';

/**
 * Check if a disaster should occur at a port
 * @param {string} portId - The port to check
 * @param {number} daysPassed - Number of days passed (for probability calculation)
 * @returns {string|null} - The disaster type that occurred, or null
 */
export function checkForDisaster(portId, daysPassed) {
    // Don't trigger new disaster if one is already active
    if (gameState.portDisasters[portId]) {
        return null;
    }

    // Check each disaster type
    for (const [disasterId, disaster] of Object.entries(DISASTERS)) {
        // Probability scales with days passed
        const effectiveProbability = 1 - Math.pow(1 - disaster.probability, daysPassed);

        if (Math.random() < effectiveProbability) {
            return disasterId;
        }
    }

    return null;
}

/**
 * Trigger a disaster at a specific port
 * @param {string} portId - The port where disaster occurs
 * @param {string} disasterType - The type of disaster
 */
export function triggerDisaster(portId, disasterType) {
    // Don't override existing disaster
    if (gameState.portDisasters[portId]) {
        return;
    }

    const disaster = DISASTERS[disasterType];
    if (!disaster) {
        return;
    }

    // Set the disaster state
    gameState.portDisasters[portId] = {
        type: disasterType,
        startDay: gameState.gameTime,
        remainingDays: disaster.duration
    };

    // Reduce port stock immediately
    if (portInventory[portId]) {
        for (const goodId in portInventory[portId]) {
            const currentStock = portInventory[portId][goodId];
            const reducedStock = Math.floor(currentStock * (1 - disaster.effects.stockReduction));
            portInventory[portId][goodId] = reducedStock;
        }
    }

    // Update statistics
    gameState.statistics.disastersWitnessed++;

    // Log the disaster
    const portName = ports[portId]?.name || portId;
    addLog(`${disaster.emoji} ${portName}で${disaster.name}が発生！${disaster.description}`);
}

/**
 * Update all active disasters (call this when time passes)
 * @param {number} daysPassed - Number of days that have passed
 */
export function updateDisasters(daysPassed) {
    for (const portId in gameState.portDisasters) {
        const disaster = gameState.portDisasters[portId];
        if (disaster) {
            disaster.remainingDays -= daysPassed;

            if (disaster.remainingDays <= 0) {
                // Disaster has ended
                const disasterInfo = DISASTERS[disaster.type];
                const portName = ports[portId]?.name || portId;
                addLog(`${portName}の${disasterInfo.name}が収束した`);
                gameState.portDisasters[portId] = null;
            }
        }
    }
}

/**
 * Get the price multiplier for a port due to disaster
 * Price increases during disaster, decreasing over time as it recovers
 * @param {string} portId - The port to check
 * @returns {number} - The price multiplier (1 = normal)
 */
export function getDisasterPriceMultiplier(portId) {
    const disaster = gameState.portDisasters[portId];
    if (!disaster) {
        return 1;
    }

    const disasterInfo = DISASTERS[disaster.type];
    if (!disasterInfo) {
        return 1;
    }

    // Calculate how much of the disaster effect remains
    // Effect is strongest at the start, weakens as it recovers
    const recoveryProgress = 1 - (disaster.remainingDays / disasterInfo.duration);
    const effectStrength = 1 - recoveryProgress; // 1 at start, 0 at end

    // Interpolate between max multiplier and 1
    const maxMultiplier = disasterInfo.effects.priceMultiplier;
    return 1 + (maxMultiplier - 1) * effectStrength;
}

/**
 * Get the stock recovery multiplier for a port due to disaster
 * Stock recovery is reduced during disaster
 * @param {string} portId - The port to check
 * @returns {number} - The stock recovery multiplier (1 = normal)
 */
export function getDisasterStockMultiplier(portId) {
    const disaster = gameState.portDisasters[portId];
    if (!disaster) {
        return 1;
    }

    const disasterInfo = DISASTERS[disaster.type];
    if (!disasterInfo) {
        return 1;
    }

    // Calculate how much of the disaster effect remains
    const recoveryProgress = 1 - (disaster.remainingDays / disasterInfo.duration);
    const effectStrength = 1 - recoveryProgress;

    // Stock recovery is reduced during disaster (min 0.3, recovers over time)
    const minRecovery = 0.3;
    return minRecovery + (1 - minRecovery) * recoveryProgress;
}

/**
 * Get the active disaster at a port, with full info
 * @param {string} portId - The port to check
 * @returns {object|null} - Disaster info or null
 */
export function getActiveDisaster(portId) {
    const disaster = gameState.portDisasters[portId];
    if (!disaster) {
        return null;
    }

    const disasterInfo = DISASTERS[disaster.type];
    return {
        type: disaster.type,
        remainingDays: disaster.remainingDays,
        startDay: disaster.startDay,
        info: disasterInfo
    };
}

/**
 * Clear a disaster from a port (e.g., for testing or special events)
 * @param {string} portId - The port to clear
 */
export function clearDisaster(portId) {
    gameState.portDisasters[portId] = null;
}

/**
 * Get all active disasters across all ports
 * @returns {object} - Map of portId to disaster info
 */
export function getAllActiveDisasters() {
    const active = {};
    for (const portId in gameState.portDisasters) {
        const disaster = gameState.portDisasters[portId];
        if (disaster) {
            active[portId] = getActiveDisaster(portId);
        }
    }
    return active;
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkForDisaster,
        triggerDisaster,
        updateDisasters,
        getDisasterPriceMultiplier,
        getDisasterStockMultiplier,
        getActiveDisaster,
        clearDisaster,
        getAllActiveDisasters
    };
}
