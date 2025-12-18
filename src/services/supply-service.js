import { gameState } from '../core/game-state.js';
import { goods, portPrices, GAME_BALANCE } from '../core/constants.js';
import { getPrice, getCargoSpace } from '../utils/calculations.js';
import { getPortStock, reducePortStock } from './port-service.js';

// Calculate required supplies for a voyage
export function calculateRequiredSupplies(days) {
    // Validate input - days must be a positive number
    if (typeof days !== 'number' || days < 0 || !Number.isFinite(days)) {
        return { food: 0, water: 0 };
    }

    const crew = gameState.ship.crew;
    const consumptionRate = GAME_BALANCE.SUPPLY_CONSUMPTION_PER_CREW;
    return {
        food: Math.ceil(crew * days * consumptionRate),
        water: Math.ceil(crew * days * consumptionRate)
    };
}

// Check if player has enough supplies for a voyage
export function hasEnoughSupplies(days) {
    const required = calculateRequiredSupplies(days);
    const food = gameState.inventory.food || 0;
    const water = gameState.inventory.water || 0;
    return {
        hasEnough: food >= required.food && water >= required.water,
        required,
        current: { food, water }
    };
}

// Consume supplies for a voyage
export function consumeSupplies(days) {
    const required = calculateRequiredSupplies(days);
    gameState.inventory.food = Math.max(0, (gameState.inventory.food || 0) - required.food);
    gameState.inventory.water = Math.max(0, (gameState.inventory.water || 0) - required.water);
}

// Automatically buy supplies without logging (used for auto-supply)
export function buySupply(goodId, amount) {
    const price = getPrice(goodId, true);
    const portStock = getPortStock(gameState.currentPort, goodId);

    // Calculate how many we can buy based on constraints
    const maxByMoney = Math.floor(gameState.gold / price);
    const maxByCargo = getCargoSpace();
    const maxByStock = portStock;
    const maxCanBuy = Math.min(amount, maxByMoney, maxByCargo, maxByStock);

    if (maxCanBuy < 1) {
        return 0;
    }

    const totalCost = maxCanBuy * price;
    gameState.gold -= totalCost;
    gameState.inventory[goodId] = (gameState.inventory[goodId] || 0) + maxCanBuy;
    reducePortStock(gameState.currentPort, goodId, maxCanBuy);

    return maxCanBuy;
}

// Automatically supply food and water for voyage
export function autoSupplyForVoyage(days) {
    const required = calculateRequiredSupplies(days);
    const currentFood = gameState.inventory.food || 0;
    const currentWater = gameState.inventory.water || 0;

    const needFood = Math.max(0, required.food - currentFood);
    const needWater = Math.max(0, required.water - currentWater);

    if (needFood === 0 && needWater === 0) {
        return { success: true, alreadyEnough: true };
    }

    // Try to buy needed supplies
    let boughtFood = 0;
    let boughtWater = 0;

    // Buy food
    if (needFood > 0) {
        boughtFood = buySupply('food', needFood);
    }

    // Buy water
    if (needWater > 0) {
        boughtWater = buySupply('water', needWater);
    }

    // Check if we now have enough
    const finalFood = gameState.inventory.food || 0;
    const finalWater = gameState.inventory.water || 0;

    if (finalFood >= required.food && finalWater >= required.water) {
        return {
            success: true,
            alreadyEnough: false,
            boughtFood,
            boughtWater
        };
    } else {
        return {
            success: false,
            boughtFood,
            boughtWater,
            required,
            current: { food: finalFood, water: finalWater }
        };
    }
}

// Calculate the cost of supplies for a voyage
export function calculateSupplyCost(days) {
    const required = calculateRequiredSupplies(days);
    const foodPrice = goods.food.basePrice * portPrices[gameState.currentPort].food;
    const waterPrice = goods.water.basePrice * portPrices[gameState.currentPort].water;
    return Math.ceil(required.food * foodPrice + required.water * waterPrice);
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateRequiredSupplies,
        hasEnoughSupplies,
        consumeSupplies,
        buySupply,
        autoSupplyForVoyage,
        calculateSupplyCost
    };
}
