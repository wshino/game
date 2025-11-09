import { portInventory } from '../core/game-state.js';
import { ports, inventorySettings, goods } from '../core/constants.js';

// Initialize port inventory for all ports
export function initializePortInventory() {
    for (const portId in ports) {
        portInventory[portId] = {};
        const portSize = ports[portId].size;
        const maxStock = inventorySettings[portSize].maxStock;

        for (const goodId in goods) {
            // All ports now have full supplies of water and food for better game balance
            portInventory[portId][goodId] = maxStock;
        }
    }
}

// Refresh port inventory based on days passed
export function refreshPortInventory(daysPassed) {
    for (const portId in portInventory) {
        const portSize = ports[portId].size;
        const refreshRate = inventorySettings[portSize].refreshRate;
        const maxStock = inventorySettings[portSize].maxStock;

        for (const goodId in portInventory[portId]) {
            const recovered = Math.min(
                maxStock,
                portInventory[portId][goodId] + (refreshRate * daysPassed)
            );
            portInventory[portId][goodId] = Math.round(recovered);
        }
    }
}

// Get stock of a good at a specific port
export function getPortStock(portId, goodId) {
    if (!portInventory[portId] || !portInventory[portId][goodId]) {
        return 0;
    }
    return portInventory[portId][goodId];
}

// Reduce stock of a good at a specific port
export function reducePortStock(portId, goodId, amount) {
    if (!portInventory[portId]) {
        portInventory[portId] = {};
    }
    if (!portInventory[portId][goodId]) {
        portInventory[portId][goodId] = 0;
    }
    portInventory[portId][goodId] = Math.max(0, portInventory[portId][goodId] - amount);
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializePortInventory,
        refreshPortInventory,
        getPortStock,
        reducePortStock
    };
}
