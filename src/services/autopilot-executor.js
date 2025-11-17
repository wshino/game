import { gameState } from '../core/game-state.js';
import { AUTOPILOT_CONFIG, ports, goods, portPrices, portDistances, inventorySettings } from '../core/constants.js';
import { getPrice, getCargoSpace } from '../utils/calculations.js';
import { getPortStock, reducePortStock, refreshPortInventory } from './port-service.js';
import { hasEnoughSupplies, autoSupplyForVoyage } from './supply-service.js';
import { startVoyage } from './voyage-service.js';
import { addLog } from '../utils/logger.js';
import { findBestTrade } from './autopilot-planner.js';

// UI callback functions
let updateAll;
let saveGame;

// Set UI callback functions
export function setExecutorCallbacks(updateAllFn, saveGameFn) {
    updateAll = updateAllFn;
    saveGame = saveGameFn;
}

// Run a single autopilot cycle
// Dependencies are passed as parameters to avoid circular imports
export function runAutopilotCycle(checkAutopilotTimeout, executeDecision) {
    if (!gameState.autopilotActive) {
        return;
    }

    // Check timeout
    if (checkAutopilotTimeout()) {
        return;
    }

    // If currently voyaging, wait and check again
    if (gameState.isVoyaging) {
        // Double-check timeout before scheduling next cycle
        // This prevents infinite loops during voyages
        if (!checkAutopilotTimeout()) {
            setTimeout(() => runAutopilotCycle(checkAutopilotTimeout, executeDecision), 1000);
        }
        return;
    }

    // Execute autopilot decision
    const actionTaken = executeDecision();

    // If no action was taken (waiting for inventory replenishment),
    // wait longer before next cycle to avoid advancing time too quickly
    const nextCycleDelay = actionTaken ? 1000 : 3000;
    setTimeout(() => runAutopilotCycle(checkAutopilotTimeout, executeDecision), nextCycleDelay);
}

// Execute autopilot decision (buy/sell/travel)
// Pass getRemainingAutopilotTime as parameter to avoid circular dependency
export function executeAutopilotDecision(getRemainingAutopilotTime) {
    // Track if any action was taken this cycle
    let actionTaken = false;

    // If we have an active purchase plan, continue executing it
    if (gameState.autopilotPlan && gameState.autopilotPlan.active) {
        addLog(`🤖 [DEBUG] 購入プランを実行中... (目的地: ${ports[gameState.autopilotPlan.destinationPort].name})`);
        actionTaken = executePurchasePlan();

        // If action was taken, return immediately to continue execution
        if (actionTaken) {
            return actionTaken;
        }
        // If no action (waiting for inventory), fall through to time advancement logic below
        // Skip finding new trades since we already have a plan
    } else {
        // Find the most profitable trade route only if we don't have an active plan
        const bestTrade = findBestTrade(getRemainingAutopilotTime);

        if (!bestTrade) {
            addLog(`🤖 [DEBUG] 利益の出る取引ルートが見つかりませんでした`);
        } else {
            addLog(`🤖 [DEBUG] 最適な取引: ${bestTrade.action}${bestTrade.destinationPort ? ' → ' + ports[bestTrade.destinationPort].name : ''}`);
        }

        if (bestTrade) {
            // If we have goods to sell, sell them first
            const hasGoodsToSell = Object.keys(gameState.inventory).some(goodId => {
                return gameState.inventory[goodId] > 0 && goodId !== 'food' && goodId !== 'water';
            });

            if (hasGoodsToSell) {
                const goodsList = Object.keys(gameState.inventory)
                    .filter(goodId => gameState.inventory[goodId] > 0 && goodId !== 'food' && goodId !== 'water')
                    .map(goodId => `${goods[goodId].name}:${gameState.inventory[goodId]}`)
                    .join(', ');
                addLog(`🤖 [DEBUG] 売却可能な商品: ${goodsList}`);
            }

            if (hasGoodsToSell && bestTrade.action === 'sell') {
                // Sell all profitable goods at current port
                for (const goodId in gameState.inventory) {
                    if (goodId === 'food' || goodId === 'water') continue;

                    const quantity = gameState.inventory[goodId];
                    if (quantity > 0) {
                        const sellPrice = getPrice(goodId, false);
                        const totalValue = sellPrice * quantity;

                        gameState.gold += totalValue;
                        gameState.autopilotReport.trades.push({
                            port: gameState.currentPort,
                            action: 'sell',
                            good: goods[goodId].name,
                            quantity: quantity,
                            price: sellPrice,
                            total: totalValue
                        });
                        gameState.inventory[goodId] = 0;
                    }
                }
                addLog(`🤖 商品を売却しました`);
                updateAll();
                actionTaken = true;
            } else if (bestTrade.action === 'travel') {
                // Travel to the best destination
                const destinationPortId = bestTrade.destinationPort;

                // Auto-supply before voyage
                const baseDays = portDistances[gameState.currentPort][destinationPortId];
                const estimatedDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));
                autoSupplyForVoyage(estimatedDays);

                // Check if we have enough supplies
                const suppliesCheck = hasEnoughSupplies(estimatedDays);
                if (suppliesCheck.hasEnough) {
                    gameState.autopilotReport.voyages.push({
                        from: ports[gameState.currentPort].name,
                        to: ports[destinationPortId].name,
                        days: estimatedDays
                    });

                    addLog(`🤖 ${ports[destinationPortId].name}へ向かいます`);
                    startVoyage(destinationPortId);
                    actionTaken = true;
                }
            } else if (bestTrade.action === 'prepare_voyage') {
                // NEW: Initialize purchase plan for the voyage
                gameState.autopilotPlan = {
                    active: true,
                    destinationPort: bestTrade.destinationPort,
                    purchasePlan: bestTrade.purchasePlan,
                    suppliesReady: false
                };
                addLog(`🤖 ${ports[bestTrade.destinationPort].name}への航路を計画しました（予想利益: ${Math.floor(bestTrade.purchasePlan.totalProfit)}G）`);
                actionTaken = true;
            }
        }
    } // End of else block for when we don't have an active purchase plan

    // If no action was taken (waiting for inventory or stuck),
    // advance time by 1 day to allow inventory to replenish
    if (!actionTaken) {
        let reason;
        if (gameState.autopilotPlan && gameState.autopilotPlan.active) {
            reason = '在庫回復待ち';
        } else {
            // bestTrade is defined only when no active plan exists
            reason = typeof bestTrade === 'undefined' || !bestTrade ? '利益の出る取引がない' : '条件を満たせない';
        }
        addLog(`🤖 [DEBUG] アクション未実行 (理由: ${reason}、資金: ${gameState.gold}G)`);
        gameState.gameTime += 1;
        refreshPortInventory(1);
        addLog(`⏰ 翌日になりました (${gameState.gameTime}日目) - 在庫が補充されました`);
        saveGame();
        updateAll();
    }

    return actionTaken;
}

