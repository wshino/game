import { gameState } from '../core/game-state.js';
import { AUTOPILOT_CONFIG, ports, goods, portPrices, portDistances, inventorySettings } from '../core/constants.js';
import { getPrice, getCargoSpace } from '../utils/calculations.js';
import { getPortStock } from './port-service.js';
import { calculateRequiredSupplies, calculateSupplyCost } from './supply-service.js';
import { addLog } from '../utils/logger.js';

// Calculate time efficiency (profit per game day)
const TRADE_TIME_OVERHEAD = 2; // 取引処理にかかる時間（ゲーム日数）

export function calculateTimeEfficiency(totalProfit, estimatedDays) {
    // Validate inputs to prevent division by zero and NaN
    if (typeof totalProfit !== 'number' || typeof estimatedDays !== 'number') {
        return 0;
    }
    if (!Number.isFinite(totalProfit) || !Number.isFinite(estimatedDays)) {
        return 0;
    }

    const totalTime = estimatedDays + TRADE_TIME_OVERHEAD;

    // Guard against division by zero
    if (totalTime <= 0) {
        return 0;
    }

    return totalProfit / totalTime;
}

// Find the best trade opportunity based on total profit (not profit per unit)
export function findBestTrade(getRemainingAutopilotTime) {
    const currentPortId = gameState.currentPort;

    // Check if we have goods to sell
    let hasProfitableGoods = false;
    for (const goodId in gameState.inventory) {
        if (goodId === 'food' || goodId === 'water') continue;
        if (gameState.inventory[goodId] > 0) {
            hasProfitableGoods = true;
            break;
        }
    }

    // If we have goods, find the port where we can sell for maximum profit
    if (hasProfitableGoods) {
        let bestSellPort = currentPortId;
        let bestTotalSellValue = 0;

        // Calculate sell value at current port (using portId parameter)
        for (const goodId in gameState.inventory) {
            if (goodId === 'food' || goodId === 'water') continue;
            const quantity = gameState.inventory[goodId];
            if (quantity > 0) {
                bestTotalSellValue += getPrice(goodId, false, currentPortId) * quantity;
            }
        }

        // Check all other ports for better selling prices
        for (const destPortId in ports) {
            if (destPortId === currentPortId) continue;

            // Calculate total sell value at destination (using portId parameter)
            let destSellValue = 0;
            for (const goodId in gameState.inventory) {
                if (goodId === 'food' || goodId === 'water') continue;
                const quantity = gameState.inventory[goodId];
                if (quantity > 0) {
                    destSellValue += getPrice(goodId, false, destPortId) * quantity;
                }
            }

            // Calculate travel cost
            const distance = portDistances[currentPortId][destPortId];
            const estimatedDays = Math.max(1, Math.round(distance / gameState.ship.speed));
            const supplyCost = calculateSupplyCost(estimatedDays);

            // Net profit after travel costs
            const netProfit = destSellValue - bestTotalSellValue - supplyCost;

            // If this port offers better net profit AND we can afford the travel
            if (netProfit > 0 &&
                gameState.gold >= supplyCost + AUTOPILOT_CONFIG.SAFETY_RESERVE &&
                destSellValue > bestTotalSellValue) {
                bestTotalSellValue = destSellValue;
                bestSellPort = destPortId;
            }
        }

        // Sell at current port or travel to the best port
        if (bestSellPort === currentPortId) {
            return { action: 'sell' };
        } else {
            return {
                action: 'travel',
                destinationPort: bestSellPort
            };
        }
    }

    // No goods in inventory - find the most profitable trade route
    // NEW STRATEGY: Calculate total profit for each destination (not profit per unit)
    // Consider multiple goods to maximize total profit
    // ENHANCED: Consider time efficiency for maximum profit within duration

    // Get remaining time
    const { remainingGameDays } = getRemainingAutopilotTime();
    const BUFFER_DAYS = 5; // 安全マージン

    // Determine strategy based on autopilot duration
    const isShortTerm = gameState.autopilotActive && gameState.autopilotDurationMinutes < 120; // 2時間未満

    let bestScore = 0;
    let bestDestPort = null;
    let bestPurchasePlan = null;

    // Evaluate each potential destination
    for (const destPortId in ports) {
        if (destPortId === currentPortId) continue;

        // Calculate optimal purchase plan for this destination
        const plan = calculateOptimalPurchaseForDestination(destPortId);

        if (!plan || plan.totalProfit <= AUTOPILOT_CONFIG.MINIMUM_PROFIT_THRESHOLD) {
            continue;
        }

        // Check if we have enough time to complete this route
        if (gameState.autopilotActive && remainingGameDays > 0) {
            if (plan.estimatedDays + BUFFER_DAYS > remainingGameDays) {
                addLog(`🤖 [DEBUG] ${ports[destPortId].name}へのルートは時間不足（必要: ${plan.estimatedDays}日、残り: ${Math.floor(remainingGameDays)}日）`);
                continue; // 時間内に完了できない
            }
        }

        // Calculate score based on strategy
        let score;
        if (isShortTerm) {
            // 短期: 時間効率を優先
            score = plan.timeEfficiency;
            addLog(`🤖 [DEBUG] ${ports[destPortId].name}: 時間効率=${Math.floor(plan.timeEfficiency)} G/日, 利益=${Math.floor(plan.totalProfit)}G, 日数=${plan.estimatedDays}日`);
        } else {
            // 長期: 総利益と時間効率のバランス
            score = plan.totalProfit * 0.7 + plan.timeEfficiency * 100;
            addLog(`🤖 [DEBUG] ${ports[destPortId].name}: スコア=${Math.floor(score)}, 利益=${Math.floor(plan.totalProfit)}G, 効率=${Math.floor(plan.timeEfficiency)} G/日`);
        }

        if (score > bestScore) {
            bestScore = score;
            bestDestPort = destPortId;
            bestPurchasePlan = plan;
        }
    }

    // Return the best purchase plan
    if (bestDestPort && bestPurchasePlan) {
        const cargoSpace = getCargoSpace();
        if (cargoSpace >= AUTOPILOT_CONFIG.MINIMUM_CARGO_SPACE) {
            if (isShortTerm) {
                addLog(`🤖 [最適] ${ports[bestDestPort].name}を選択（時間効率: ${Math.floor(bestPurchasePlan.timeEfficiency)} G/日）`);
            } else {
                addLog(`🤖 [最適] ${ports[bestDestPort].name}を選択（総利益: ${Math.floor(bestPurchasePlan.totalProfit)}G、時間効率: ${Math.floor(bestPurchasePlan.timeEfficiency)} G/日）`);
            }
            return {
                action: 'prepare_voyage',
                destinationPort: bestDestPort,
                purchasePlan: bestPurchasePlan
            };
        }
    }

    // No profitable trade found
    return null;
}

