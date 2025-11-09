// Main game entry point - imports and integrates all modules

// Core modules
import { gameState, portInventory } from './core/game-state.js';
import { ports, goods, portDistances, seaRoutes, inventorySettings, shipUpgrades } from './core/constants.js';

// Utils
import { addLog } from './utils/logger.js';
import * as calculations from './utils/calculations.js';

// Services
import { initializePortInventory, getPortStock, reducePortStock } from './services/port-service.js';
import { saveGame, loadGame, clearSave, restOneDay, setUICallbacks as setSaveUICallbacks } from './services/save-service.js';
import { calculateRequiredSupplies, calculateSupplyCost } from './services/supply-service.js';
import { buyGood, buyAllGood, sellGood, sellAllGood, upgradeShip, travelTo, setUICallbacks as setTradeUICallbacks } from './services/trade-service.js';
import {
    selectDestination,
    startSelectedVoyage,
    cancelDestination,
    startVoyage,
    showVoyageModalInProgress,
    setUICallbacks as setVoyageUICallbacks
} from './services/voyage-service.js';
import {
    startAutopilot,
    stopAutopilot,
    setUICallbacks as setAutopilotUICallbacks
} from './services/autopilot-service.js';

// UI
import { updateAll, setUICallbacks as setUIUpdaterCallbacks } from './ui/ui-updater.js';
import { updateAutopilotUI, showAutopilotReport, closeAutopilotReport, toggleAutopilot } from './ui/autopilot-ui.js';

// Initialize game
function initGame() {
    // Set up UI callbacks for all modules
    setSaveUICallbacks(updateAll, showVoyageModalInProgress);
    setTradeUICallbacks(updateAll);
    setVoyageUICallbacks(updateAll, saveGame);
    setAutopilotUICallbacks(updateAll, saveGame, showAutopilotReport);
    setUIUpdaterCallbacks(updateAutopilotUI);

    // Load game or start new game
    const loaded = loadGame();

    if (!loaded) {
        // Initialize port inventory for new game
        initializePortInventory();

        addLog('🌊 大航海時代へようこそ！');
        addLog('💡 各港で商品を安く買い、高く売って利益を得ましょう。');
        addLog('💡 おすすめ: まずは近隣の港（セビリア、ヴェネツィア）で取引して資金を貯めましょう。');
        addLog('💡 遠い港（カリカット、長崎）へは、段階的に東へ進むと効率的です。');
        addLog('💡 港の在庫は限られています。時間が経つと在庫が回復します。');
        addLog('💡 資金を貯めて、より大きな船にアップグレードしましょう！');
        addLog('💡 移動中にゲームを閉じても、現実時間で移動が進行します！');
    }

    updateAll();
}

// Make functions globally accessible for onclick handlers
if (typeof window !== 'undefined') {
    window.buyGood = buyGood;
    window.buyAllGood = buyAllGood;
    window.sellGood = sellGood;
    window.sellAllGood = sellAllGood;
    window.travelTo = (portId) => travelTo(portId, startVoyage);
    window.upgradeShip = upgradeShip;
    window.clearSave = clearSave;
    window.restOneDay = restOneDay;
    window.selectDestination = selectDestination;
    window.startSelectedVoyage = startSelectedVoyage;
    window.cancelDestination = cancelDestination;
    window.startAutopilot = startAutopilot;
    window.stopAutopilot = stopAutopilot;
    window.closeAutopilotReport = closeAutopilotReport;
    window.toggleAutopilot = toggleAutopilot;
}

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        gameState,
        ports,
        goods,
        portInventory,
        portDistances,
        seaRoutes,
        inventorySettings,
        calculateRequiredSupplies,
        getPortStock,
        reducePortStock,
        initializePortInventory,
        ...calculations,
        saveGame,
        loadGame,
        calculateSupplyCost
    };
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', initGame);
