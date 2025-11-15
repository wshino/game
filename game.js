// ESM wrapper for tests
// This file provides exports for test files

export { gameState, portInventory } from './src/core/game-state.js';
export {
    ports,
    goods,
    portDistances,
    seaRoutes,
    inventorySettings,
    shipUpgrades,
    getSeaRoute
} from './src/core/constants.js';

export {
    initializePortInventory,
    refreshPortInventory,
    getPortStock,
    reducePortStock
} from './src/services/port-service.js';

export {
    calculateRequiredSupplies,
    hasEnoughSupplies,
    consumeSupplies,
    buySupply,
    autoSupplyForVoyage,
    calculateSupplyCost
} from './src/services/supply-service.js';

export {
    getCurrentPortName,
    getCargoUsed,
    getCargoSpace,
    getPrice,
    calculateProfitForPort,
    getRecommendedGoods,
    isProfitable,
    canAffordVoyage
} from './src/utils/calculations.js';

export {
    saveGame,
    loadGame
} from './src/services/save-service.js';

export {
    initializeVoyageMap,
    updateShipPosition,
    selectDestination
} from './src/services/voyage-service.js';

export {
    findBestTrade
} from './src/services/autopilot-service.js';