// Calculate the optimal purchase plan for a specific destination
// Returns: { totalProfit, goodsToBuy: [...], supplyCost, waterNeeded, foodNeeded }
export function calculateOptimalPurchaseForDestination(destPortId) {
    const currentPortId = gameState.currentPort;

    // 1. Calculate travel cost and required supplies
    const distance = portDistances[currentPortId][destPortId];
    const estimatedDays = Math.max(1, Math.round(distance / gameState.ship.speed));
    const supplyCost = calculateSupplyCost(estimatedDays);
    const requiredSupplies = calculateRequiredSupplies(estimatedDays);

    // 2. Calculate how much water and food we need to buy
    const waterNeeded = Math.max(0, requiredSupplies.water - (gameState.inventory.water || 0));
    const foodNeeded = Math.max(0, requiredSupplies.food - (gameState.inventory.food || 0));

    // Calculate actual cost of supplies we need to buy
    const waterPrice = goods.water.basePrice * portPrices[currentPortId].water;
    const foodPrice = goods.food.basePrice * portPrices[currentPortId].food;
    const actualSupplyCost = Math.ceil(waterNeeded * waterPrice + foodNeeded * foodPrice);

    // 3. Reserve space for supplies
    const suppliesSpace = waterNeeded + foodNeeded;
    const cargoSpace = getCargoSpace() - suppliesSpace;

    // Check if we have enough space even for supplies
    if (cargoSpace < AUTOPILOT_CONFIG.MINIMUM_CARGO_SPACE) {
        return null;
    }

    // 4. Calculate available money for goods (after supplies and safety reserve)
    const availableMoney = Math.max(0, gameState.gold - actualSupplyCost - AUTOPILOT_CONFIG.SAFETY_RESERVE);

    if (availableMoney <= 0) {
        return null;
    }

    // 5. Build list of goods with their profit margins at destination
    const goodsWithProfit = [];
    for (const goodId in goods) {
        if (goodId === 'food' || goodId === 'water') continue;

        // Get buy price at current port (using portId parameter)
        const buyPrice = getPrice(goodId, true, currentPortId);
        const portStock = getPortStock(currentPortId, goodId);

        if (portStock <= 0 || buyPrice <= 0) continue;

        // Get sell price at destination (using portId parameter - no state mutation)
        const sellPrice = getPrice(goodId, false, destPortId);

        const profitPerUnit = sellPrice - buyPrice;

        if (profitPerUnit > 0) {
            goodsWithProfit.push({
                goodId,
                buyPrice,
                sellPrice,
                profitPerUnit,
                stock: portStock
            });
        }
    }

    // Sort by profit per unit (greedy approach for knapsack problem)
    goodsWithProfit.sort((a, b) => b.profitPerUnit - a.profitPerUnit);

    // 6. Fill cargo with most profitable goods (greedy knapsack)
    let remainingSpace = Math.floor(cargoSpace * AUTOPILOT_CONFIG.CARGO_UTILIZATION_RATIO);
    let remainingMoney = availableMoney * AUTOPILOT_CONFIG.CARGO_UTILIZATION_RATIO;
    const goodsToBuy = [];
    let totalPurchaseCost = 0;
    let totalRevenue = 0;

    for (const good of goodsWithProfit) {
        if (remainingSpace <= 0 || remainingMoney <= 0) break;

        const maxByMoney = Math.floor(remainingMoney / good.buyPrice);
        const maxByCargo = remainingSpace;
        const maxByStock = good.stock;
        const quantity = Math.min(maxByMoney, maxByCargo, maxByStock);

        if (quantity >= AUTOPILOT_CONFIG.MINIMUM_PURCHASE_MULTIPLIER) {
            goodsToBuy.push({
                goodId: good.goodId,
                maxQuantity: quantity,
                buyPrice: good.buyPrice,
                sellPrice: good.sellPrice,
                purchased: 0
            });

            const cost = quantity * good.buyPrice;
            const revenue = quantity * good.sellPrice;

            totalPurchaseCost += cost;
            totalRevenue += revenue;
            remainingSpace -= quantity;
            remainingMoney -= cost;
        }
    }

    // 7. Calculate total profit (revenue - purchase cost - supply cost)
    const totalProfit = totalRevenue - totalPurchaseCost - actualSupplyCost;

    if (goodsToBuy.length === 0) {
        return null;
    }

    // 8. Calculate time efficiency
    const timeEfficiency = calculateTimeEfficiency(totalProfit, estimatedDays);

    return {
        totalProfit,
        estimatedDays,
        timeEfficiency,
        goodsToBuy,
        supplyCost: actualSupplyCost,
        waterNeeded,
        foodNeeded
    };
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        findBestTrade,
        calculateOptimalPurchaseForDestination,
        calculateTimeEfficiency
    };
}
