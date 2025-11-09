import { gameState, portInventory } from '../core/game-state.js';
import { ports, shipUpgrades, inventorySettings, goods } from '../core/constants.js';
import { addLog } from '../utils/logger.js';
import { initializePortInventory, refreshPortInventory } from './port-service.js';
import { consumeSupplies } from './supply-service.js';

// NOTE: These UI functions need to be imported from game.js or a UI module
// For now, they are expected to be available in the global scope or passed as parameters
// TODO: Refactor to use proper dependency injection or create a UI service module
let updateAll;
let showVoyageModalInProgress;

// Set UI callback functions (call this from main game initialization)
export function setUICallbacks(updateAllFn, showVoyageModalInProgressFn) {
    updateAll = updateAllFn;
    showVoyageModalInProgress = showVoyageModalInProgressFn;
}

// Save game to localStorage
export function saveGame() {
    try {
        const saveData = {
            ...gameState,
            portInventory: portInventory
        };
        localStorage.setItem('daikokaiGameSave', JSON.stringify(saveData));
        console.log('ゲームをセーブしました - 資金:', gameState.gold, '日数:', gameState.gameTime);
    } catch (e) {
        console.error('セーブに失敗しました:', e);
    }
}

// Load game from localStorage
export function loadGame() {
    try {
        const saved = localStorage.getItem('daikokaiGameSave');
        console.log('ロード試行 - saved:', saved ? '存在する' : 'なし');

        if (saved) {
            const loadedState = JSON.parse(saved);
            console.log('ロードしたデータ - 資金:', loadedState.gold, '日数:', loadedState.gameTime);

            // Load all saved state
            gameState.gold = loadedState.gold;
            gameState.currentPort = loadedState.currentPort;
            gameState.inventory = loadedState.inventory || {};

            // Load ship - update to latest ship definition while preserving game state (crew)
            if (loadedState.ship && loadedState.ship.name) {
                // Find the latest ship definition by name
                const latestShipDef = shipUpgrades.find(s => s.name === loadedState.ship.name);
                if (latestShipDef) {
                    // Use latest definition but preserve crew from save
                    gameState.ship = {
                        ...latestShipDef,
                        crew: loadedState.ship.crew || latestShipDef.crew
                    };
                    console.log(`船の定義を更新: ${latestShipDef.name} (積載量: ${latestShipDef.capacity})`);
                } else {
                    // Ship not found in definitions, use saved data as fallback
                    gameState.ship = loadedState.ship;
                    console.warn(`船の定義が見つかりません: ${loadedState.ship.name}`);
                }
            } else {
                gameState.ship = loadedState.ship;
            }

            // Ensure crew exists (for backward compatibility)
            if (!gameState.ship.crew) {
                gameState.ship.crew = 20;
            }
            gameState.logs = loadedState.logs || [];
            gameState.gameTime = loadedState.gameTime || 0;
            gameState.isVoyaging = loadedState.isVoyaging || false;
            gameState.selectedDestination = loadedState.selectedDestination || null;

            // Load real-time voyage data
            gameState.voyageStartTime = loadedState.voyageStartTime || null;
            gameState.voyageStartPort = loadedState.voyageStartPort || null;
            gameState.voyageDestinationPort = loadedState.voyageDestinationPort || null;
            gameState.voyageEstimatedDays = loadedState.voyageEstimatedDays || null;
            gameState.voyageActualDays = loadedState.voyageActualDays || null;
            gameState.voyageWeatherHistory = loadedState.voyageWeatherHistory || [];

            // Load autopilot data
            gameState.autopilotActive = loadedState.autopilotActive || false;
            gameState.autopilotStartTime = loadedState.autopilotStartTime || null;
            gameState.autopilotDurationMinutes = loadedState.autopilotDurationMinutes || 0;
            gameState.autopilotReport = loadedState.autopilotReport || {
                startGold: 0,
                startTime: 0,
                trades: [],
                voyages: [],
                totalProfit: 0
            };

            // Load port inventory if available
            if (loadedState.portInventory) {
                for (const portId in loadedState.portInventory) {
                    portInventory[portId] = loadedState.portInventory[portId];
                }

                // Fix water and food inventory for ports (in case of old save data)
                for (const portId in ports) {
                    if (!portInventory[portId]) {
                        portInventory[portId] = {};
                    }

                    const portSize = ports[portId].size;
                    const maxStock = inventorySettings[portSize].maxStock;

                    // Ensure all goods have proper initial values
                    for (const goodId in goods) {
                        // Initialize missing goods with max stock
                        if (!portInventory[portId][goodId] || portInventory[portId][goodId] === 0) {
                            portInventory[portId][goodId] = maxStock;
                        }
                    }
                }
            } else {
                // Initialize if old save
                initializePortInventory();
            }

            console.log('gameState更新後 - 資金:', gameState.gold, '日数:', gameState.gameTime);

            // Restore logs to UI
            const logDiv = document.getElementById('game-log');
            logDiv.innerHTML = '';
            gameState.logs.forEach(log => {
                const p = document.createElement('p');
                p.textContent = log;
                logDiv.appendChild(p);
            });

            addLog('💾 前回のセーブデータを読み込みました！');

            // Check for ongoing voyage and update based on real-time
            checkAndUpdateVoyageProgress();

            return true;
        }
    } catch (e) {
        console.error('ロードに失敗しました:', e);
    }
    return false;
}

