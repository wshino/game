// CommonJS wrapper for tests
// This file provides backward compatibility for test files

const { gameState, portInventory } = require('./src/core/game-state.js');
const {
    ports,
    goods,
    portDistances,
    seaRoutes,
    inventorySettings,
    shipUpgrades,
    getSeaRoute
} = require('./src/core/constants.js');

const {
    initializePortInventory,
    refreshPortInventory,
    getPortStock,
    reducePortStock
} = require('./src/services/port-service.js');

const {
    calculateRequiredSupplies,
    hasEnoughSupplies,
    consumeSupplies,
    buySupply,
    autoSupplyForVoyage,
    calculateSupplyCost
} = require('./src/services/supply-service.js');

const {
    getCurrentPortName,
    getCargoUsed,
    getCargoSpace,
    getPrice,
    calculateProfitForPort,
    getRecommendedGoods,
    isProfitable,
    canAffordVoyage
} = require('./src/utils/calculations.js');

const {
    saveGame,
    loadGame
} = require('./src/services/save-service.js');

const {
    initializeVoyageMap,
    updateShipPosition,
    selectDestination
} = require('./src/services/voyage-service.js');

const {
    findBestTrade
} = require('./src/services/autopilot-service.js');

module.exports = {
    gameState,
    ports,
    goods,
    portInventory,
    portDistances,
    seaRoutes,
    inventorySettings,
    shipUpgrades,
    calculateRequiredSupplies,
    hasEnoughSupplies,
    consumeSupplies,
    buySupply,
    autoSupplyForVoyage,
    getPortStock,
    reducePortStock,
    initializePortInventory,
    refreshPortInventory,
    getCargoSpace,
    getCargoUsed,
    getPrice,
    saveGame,
    loadGame,
    getSeaRoute,
    initializeVoyageMap,
    updateShipPosition,
    calculateSupplyCost,
    getCurrentPortName,
    calculateProfitForPort,
    getRecommendedGoods,
    isProfitable,
    canAffordVoyage,
    selectDestination,
    findBestTrade
};