// Execute the active purchase plan step by step
export function executePurchasePlan() {
    const plan = gameState.autopilotPlan;
    let actionTaken = false;

    // Check if we're already at the destination - if so, clear plan and sell
    if (plan.destinationPort === gameState.currentPort) {
        addLog(`🤖 目的地 ${ports[gameState.currentPort].name} に到着済み。購入プランをキャンセルします`);
        gameState.autopilotPlan = null;
        return false; // Let next cycle handle selling
    }

    // Step 1: Buy water and food first
    if (!plan.suppliesReady) {
        const waterNeeded = plan.purchasePlan.waterNeeded;
        const foodNeeded = plan.purchasePlan.foodNeeded;

        if (waterNeeded > 0 || foodNeeded > 0) {
            let purchased = false;

            // Buy water
            if (waterNeeded > 0) {
                const waterPrice = goods.water.basePrice * portPrices[gameState.currentPort].water;
                const waterCost = Math.ceil(waterNeeded * waterPrice);

                if (gameState.gold >= waterCost) {
                    gameState.gold -= waterCost;
                    gameState.inventory.water = (gameState.inventory.water || 0) + waterNeeded;

                    gameState.autopilotReport.trades.push({
                        port: gameState.currentPort,
                        action: 'buy',
                        good: goods.water.name,
                        quantity: waterNeeded,
                        price: waterPrice,
                        total: waterCost
                    });

                    addLog(`🤖 水を${waterNeeded}個購入しました`);
                    purchased = true;
                }
            }

            // Buy food
            if (foodNeeded > 0) {
                const foodPrice = goods.food.basePrice * portPrices[gameState.currentPort].food;
                const foodCost = Math.ceil(foodNeeded * foodPrice);

                if (gameState.gold >= foodCost) {
                    gameState.gold -= foodCost;
                    gameState.inventory.food = (gameState.inventory.food || 0) + foodNeeded;

                    gameState.autopilotReport.trades.push({
                        port: gameState.currentPort,
                        action: 'buy',
                        good: goods.food.name,
                        quantity: foodNeeded,
                        price: foodPrice,
                        total: foodCost
                    });

                    addLog(`🤖 食料を${foodNeeded}個購入しました`);
                    purchased = true;
                }
            }

            if (purchased) {
                plan.suppliesReady = true;
                updateAll();
                actionTaken = true;
            }
        } else {
            plan.suppliesReady = true;
            actionTaken = true;
        }

        return actionTaken;
    }

    // Step 2: Buy goods according to the purchase plan
    const goodsToBuy = plan.purchasePlan.goodsToBuy;
    let allPurchased = true;

    for (const item of goodsToBuy) {
        const remaining = item.maxQuantity - item.purchased;

        if (remaining <= 0) continue;

        allPurchased = false;

        const goodId = item.goodId;
        const buyPrice = getPrice(goodId, true);
        const portStock = getPortStock(gameState.currentPort, goodId);
        const cargoSpace = getCargoSpace();

        // Calculate how many we can buy now
        const maxByMoney = Math.floor(gameState.gold / buyPrice);
        const maxByCargo = cargoSpace;
        const maxByStock = portStock;
        const idealQuantity = remaining;

        const canBuyNow = Math.min(maxByMoney, maxByCargo, maxByStock, idealQuantity);

        // Check if we should wait for more stock
        const portSize = ports[gameState.currentPort].size;
        const maxPossibleStock = inventorySettings[portSize].maxStock;
        const stockIsLimiting = maxByStock < idealQuantity;
        const stockTooLow = maxByStock < idealQuantity * AUTOPILOT_CONFIG.STOCK_WAIT_THRESHOLD;

        // Only wait if stock can actually recover to the desired level
        const canRecoverToDesiredLevel = idealQuantity <= maxPossibleStock;

        if (stockIsLimiting && stockTooLow && canBuyNow < idealQuantity && cargoSpace > AUTOPILOT_CONFIG.MINIMUM_CARGO_SPACE && canRecoverToDesiredLevel) {
            // Wait for inventory to replenish (but only if recovery is possible)
            addLog(`⏰ ${goods[goodId].name}の在庫回復を待機中... (現在: ${maxByStock}/${idealQuantity}, 最大: ${maxPossibleStock})`);
            actionTaken = false;
            return actionTaken;
        }

        // If we can't wait or recovery isn't possible, proceed with what we can buy
        if (!canRecoverToDesiredLevel && canBuyNow < idealQuantity) {
            addLog(`ℹ️ ${goods[goodId].name}: 港の最大在庫(${maxPossibleStock})が必要量(${idealQuantity})より少ないため、現在の在庫分(${canBuyNow})のみ購入します`);
        }

        if (canBuyNow >= AUTOPILOT_CONFIG.MINIMUM_PURCHASE_MULTIPLIER) {
            // Purchase the goods
            const totalCost = canBuyNow * buyPrice;
            gameState.gold -= totalCost;
            gameState.inventory[goodId] = (gameState.inventory[goodId] || 0) + canBuyNow;
            reducePortStock(gameState.currentPort, goodId, canBuyNow);

            item.purchased += canBuyNow;

            gameState.autopilotReport.trades.push({
                port: gameState.currentPort,
                action: 'buy',
                good: goods[goodId].name,
                quantity: canBuyNow,
                price: buyPrice,
                total: totalCost
            });

            addLog(`🤖 ${goods[goodId].name}を${canBuyNow}個購入しました (${item.purchased}/${item.maxQuantity})`);
            updateAll();
            actionTaken = true;

            // If cargo is nearly full, stop buying more
            if (getCargoSpace() < AUTOPILOT_CONFIG.MINIMUM_CARGO_SPACE) {
                allPurchased = true;
                break;
            }

            // Continue to next item after this purchase
            return actionTaken;
        }
    }

    // Step 3: If all goods purchased or cargo full, depart
    if (allPurchased || getCargoSpace() < AUTOPILOT_CONFIG.MINIMUM_CARGO_SPACE) {
        const destinationPortId = plan.destinationPort;
        const distance = portDistances[gameState.currentPort][destinationPortId];
        const estimatedDays = Math.max(1, Math.round(distance / gameState.ship.speed));

        // Check if we have enough supplies
        const suppliesCheck = hasEnoughSupplies(estimatedDays);
        if (suppliesCheck.hasEnough) {
            gameState.autopilotReport.voyages.push({
                from: ports[gameState.currentPort].name,
                to: ports[destinationPortId].name,
                days: estimatedDays
            });

            addLog(`🤖 積荷完了！${ports[destinationPortId].name}へ出港します`);

            // Clear the plan
            gameState.autopilotPlan = null;

            startVoyage(destinationPortId);
            actionTaken = true;
        } else {
            // Should not happen as we bought supplies already, but handle it
            addLog(`❌ 補給品が不足しています`);
            gameState.autopilotPlan = null;
            actionTaken = false;
        }
    }

    return actionTaken;
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAutopilotCycle,
        executeAutopilotDecision,
        executePurchasePlan,
        setExecutorCallbacks
    };
}
