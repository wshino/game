import { gameState } from '../core/game-state.js';
import { AUTOPILOT_CONFIG, ports, goods, portPrices, portDistances, inventorySettings } from '../core/constants.js';
import { getPrice, getCargoSpace } from '../utils/calculations.js';
import { getPortStock, reducePortStock, refreshPortInventory } from './port-service.js';
import { calculateRequiredSupplies, hasEnoughSupplies, autoSupplyForVoyage, consumeSupplies, calculateSupplyCost } from './supply-service.js';
import { startVoyage } from './voyage-service.js';
import { addLog } from '../utils/logger.js';

// UI callback functions
let updateAll;
let saveGame;
let showAutopilotReport;

// Timer for periodic UI updates
let autopilotTimerId = null;

// Set UI callback functions (call this from main game initialization)
export function setUICallbacks(updateAllFn, saveGameFn, showAutopilotReportFn) {
    updateAll = updateAllFn;
    saveGame = saveGameFn;
    showAutopilotReport = showAutopilotReportFn;
}

// Start autopilot mode
export function startAutopilot(durationHours) {
    if (gameState.isVoyaging) {
        addLog('❌ 航海中はオートパイロットを開始できません');
        return;
    }

    if (durationHours < 1 || durationHours > 24) {
        addLog('❌ オートパイロット時間は1時間〜24時間で設定してください');
        return;
    }

    // Convert hours to minutes for internal use
    const durationMinutes = durationHours * 60;

    gameState.autopilotActive = true;
    gameState.autopilotStartTime = Date.now();
    gameState.autopilotDurationMinutes = durationMinutes;
    gameState.autopilotReport = {
        startGold: gameState.gold,
        startTime: gameState.gameTime,
        trades: [],
        voyages: [],
        totalProfit: 0
    };

    addLog(`🤖 オートパイロット開始！(${durationHours}時間)`);
    addLog('船が自動的に貿易を行います...');

    saveGame();
    updateAll();

    // Start periodic timer update
    startAutopilotTimer();

    // Start autopilot loop
    runAutopilotCycle();
}

// Stop autopilot mode
export function stopAutopilot(isAutoStop = false) {
    if (!gameState.autopilotActive) {
        return;
    }

    // Sell all remaining goods before stopping
    const hasGoodsToSell = Object.keys(gameState.inventory).some(goodId => {
        return gameState.inventory[goodId] > 0 && goodId !== 'food' && goodId !== 'water';
    });

    if (hasGoodsToSell) {
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
        addLog(`🤖 オートパイロット終了時に残りの商品を売却しました`);
    }

    gameState.autopilotActive = false;

    // Stop periodic timer update
    stopAutopilotTimer();

    // Log appropriate message
    if (isAutoStop) {
        addLog(`✅ オートパイロットが時間切れで自動停止しました`);
    } else {
        addLog(`⏹️ オートパイロットを手動停止しました`);
    }

    const report = generateAutopilotReport();
    showAutopilotReport(report);

    saveGame();
    updateAll();
}

// Check if autopilot should stop
export function checkAutopilotTimeout() {
    if (!gameState.autopilotActive) {
        return false;
    }

    const elapsed = Date.now() - gameState.autopilotStartTime;
    const elapsedMinutes = elapsed / 60000;

    if (elapsedMinutes >= gameState.autopilotDurationMinutes) {
        addLog(`⏰ オートパイロット実行時間が終了しました`);
        stopAutopilot(true); // Auto-stop
        return true;
    }

    return false;
}

// Start periodic timer updates
export function startAutopilotTimer() {
    // Clear any existing timer
    stopAutopilotTimer();

    // Update timer display every second
    const updateTimer = () => {
        // Check if autopilot should stop FIRST (before checking autopilotActive)
        // This ensures that timeout is checked even if the flag hasn't been updated yet
        if (gameState.autopilotActive && checkAutopilotTimeout()) {
            // stopAutopilot() was called, which sets autopilotActive to false
            // and calls stopAutopilotTimer(), so we don't need to schedule another update
            return;
        }

        // If autopilot is no longer active, stop the timer
        if (!gameState.autopilotActive) {
            stopAutopilotTimer();
            return;
        }

        // Update UI
        updateAll();

        // Check timeout again after UI update
        // This ensures immediate response when time runs out during the UI update
        if (gameState.autopilotActive && checkAutopilotTimeout()) {
            // stopAutopilot() was called, timer is already stopped
            return;
        }

        // Schedule next update
        autopilotTimerId = setTimeout(updateTimer, 1000);
    };

    // Start the timer
    autopilotTimerId = setTimeout(updateTimer, 1000);
}

