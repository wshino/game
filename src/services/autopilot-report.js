import { gameState } from '../core/game-state.js';
import { refreshPortInventory } from './port-service.js';
import { consumeSupplies } from './supply-service.js';
import { addLog } from '../utils/logger.js';

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

// Simulate offline autopilot progress
// Dependencies are passed as parameters to avoid circular imports
export function simulateOfflineAutopilot(offlineMinutes, checkAutopilotTimeout, executeDecision) {
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
            const actionTaken = executeDecision();
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

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateAutopilotReport,
        simulateOfflineAutopilot
    };
}