// Check if a voyage is in progress and update based on real-time elapsed
function checkAndUpdateVoyageProgress() {
    // Validate voyage state - if any critical data is missing, cancel the voyage
    if (!gameState.isVoyaging || !gameState.voyageStartTime || !gameState.voyageDestinationPort) {
        if (gameState.isVoyaging) {
            console.log('航海状態が不完全です。航海をキャンセルします。');
            gameState.isVoyaging = false;
            gameState.voyageStartTime = null;
            gameState.voyageStartPort = null;
            gameState.voyageDestinationPort = null;
            gameState.voyageEstimatedDays = null;
            gameState.voyageActualDays = null;
            gameState.voyageWeatherHistory = [];
            saveGame();
        }
        return;
    }

    // Ensure voyageStartPort exists (for backward compatibility with old saves)
    if (!gameState.voyageStartPort) {
        console.log('出発港が記録されていません。航海をキャンセルします。');
        gameState.isVoyaging = false;
        gameState.voyageStartTime = null;
        gameState.voyageStartPort = null;
        gameState.voyageDestinationPort = null;
        gameState.voyageEstimatedDays = null;
        gameState.voyageActualDays = null;
        gameState.voyageWeatherHistory = [];
        saveGame();
        return;
    }

    const TIME_PER_DAY = 15000; // 15 seconds per game day
    const now = Date.now();
    const elapsedRealTime = now - gameState.voyageStartTime;
    const elapsedGameDays = Math.floor(elapsedRealTime / TIME_PER_DAY);

    console.log('航海チェック - 経過日数:', elapsedGameDays, '必要日数:', gameState.voyageActualDays || gameState.voyageEstimatedDays);

    // Check if voyage is complete
    const requiredDays = gameState.voyageActualDays || gameState.voyageEstimatedDays;
    if (elapsedGameDays >= requiredDays) {
        // Voyage is complete - finish it immediately
        completeVoyageImmediately(requiredDays);
    } else {
        // Voyage is still in progress - show modal
        const fromPort = ports[gameState.voyageStartPort].name;
        const toPort = ports[gameState.voyageDestinationPort].name;
        if (showVoyageModalInProgress) {
            showVoyageModalInProgress(fromPort, toPort, elapsedGameDays, requiredDays);
        }
    }
}

// Complete voyage immediately (for when returning to game after voyage finished)
function completeVoyageImmediately(actualDays) {
    const destinationPortId = gameState.voyageDestinationPort;

    // Advance time
    gameState.gameTime += actualDays;

    // Consume supplies
    consumeSupplies(actualDays);

    // Change port
    const oldPort = ports[gameState.voyageStartPort].name;
    gameState.currentPort = destinationPortId;
    const newPort = ports[destinationPortId].name;

    // Refresh port inventories
    refreshPortInventory(actualDays);

    // Clear voyage state
    gameState.isVoyaging = false;
    gameState.voyageStartTime = null;
    gameState.voyageStartPort = null;
    gameState.voyageDestinationPort = null;
    gameState.voyageEstimatedDays = null;
    gameState.voyageActualDays = null;
    gameState.voyageWeatherHistory = [];

    // Add logs
    addLog(`⛵ ${oldPort}から${newPort}へ${actualDays}日間の航海を終えました`);
    addLog(`🏖️ ${ports[destinationPortId].emoji} ${newPort}に到着！`);
    addLog(`📅 現在の日数: ${gameState.gameTime}日目`);

    console.log('航海完了 - 自動到着処理');

    // Save and update UI
    saveGame();
    if (updateAll) {
        updateAll();
    }
}

// Rest for one day to replenish port inventory
export function restOneDay() {
    if (gameState.isVoyaging) {
        addLog('❌ 航海中は休息できません');
        return;
    }

    // Advance time by 1 day
    gameState.gameTime += 1;

    // Refresh port inventory
    refreshPortInventory(1);

    // Add log
    addLog(`🌙 1日休息しました（${gameState.gameTime}日目）`);
    addLog(`✨ 港の在庫が補充されました`);

    // Update UI
    if (updateAll) {
        updateAll();
    }
}

// Clear save data and reload
export function clearSave() {
    if (confirm('セーブデータを削除して最初からやり直しますか？')) {
        localStorage.removeItem('daikokaiGameSave');
        location.reload();
    }
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveGame,
        loadGame,
        clearSave,
        restOneDay,
        setUICallbacks
    };
}
