// Main autopilot service - unified interface
// This module re-exports all autopilot functionality from specialized modules

import {
    startAutopilot,
    stopAutopilot,
    checkAutopilotTimeout,
    setUICallbacks,
    getRemainingAutopilotTime,
    startAutopilotTimer,
    stopAutopilotTimer
} from './autopilot-lifecycle.js';

import {
    runAutopilotCycle,
    executeAutopilotDecision,
    executePurchasePlan
} from './autopilot-executor.js';

import {
    findBestTrade,
    calculateOptimalPurchaseForDestination,
    calculateTimeEfficiency
} from './autopilot-planner.js';

import {
    generateAutopilotReport,
    simulateOfflineAutopilot
} from './autopilot-report.js';

// Re-export all functions for backwards compatibility
export {
    // Lifecycle management
    startAutopilot,
    stopAutopilot,
    checkAutopilotTimeout,
    setUICallbacks,
    getRemainingAutopilotTime,
    startAutopilotTimer,
    stopAutopilotTimer,

    // Execution
    runAutopilotCycle,
    executeAutopilotDecision,
    executePurchasePlan,

    // Planning
    findBestTrade,
    calculateOptimalPurchaseForDestination,
    calculateTimeEfficiency,

    // Reporting
    generateAutopilotReport,
    simulateOfflineAutopilot
};

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
