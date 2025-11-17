import { gameState } from '../core/game-state.js';
import { goods } from '../core/constants.js';
import { getPrice } from '../utils/calculations.js';
import { addLog } from '../utils/logger.js';
import { runAutopilotCycle, setExecutorCallbacks, executeAutopilotDecision } from './autopilot-executor.js';
import { generateAutopilotReport } from './autopilot-report.js';

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

    // Also set callbacks for executor
    setExecutorCallbacks(updateAllFn, saveGameFn);
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

    // Start autopilot loop with required dependencies
    const executorWithDeps = () => executeAutopilotDecision(getRemainingAutopilotTime);
    runAutopilotCycle(checkAutopilotTimeout, executorWithDeps);
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

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        startAutopilot,
        stopAutopilot,
        checkAutopilotTimeout,
        setUICallbacks,
        getRemainingAutopilotTime,
        startAutopilotTimer,
        stopAutopilotTimer
    };
}
