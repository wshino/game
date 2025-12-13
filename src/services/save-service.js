import { gameState, portInventory } from '../core/game-state.js';
import { ports, shipUpgrades, inventorySettings, goods } from '../core/constants.js';
import { addLog } from '../utils/logger.js';
import { initializePortInventory, refreshPortInventory } from './port-service.js';
import { completeVoyageCore, checkAndTriggerDisasters } from './voyage-service.js';
import { updateDisasters, getActiveDisaster } from './disaster-service.js';
import {
    simulateOfflineAutopilot,
    runAutopilotCycle,
    startAutopilotTimer,
    checkAutopilotTimeout,
    getRemainingAutopilotTime,
    executeAutopilotDecision
} from './autopilot-service.js';

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
    } catch (e) {
        console.error('セーブに失敗しました:', e);
    }
}

// Debounced save - delays save by 500ms, cancels previous pending saves
let saveTimeout = null;
export function saveGameDebounced() {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
        saveGame();
        saveTimeout = null;
    }, 500);
}

// Load game from localStorage
export function loadGame() {
    try {
        const saved = localStorage.getItem('daikokaiGameSave');

        if (saved) {
            const loadedState = JSON.parse(saved);

            // Load all saved state
            gameState.gold = loadedState.gold;
            gameState.currentPort = loadedState.currentPort;
            gameState.inventory = loadedState.inventory || {};

            // Load ship - update to latest ship definition while preserving game state
            if (loadedState.ship && loadedState.ship.name) {
                // Find the latest ship definition by name
                const latestShipDef = shipUpgrades.find(s => s.name === loadedState.ship.name);
                if (latestShipDef) {
                    // Use latest definition but preserve saved values
                    gameState.ship = {
                        ...latestShipDef,
                        crew: loadedState.ship.crew || latestShipDef.crew,
                        durability: loadedState.ship.durability ?? latestShipDef.maxDurability,
                        maxDurability: latestShipDef.maxDurability,
                        combatPower: latestShipDef.combatPower,
                        speedBonus: loadedState.ship.speedBonus || 0
                    };
                } else {
                    // Ship not found in definitions, use saved data as fallback
                    gameState.ship = loadedState.ship;
                }
            } else {
                gameState.ship = loadedState.ship;
            }

            // Ensure ship properties exist (for backward compatibility)
            if (!gameState.ship.crew) {
                gameState.ship.crew = 20;
            }
            if (gameState.ship.durability === undefined) {
                gameState.ship.durability = gameState.ship.maxDurability || 100;
            }
            if (!gameState.ship.maxDurability) {
                gameState.ship.maxDurability = 100;
            }
            if (!gameState.ship.combatPower) {
                gameState.ship.combatPower = 10;
            }
            if (gameState.ship.speedBonus === undefined) {
                gameState.ship.speedBonus = 0;
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

            // Load port investments (with backward compatibility)
            gameState.portInvestments = loadedState.portInvestments || {
                lisbon: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
                seville: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
                venice: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
                alexandria: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
                calicut: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
                malacca: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
                nagasaki: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 }
            };

            // Load achievements (with backward compatibility)
            gameState.achievements = loadedState.achievements || {
                apprentice: true,
                merchant: false,
                greatMerchant: false,
                wealthyMerchant: false,
                tradeKing: false,
                seaLord: false,
                worldTraveler: false,
                spiceKing: false,
                tradeMaster: false,
                investor: false,
                portRuler: false
            };

            // Load statistics (with backward compatibility)
            gameState.statistics = loadedState.statistics || {
                totalGoldEarned: 0,
                totalVoyages: 0,
                totalTrades: 0,
                goodsTraded: {
                    wine: 0,
                    cloth: 0,
                    spices: 0,
                    silk: 0,
                    gold_ore: 0,
                    porcelain: 0,
                    tea: 0,
                    silver: 0
                },
                portsVisited: {
                    lisbon: true,
                    seville: false,
                    venice: false,
                    alexandria: false,
                    calicut: false,
                    malacca: false,
                    nagasaki: false
                },
                maxGold: loadedState.gold || 1100
            };

            // Ensure event statistics exist (backward compatibility)
            if (gameState.statistics.eventsEncountered === undefined) {
                gameState.statistics.eventsEncountered = 0;
            }
            if (gameState.statistics.piratesDefeated === undefined) {
                gameState.statistics.piratesDefeated = 0;
            }
            if (gameState.statistics.castawaysRescued === undefined) {
                gameState.statistics.castawaysRescued = 0;
            }
            if (gameState.statistics.treasuresFound === undefined) {
                gameState.statistics.treasuresFound = 0;
            }

            // Load treasures (with backward compatibility)
            gameState.treasures = loadedState.treasures || {};

            // Load active effects (with backward compatibility)
            gameState.activeEffects = loadedState.activeEffects || {
                bonusGoldNextTrade: 0,
                luckBonus: 0,
                pirateProtection: 0,
                tradeBonus: 0
            };

            // Load pending event if any
            gameState.pendingEvent = loadedState.pendingEvent || null;

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

            // Check for ongoing autopilot and resume if needed
            checkAndUpdateAutopilotProgress();

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

    // Use shared core logic
    completeVoyageCore(destinationPortId, actualDays);

    // Save and update UI immediately (no modal to close)
    saveGame();
    if (updateAll) {
        updateAll();
    }
}

// Check if autopilot is active and resume after page reload
function checkAndUpdateAutopilotProgress() {
    if (!gameState.autopilotActive || !gameState.autopilotStartTime) {
        return;
    }

    const now = Date.now();
    const elapsedRealTime = now - gameState.autopilotStartTime;
    const elapsedMinutes = elapsedRealTime / 60000;

    // If autopilot duration has not elapsed, simulate offline progress
    if (elapsedMinutes < gameState.autopilotDurationMinutes) {
        addLog('🤖 オートパイロット再開中...');

        // Simulate offline autopilot progress with dependencies
        const executorWithDeps = () => executeAutopilotDecision(getRemainingAutopilotTime);
        const summary = simulateOfflineAutopilot(elapsedMinutes, checkAutopilotTimeout, executorWithDeps);

        // Show offline progress details
        const profit = summary.goldEnd - summary.goldStart;
        const profitSign = profit >= 0 ? '+' : '';
        addLog(`📊 オフライン中の進捗: 取引${summary.tradesCompleted}回、航海${summary.voyagesCompleted}回、利益${profitSign}${profit}G`);

        // If autopilot is still active after simulation, resume the loop
        if (gameState.autopilotActive) {
            addLog(`🤖 オートパイロットを再開しました (残り: ${Math.round(gameState.autopilotDurationMinutes - elapsedMinutes)}分)`);
            startAutopilotTimer();
            runAutopilotCycle(checkAutopilotTimeout, executorWithDeps);
        }

        // Save and update after simulation
        saveGame();
        if (updateAll) {
            updateAll();
        }
    } else {
        // Autopilot duration has elapsed while offline - it should have stopped
        // The simulateOfflineAutopilot will handle stopping it properly
        addLog('🤖 オフライン中にオートパイロットが完了しました');

        const executorWithDeps = () => executeAutopilotDecision(getRemainingAutopilotTime);
        const summary = simulateOfflineAutopilot(gameState.autopilotDurationMinutes, checkAutopilotTimeout, executorWithDeps);

        // Show offline progress details
        const profit = summary.goldEnd - summary.goldStart;
        const profitSign = profit >= 0 ? '+' : '';
        addLog(`📊 オフライン中の進捗: 取引${summary.tradesCompleted}回、航海${summary.voyagesCompleted}回、利益${profitSign}${profit}G`);

        // Save and update
        saveGame();
        if (updateAll) {
            updateAll();
        }
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

    // Update existing disasters and check for new ones
    updateDisasters(1);
    checkAndTriggerDisasters(1);

    // Check if current port has a disaster
    const disaster = getActiveDisaster(gameState.currentPort);

    // Add log
    addLog(`🌙 1日休息しました（${gameState.gameTime}日目）`);
    addLog(`✨ 港の在庫が補充されました`);

    if (disaster) {
        addLog(`${disaster.info.emoji} この港は${disaster.info.name}の被害を受けている（残り${disaster.remainingDays}日）`);
    }

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