// Stop periodic timer updates
export function stopAutopilotTimer() {
    if (autopilotTimerId !== null) {
        clearTimeout(autopilotTimerId);
        autopilotTimerId = null;
    }
}

// Run a single autopilot cycle
export function runAutopilotCycle() {
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
            setTimeout(() => runAutopilotCycle(), 1000);
        }
        return;
    }

    // Execute autopilot decision
    const actionTaken = executeAutopilotDecision();

    // If no action was taken (waiting for inventory replenishment),
    // wait longer before next cycle to avoid advancing time too quickly
    const nextCycleDelay = actionTaken ? 1000 : 3000;
    setTimeout(() => runAutopilotCycle(), nextCycleDelay);
}

// Execute autopilot decision (buy/sell/travel)
export function executeAutopilotDecision() {
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
        const bestTrade = findBestTrade();

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

// Get remaining autopilot time
export function getRemainingAutopilotTime() {
    if (!gameState.autopilotActive) {
        return { remainingMinutes: 0, remainingGameDays: 0 };
    }

    const elapsed = Date.now() - gameState.autopilotStartTime;
    const elapsedMinutes = elapsed / 60000;
    const remainingMinutes = Math.max(0, gameState.autopilotDurationMinutes - elapsedMinutes);

    // リアル時間をゲーム日数に変換
    // 仮定: 平均的な取引サイクル = 15秒/日（航海のリアルタイム進行考慮）
    const REAL_TIME_PER_GAME_DAY = 15; // 秒
    const remainingGameDays = (remainingMinutes * 60) / REAL_TIME_PER_GAME_DAY;

    return {
        remainingMinutes,
        remainingGameDays: Math.max(0, remainingGameDays)
    };
}

// Calculate time efficiency (profit per game day)
const TRADE_TIME_OVERHEAD = 2; // 取引処理にかかる時間（ゲーム日数）

export function calculateTimeEfficiency(totalProfit, estimatedDays) {
    const totalTime = estimatedDays + TRADE_TIME_OVERHEAD;
    return totalProfit / totalTime;
}

// Simulate offline autopilot progress
export function simulateOfflineAutopilot(offlineMinutes) {
    const summary = {
        cyclesExecuted: 0,
        tradesCompleted: 0,
        voyagesCompleted: 0,
        goldStart: gameState.gold,
        goldEnd: 0,
        timeSimulated: 0 // in seconds
    };

    const maxSimulationTime = offlineMinutes * 60; // Convert to seconds
    let simulatedTime = 0;

    // Temporarily disable logging during simulation
    const originalLogs = [];
    const originalAddLog = addLog;
    let logEnabled = false;

    addLog = function(message) {
        if (logEnabled) {
            originalAddLog(message);
        }
    };

    try {
        while (simulatedTime < maxSimulationTime && gameState.autopilotActive) {
            summary.cyclesExecuted++;

            // Check timeout
            if (checkAutopilotTimeout()) {
                break;
            }

            // If currently voyaging, complete the voyage instantly
            if (gameState.isVoyaging) {
                const actualDays = gameState.voyageActualDays || gameState.voyageEstimatedDays;

                // Complete voyage without UI updates
                gameState.gameTime += actualDays;
                consumeSupplies(actualDays);

                const destinationPortId = gameState.voyageDestinationPort;
                gameState.currentPort = destinationPortId;
                refreshPortInventory(actualDays);

                // Clear voyage state
                gameState.isVoyaging = false;
                gameState.voyageStartTime = null;
                gameState.voyageStartPort = null;
                gameState.voyageDestinationPort = null;
                gameState.voyageEstimatedDays = null;
                gameState.voyageActualDays = null;
                gameState.voyageWeatherHistory = [];

                summary.voyagesCompleted++;

                // Voyages complete instantly in simulation, consuming minimal simulation time
                simulatedTime += 10; // 10 seconds for voyage completion processing
                continue;
            }

            // Execute autopilot decision
            const goldBefore = gameState.gold;
            const actionTaken = executeAutopilotDecision();
            const goldAfter = gameState.gold;

            // Track trades (buying or selling)
            if (goldBefore !== goldAfter && !gameState.isVoyaging) {
                summary.tradesCompleted++;
            }

            // Advance simulated time based on action
            const cycleDelay = actionTaken ? 1 : 3; // 1 second if action, 3 if waiting
            simulatedTime += cycleDelay;

            // Safety check: prevent infinite loops
            if (summary.cyclesExecuted > 10000) {
                logEnabled = true;
                addLog('⚠️ シミュレーション上限に到達しました');
                break;
            }
        }
    } finally {
        // Restore original logging function
        addLog = originalAddLog;
    }

    summary.goldEnd = gameState.gold;
    summary.timeSimulated = simulatedTime;

    return summary;
}

// Find the best trade opportunity based on total profit (not profit per unit)
export function findBestTrade() {
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

        // Calculate sell value at current port
        const originalPort = gameState.currentPort;
        gameState.currentPort = currentPortId;
        for (const goodId in gameState.inventory) {
            if (goodId === 'food' || goodId === 'water') continue;
            const quantity = gameState.inventory[goodId];
            if (quantity > 0) {
                bestTotalSellValue += getPrice(goodId, false) * quantity;
            }
        }
        gameState.currentPort = originalPort;

        // Check all other ports for better selling prices
        for (const destPortId in ports) {
            if (destPortId === currentPortId) continue;

            // Calculate total sell value at destination
            gameState.currentPort = destPortId;
            let destSellValue = 0;
            for (const goodId in gameState.inventory) {
                if (goodId === 'food' || goodId === 'water') continue;
                const quantity = gameState.inventory[goodId];
                if (quantity > 0) {
                    destSellValue += getPrice(goodId, false) * quantity;
                }
            }
            gameState.currentPort = originalPort;

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
    const originalPort = gameState.currentPort;

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

        const buyPrice = getPrice(goodId, true);
        const portStock = getPortStock(currentPortId, goodId);

        if (portStock <= 0 || buyPrice <= 0) continue;

        // Get sell price at destination
        gameState.currentPort = destPortId;
        const sellPrice = getPrice(goodId, false);
        gameState.currentPort = originalPort;

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

// Generate autopilot report
export function generateAutopilotReport() {
    const endGold = gameState.gold;
    const profit = endGold - gameState.autopilotReport.startGold;
    const endTime = gameState.gameTime;
    const daysElapsed = endTime - gameState.autopilotReport.startTime;

    gameState.autopilotReport.totalProfit = profit;

    // Convert minutes to hours for display
    const durationHours = Math.floor(gameState.autopilotDurationMinutes / 60);
    const durationMinutes = gameState.autopilotDurationMinutes % 60;
    let durationText = '';
    if (durationHours > 0) {
        durationText = `${durationHours}時間`;
        if (durationMinutes > 0) {
            durationText += `${durationMinutes}分`;
        }
    } else {
        durationText = `${durationMinutes}分`;
    }

    return {
        duration: gameState.autopilotDurationMinutes,
        durationText: durationText,
        startGold: gameState.autopilotReport.startGold,
        endGold: endGold,
        profit: profit,
        daysElapsed: daysElapsed,
        trades: gameState.autopilotReport.trades,
        voyages: gameState.autopilotReport.voyages
    };
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        startAutopilot,
        stopAutopilot,
        checkAutopilotTimeout,
        runAutopilotCycle,
        executeAutopilotDecision,
        executePurchasePlan,
        simulateOfflineAutopilot,
        findBestTrade,
        calculateOptimalPurchaseForDestination,
        generateAutopilotReport,
        setUICallbacks,
        getRemainingAutopilotTime,
        calculateTimeEfficiency,
        startAutopilotTimer,
        stopAutopilotTimer
    };
}
