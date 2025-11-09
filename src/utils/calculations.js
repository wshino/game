import { gameState } from '../core/game-state.js';
import { ports, goods, portPrices, portDistances } from '../core/constants.js';

// Get current port name
export function getCurrentPortName() {
    return ports[gameState.currentPort].name;
}

// Get current cargo used
export function getCargoUsed() {
    return Object.values(gameState.inventory).reduce((sum, qty) => sum + qty, 0);
}

// Get available cargo space
export function getCargoSpace() {
    return gameState.ship.capacity - getCargoUsed();
}

// Get price for a good (buying or selling)
export function getPrice(goodId, isBuying = true) {
    const good = goods[goodId];
    const multiplier = portPrices[gameState.currentPort][goodId];
    const basePrice = good.basePrice * multiplier;
    // Add some randomness (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    const price = Math.round(basePrice * randomFactor);
    // Add markup for buying
    return isBuying ? price : Math.round(price * 0.8);
}

// Calculate profit potential for each good at destination port
export function calculateProfitForPort(destinationPortId, getPortStockFunc) {
    const profits = [];
    const currentPort = gameState.currentPort;

    for (const [goodId, good] of Object.entries(goods)) {
        // Skip supplies
        if (goodId === 'food' || goodId === 'water') continue;

        // Calculate buy price at current port
        const buyPrice = Math.round(good.basePrice * portPrices[currentPort][goodId] * 0.95);

        // Calculate sell price at destination port
        const sellPrice = Math.round(good.basePrice * portPrices[destinationPortId][goodId] * 0.95);

        const profitPerUnit = sellPrice - buyPrice;
        const profitMargin = buyPrice > 0 ? (profitPerUnit / buyPrice) * 100 : 0;

        if (profitPerUnit > 0) {
            profits.push({
                goodId,
                good,
                buyPrice,
                sellPrice,
                profitPerUnit,
                profitMargin,
                stock: getPortStockFunc(currentPort, goodId)
            });
        }
    }

    // Sort by profit margin (descending)
    profits.sort((a, b) => b.profitMargin - a.profitMargin);

    return profits;
}

// Get recommended goods to buy for a destination
export function getRecommendedGoods(destinationPortId, getPortStockFunc, limit = 3) {
    const profits = calculateProfitForPort(destinationPortId, getPortStockFunc);
    return profits.slice(0, limit);
}

// Check if a port is profitable
export function isProfitable(destinationPortId, getPortStockFunc) {
    const profits = calculateProfitForPort(destinationPortId, getPortStockFunc);
    return profits.length > 0 && profits[0].profitMargin > 10; // At least 10% profit margin
}

// Check if player can afford to travel to a port
export function canAffordVoyage(destinationPortId, calculateRequiredSuppliesFunc) {
    const baseDays = portDistances[gameState.currentPort][destinationPortId];
    const travelDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));
    const required = calculateRequiredSuppliesFunc(travelDays);

    // Calculate minimum cost for supplies
    const foodPrice = Math.round(goods.food.basePrice * portPrices[gameState.currentPort].food);
    const waterPrice = Math.round(goods.water.basePrice * portPrices[gameState.currentPort].water);

    const currentFood = gameState.inventory.food || 0;
    const currentWater = gameState.inventory.water || 0;

    const needFood = Math.max(0, required.food - currentFood);
    const needWater = Math.max(0, required.water - currentWater);

    const supplyCost = (needFood * foodPrice) + (needWater * waterPrice);

    // Check if player has enough gold and cargo space
    const hasEnoughGold = gameState.gold >= supplyCost;
    const hasEnoughSpace = getCargoSpace() >= (needFood + needWater);

    return {
        canAfford: hasEnoughGold && hasEnoughSpace,
        supplyCost,
        needFood,
        needWater,
        hasEnoughGold,
        hasEnoughSpace
    };
}
