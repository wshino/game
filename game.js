// Game State
const gameState = {
    gold: 1100,
    currentPort: 'lisbon',
    inventory: {},
    ship: {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    },
    logs: [],
    gameTime: 0, // Game time in days
    isVoyaging: false, // Flag to track if currently on a voyage
    selectedDestination: null, // Selected destination port before voyage
    // Real-time voyage tracking
    voyageStartTime: null, // Real-time timestamp (milliseconds) when voyage started
    voyageStartPort: null, // Port where voyage started
    voyageDestinationPort: null, // Destination port
    voyageEstimatedDays: null, // Estimated days for voyage
    voyageActualDays: null, // Actual days needed (may change due to weather)
    voyageWeatherHistory: [], // Weather changes during voyage
    // Autopilot mode
    autopilotActive: false, // Is autopilot mode active
    autopilotStartTime: null, // Real-time timestamp when autopilot started
    autopilotDurationMinutes: 0, // Duration in minutes
    autopilotReport: {
        startGold: 0,
        startTime: 0,
        trades: [],
        voyages: [],
        totalProfit: 0
    }
};

// Autopilot configuration constants
const AUTOPILOT_CONFIG = {
    SAFETY_RESERVE: 50,            // Reserve gold for emergencies (reduced for more aggressive trading)
    CARGO_UTILIZATION_RATIO: 0.9,  // Use 90% of available cargo/money for trading (increased from 70%)
    MINIMUM_PROFIT_THRESHOLD: 50,  // Minimum expected profit to execute trade (reduced from 100 to catch more opportunities)
    PROFIT_IMPROVEMENT_RATIO: 0.05,// Require 5% better profit to travel for selling (reduced from 10% for more aggressive movement)
    MINIMUM_PURCHASE_MULTIPLIER: 5,// Must afford at least 5 units to buy
    MINIMUM_CARGO_SPACE: 10,       // Minimum cargo space needed to buy
    MAX_ESTIMATED_QUANTITY: 100    // Maximum quantity to estimate for profitability calculation (increased from 50)
};

// Port Definitions (based on historical 15-16th century city sizes)
const ports = {
    lisbon: {
        name: 'リスボン',
        emoji: '🇵🇹',
        description: 'ポルトガルの首都。冒険の始まりの地。',
        size: 'large', // 大規模港 (人口10万人以上、大航海時代の中心地)
        historicalNote: '15世紀末から16世紀にかけて、大航海時代の中心として急成長。人口10万人超。',
        x: 39,  // Map coordinates (38.74°N, -9.14°W)
        y: 135
    },
    seville: {
        name: 'セビリア',
        emoji: '🇪🇸',
        description: 'スペインの港町。新大陸への玄関口。',
        size: 'large', // 大規模港 (新大陸貿易独占港、人口10万人規模)
        historicalNote: '16世紀、新大陸との貿易を独占し、スペイン随一の商業都市に成長。',
        x: 60,  // 37.38°N, -5.97°W
        y: 151
    },
    venice: {
        name: 'ヴェネツィア',
        emoji: '🇮🇹',
        description: '水の都。東方貿易の中心地。',
        size: 'very_large', // 最大規模港 (人口15-18万人、当時のヨーロッパ最大級都市)
        historicalNote: '15世紀、人口15-18万人を擁し、地中海貿易を支配する最大級の商業共和国。',
        x: 182,  // 45.44°N, 12.33°E
        y: 55
    },
    alexandria: {
        name: 'アレクサンドリア',
        emoji: '🇪🇬',
        description: 'エジプトの古都。香辛料の集積地。',
        size: 'medium', // 中規模港 (マムルーク朝/オスマン朝下で往時より衰退)
        historicalNote: '15世紀マムルーク朝下で往時の栄華からは衰退も、依然として香辛料貿易の要衝。',
        x: 300,  // 31.21°N, 29.92°E
        y: 226
    },
    calicut: {
        name: 'カリカット',
        emoji: '🇮🇳',
        description: 'インドの港町。胡椒の産地。',
        size: 'medium', // 中規模港 (インド西海岸の重要な香辛料貿易港)
        historicalNote: '15-16世紀、インド西海岸最大の香辛料貿易港。ヴァスコ・ダ・ガマが到達。',
        x: 605,  // 11.26°N, 75.78°E
        y: 465
    },
    malacca: {
        name: 'マラッカ',
        emoji: '🇲🇾',
        description: '東南アジアの交易拠点。',
        size: 'medium', // 中規模港 (マラッカ王国の首都、東南アジア貿易の中心)
        historicalNote: '15世紀、マラッカ王国の首都として東西貿易の要衝。1511年ポルトガルに征服。',
        x: 782,  // 2.20°N, 102.24°E
        y: 574
    },
    nagasaki: {
        name: '長崎',
        emoji: '🇯🇵',
        description: '日本の港町。銀と絹の取引が盛ん。',
        size: 'small', // 小規模港 (16世紀半ばまで小さな漁村、1570年代に貿易港化)
        historicalNote: '1570年代、ポルトガル貿易の拠点として開港。それまでは小さな漁村。',
        x: 966,  // 32.75°N, 129.88°E
        y: 207
    }
};

// Port inventory state (initialized on game start)
const portInventory = {};

// Port distances (in days of travel at speed 1.0)
const portDistances = {
    lisbon: { lisbon: 0, seville: 2, venice: 5, alexandria: 7, calicut: 15, malacca: 20, nagasaki: 30 },
    seville: { lisbon: 2, seville: 0, venice: 5, alexandria: 6, calicut: 14, malacca: 19, nagasaki: 29 },
    venice: { lisbon: 5, seville: 5, venice: 0, alexandria: 3, calicut: 12, malacca: 17, nagasaki: 27 },
    alexandria: { lisbon: 7, seville: 6, venice: 3, alexandria: 0, calicut: 10, malacca: 15, nagasaki: 25 },
    calicut: { lisbon: 15, seville: 14, venice: 12, alexandria: 10, calicut: 0, malacca: 5, nagasaki: 15 },
    malacca: { lisbon: 20, seville: 19, venice: 17, alexandria: 15, calicut: 5, malacca: 0, nagasaki: 10 },
    nagasaki: { lisbon: 30, seville: 29, venice: 27, alexandria: 25, calicut: 15, malacca: 10, nagasaki: 0 }
};

// Sea routes with waypoints to avoid land
// Each route is defined as an array of waypoints [x, y]
// Ports: Lisbon(39,135), Seville(60,151), Venice(182,55), Alexandria(300,226), Calicut(605,465), Malacca(782,574), Nagasaki(966,207)
const seaRoutes = {
    // From Lisbon
    'lisbon-seville': [[39, 135], [50, 143], [60, 151]],
    'lisbon-venice': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55]],
    'lisbon-alexandria': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55], [250, 150], [300, 226]],
    'lisbon-calicut': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 465]],
    'lisbon-malacca': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [782, 574]],
    'lisbon-nagasaki': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Seville
    'seville-venice': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55]],
    'seville-alexandria': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55], [250, 150], [300, 226]],
    'seville-calicut': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 465]],
    'seville-malacca': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [782, 574]],
    'seville-nagasaki': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Venice
    'venice-alexandria': [[182, 55], [220, 140], [260, 200], [300, 226]],
    'venice-calicut': [[182, 55], [220, 140], [260, 200], [300, 226], [350, 330], [420, 420], [520, 480], [605, 465]],
    'venice-malacca': [[182, 55], [220, 140], [260, 200], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [782, 574]],
    'venice-nagasaki': [[182, 55], [220, 140], [260, 200], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Alexandria
    'alexandria-calicut': [[300, 226], [350, 330], [420, 420], [520, 480], [605, 465]],
    'alexandria-malacca': [[300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [782, 574]],
    'alexandria-nagasaki': [[300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Calicut
    'calicut-malacca': [[605, 465], [605, 540], [695, 590], [782, 574]],
    'calicut-nagasaki': [[605, 465], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Malacca
    'malacca-nagasaki': [[782, 574], [850, 520], [930, 350], [966, 207]]
};

// Get sea route between two ports (with waypoints to avoid land)
function getSeaRoute(fromPortId, toPortId) {
    // Direct route key
    const routeKey = `${fromPortId}-${toPortId}`;
    if (seaRoutes[routeKey]) {
        return seaRoutes[routeKey];
    }

    // Reverse route key
    const reverseRouteKey = `${toPortId}-${fromPortId}`;
    if (seaRoutes[reverseRouteKey]) {
        return [...seaRoutes[reverseRouteKey]].reverse();
    }

    // No predefined route, return direct line
    const fromPort = ports[fromPortId];
    const toPort = ports[toPortId];
    return [[fromPort.x, fromPort.y], [toPort.x, toPort.y]];
}

// Inventory settings by port size (based on historical trade volume)
const inventorySettings = {
    small: { maxStock: 30, refreshRate: 3 },      // 小規模港: 最大30個、1日3個回復 (長崎)
    medium: { maxStock: 60, refreshRate: 5 },     // 中規模港: 最大60個、1日5個回復 (アレクサンドリア、カリカット、マラッカ)
    large: { maxStock: 100, refreshRate: 8 },     // 大規模港: 最大100個、1日8個回復 (リスボン、セビリア)
    very_large: { maxStock: 150, refreshRate: 12 } // 最大規模港: 最大150個、1日12個回復 (ヴェネツィア)
};

// Goods Definitions with base prices
const goods = {
    wine: { name: 'ワイン', emoji: '🍷', basePrice: 50 },
    cloth: { name: '織物', emoji: '🧵', basePrice: 80 },
    spices: { name: '香辛料', emoji: '🌶️', basePrice: 150 },
    silk: { name: '絹', emoji: '🎀', basePrice: 200 },
    gold_ore: { name: '金鉱石', emoji: '🏆', basePrice: 300 },
    porcelain: { name: '陶器', emoji: '🏺', basePrice: 120 },
    tea: { name: '茶', emoji: '🍵', basePrice: 100 },
    silver: { name: '銀', emoji: '💍', basePrice: 250 },
    // Essential supplies (reduced prices for better game balance)
    food: { name: '食糧', emoji: '🍖', basePrice: 2 },
    water: { name: '水', emoji: '💧', basePrice: 1 }
};

// Weather system
const weatherTypes = {
    sunny: {
        name: '晴天',
        emoji: '☀️',
        speedMultiplier: 1.0,
        description: '穏やかな航海日和',
        probability: 0.4
    },
    favorable: {
        name: '順風',
        emoji: '🌬️',
        speedMultiplier: 1.2,
        description: '追い風を受けて快調',
        probability: 0.2
    },
    westerlies: {
        name: '偏西風',
        emoji: '🍃',
        speedMultiplier: 0.9, // Will vary by direction
        description: '強い西風が吹いている',
        probability: 0.15
    },
    rain: {
        name: '雨',
        emoji: '🌧️',
        speedMultiplier: 0.8,
        description: '視界が悪く速度が落ちる',
        probability: 0.15
    },
    storm: {
        name: '嵐',
        emoji: '⛈️',
        speedMultiplier: 0.6,
        description: '激しい嵐で大幅に遅延',
        probability: 0.1
    }
};

// Port-specific price modifiers (multipliers)
const portPrices = {
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.1, silk: 1.9, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4, food: 1.0, water: 1.0 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.9, silk: 1.8, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3, food: 0.9, water: 0.9 },
    venice: { wine: 1.1, cloth: 0.7, spices: 1.6, silk: 1.4, gold_ore: 1.6, porcelain: 1.4, tea: 1.4, silver: 1.5, food: 1.1, water: 1.0 },
    alexandria: { wine: 1.2, cloth: 1.1, spices: 0.9, silk: 1.2, gold_ore: 1.4, porcelain: 1.3, tea: 1.2, silver: 1.4, food: 1.2, water: 1.3 },
    calicut: { wine: 1.5, cloth: 1.3, spices: 0.6, silk: 1.0, gold_ore: 1.3, porcelain: 1.2, tea: 0.9, silver: 1.2, food: 1.0, water: 1.1 },
    malacca: { wine: 1.6, cloth: 1.4, spices: 0.8, silk: 0.9, gold_ore: 1.2, porcelain: 1.0, tea: 0.8, silver: 1.1, food: 1.1, water: 1.2 },
    nagasaki: { wine: 1.8, cloth: 1.5, spices: 1.3, silk: 0.7, gold_ore: 1.5, porcelain: 0.8, tea: 0.7, silver: 0.6, food: 1.3, water: 1.2 }
};

// Ship upgrades
const shipUpgrades = [
    {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        cost: 0,
        crew: 20,
        description: '小型で機動性の高い船'
    },
    {
        name: 'キャラック船',
        capacity: 200,
        speed: 1.2,
        cost: 5000,
        crew: 40,
        description: '大型で積載量が多い船'
    },
    {
        name: 'ガレオン船',
        capacity: 300,
        speed: 1.5,
        cost: 15000,
        crew: 60,
        description: '最大級の貿易船'
    },
    {
        name: '東インド会社船',
        capacity: 500,
        speed: 2,
        cost: 50000,
        crew: 100,
        description: '伝説の大型貿易船'
    }
];

// Inventory Management Functions
function initializePortInventory() {
    for (const portId in ports) {
        portInventory[portId] = {};
        const portSize = ports[portId].size;
        const maxStock = inventorySettings[portSize].maxStock;

        for (const goodId in goods) {
            // All ports now have full supplies of water and food for better game balance
            portInventory[portId][goodId] = maxStock;
        }
    }
}

function refreshPortInventory(daysPassed) {
    for (const portId in portInventory) {
        const portSize = ports[portId].size;
        const refreshRate = inventorySettings[portSize].refreshRate;
        const maxStock = inventorySettings[portSize].maxStock;

        for (const goodId in portInventory[portId]) {
            const recovered = Math.min(
                maxStock,
                portInventory[portId][goodId] + (refreshRate * daysPassed)
            );
            portInventory[portId][goodId] = Math.round(recovered);
        }
    }
}

function getPortStock(portId, goodId) {
    if (!portInventory[portId] || !portInventory[portId][goodId]) {
        return 0;
    }
    return portInventory[portId][goodId];
}

function reducePortStock(portId, goodId, amount) {
    if (!portInventory[portId]) {
        portInventory[portId] = {};
    }
    if (!portInventory[portId][goodId]) {
        portInventory[portId][goodId] = 0;
    }
    portInventory[portId][goodId] = Math.max(0, portInventory[portId][goodId] - amount);
}

// Save & Load Functions
function saveGame() {
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

function loadGame() {
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
        showVoyageModalInProgress(fromPort, toPort, elapsedGameDays, requiredDays);
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
    updateAll();
}

// Rest for one day to replenish port inventory
function restOneDay() {
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
    updateAll();
}

function clearSave() {
    if (confirm('セーブデータを削除して最初からやり直しますか？')) {
        localStorage.removeItem('daikokaiGameSave');
        location.reload();
    }
}

// Helper Functions
function getCurrentPortName() {
    return ports[gameState.currentPort].name;
}

// Calculate profit potential for each good at destination port
function calculateProfitForPort(destinationPortId) {
    const profits = [];
    const currentPort = gameState.currentPort;

    for (const [goodId, good] of Object.entries(goods)) {
        // Skip supplies
        if (goodId === 'food' || goodId === 'water') continue;

        // Calculate buy price at current port
        const buyPrice = Math.round(good.basePrice * portPrices[currentPort][goodId] * 0.95);

        // Calculate sell price at destination port
        const sellPrice = Math.round(good.basePrice * portPrices[destinationPortId][goodId] * 0.95);

        const profitPerUnit = sellPrice - buyPrice;
        const profitMargin = buyPrice > 0 ? (profitPerUnit / buyPrice) * 100 : 0;

        if (profitPerUnit > 0) {
            profits.push({
                goodId,
                good,
                buyPrice,
                sellPrice,
                profitPerUnit,
                profitMargin,
                stock: getPortStock(currentPort, goodId)
            });
        }
    }

    // Sort by profit margin (descending)
    profits.sort((a, b) => b.profitMargin - a.profitMargin);

    return profits;
}

// Get recommended goods to buy for a destination
function getRecommendedGoods(destinationPortId, limit = 3) {
    const profits = calculateProfitForPort(destinationPortId);
    return profits.slice(0, limit);
}

// Check if player can afford to travel to a port
function canAffordVoyage(destinationPortId) {
    const baseDays = portDistances[gameState.currentPort][destinationPortId];
    const travelDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));
    const required = calculateRequiredSupplies(travelDays);

    // Calculate minimum cost for supplies
    const foodPrice = Math.round(goods.food.basePrice * portPrices[gameState.currentPort].food);
    const waterPrice = Math.round(goods.water.basePrice * portPrices[gameState.currentPort].water);

    const currentFood = gameState.inventory.food || 0;
    const currentWater = gameState.inventory.water || 0;

    const needFood = Math.max(0, required.food - currentFood);
    const needWater = Math.max(0, required.water - currentWater);

    const supplyCost = (needFood * foodPrice) + (needWater * waterPrice);

    // Check if player has enough gold and cargo space
    const hasEnoughGold = gameState.gold >= supplyCost;
    const hasEnoughSpace = getCargoSpace() >= (needFood + needWater);

    return {
        canAfford: hasEnoughGold && hasEnoughSpace,
        supplyCost,
        needFood,
        needWater,
        hasEnoughGold,
        hasEnoughSpace
    };
}

// Check if a port is profitable
function isProfitable(destinationPortId) {
    const profits = calculateProfitForPort(destinationPortId);
    return profits.length > 0 && profits[0].profitMargin > 10; // At least 10% profit margin
}

function getCargoUsed() {
    return Object.values(gameState.inventory).reduce((sum, qty) => sum + qty, 0);
}

function getCargoSpace() {
    return gameState.ship.capacity - getCargoUsed();
}

function getPrice(goodId, isBuying = true) {
    const good = goods[goodId];
    const multiplier = portPrices[gameState.currentPort][goodId];
    const basePrice = good.basePrice * multiplier;
    // Add some randomness (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    const price = Math.round(basePrice * randomFactor);
    // Add markup for buying
    return isBuying ? price : Math.round(price * 0.8);
}

function addLog(message) {
    const logDiv = document.getElementById('game-log');
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;

    // Save log to gameState
    gameState.logs.push(message);
    // Keep only last 50 logs to prevent excessive storage
    if (gameState.logs.length > 50) {
        gameState.logs.shift();
    }
}

// Update UI Functions
function updateStatusBar() {
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('ship-name').textContent = gameState.ship.name;
    document.getElementById('crew-count').textContent = gameState.ship.crew;
    document.getElementById('cargo-space').textContent = getCargoUsed();
    document.querySelector('#cargo-space + .stat-unit').textContent = ` / ${gameState.ship.capacity}`;
    document.getElementById('current-port').textContent = getCurrentPortName();

    // Update game time display
    const timeElement = document.getElementById('game-time');
    if (timeElement) {
        timeElement.textContent = gameState.gameTime;
    }
}

function updateInventory() {
    const inventoryDiv = document.getElementById('inventory');
    inventoryDiv.innerHTML = '';

    // Calculate total value and display summary
    let totalValue = 0;
    let totalItems = 0;
    const inventoryItems = [];

    for (const [goodId, qty] of Object.entries(gameState.inventory)) {
        if (qty > 0) {
            const good = goods[goodId];
            const sellPrice = getPrice(goodId, false);
            const itemValue = sellPrice * qty;
            totalValue += itemValue;
            totalItems += qty;
            inventoryItems.push({ goodId, good, qty, sellPrice, itemValue });
        }
    }

    if (inventoryItems.length === 0) {
        inventoryDiv.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">在庫なし</p>';
        return;
    }

    // Add summary section
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = 'grid-column: 1/-1; background: rgba(255, 215, 0, 0.15); padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 2px solid #ffd700;';
    summaryDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="font-weight: bold; color: #1e3c72;">
                📦 積載: ${totalItems}/${gameState.ship.capacity} (${Math.round(totalItems/gameState.ship.capacity*100)}%)
            </div>
            <div style="font-weight: bold; color: #d4af37;">
                💰 売却可能額: ${totalValue.toLocaleString()}G
            </div>
        </div>
    `;
    inventoryDiv.appendChild(summaryDiv);

    // Display each item with details
    for (const item of inventoryItems) {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.innerHTML = `
            <div class="inventory-item-name">${item.good.emoji} ${item.good.name}</div>
            <div class="inventory-item-qty">${item.qty}個</div>
            <div class="inventory-item-value">売値: ${item.sellPrice.toLocaleString()}G/個</div>
            <div class="inventory-item-total">計: ${item.itemValue.toLocaleString()}G</div>
        `;
        inventoryDiv.appendChild(div);
    }
}

function updateTradeGoods() {
    const tradeDiv = document.getElementById('trade-goods');
    tradeDiv.innerHTML = '';

    for (const [goodId, good] of Object.entries(goods)) {
        const buyPrice = getPrice(goodId, true);
        const sellPrice = getPrice(goodId, false);
        const hasItem = gameState.inventory[goodId] > 0;
        const portStock = getPortStock(gameState.currentPort, goodId);
        const outOfStock = portStock <= 0;

        const div = document.createElement('div');
        div.className = 'good-item';
        div.innerHTML = `
            <span class="item-name">${good.emoji} ${good.name}</span>
            <span class="item-price">買: ${buyPrice}G / 売: ${sellPrice}G</span>
            <span style="font-size: 0.85em; color: ${outOfStock ? '#d32f2f' : '#666'};">
                在庫: ${portStock}個
            </span>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button class="btn btn-buy" onclick="buyGood('${goodId}')" ${outOfStock ? 'disabled' : ''}>買う</button>
                <button class="btn btn-buy" onclick="buyAllGood('${goodId}')" ${outOfStock ? 'disabled' : ''}>全部買う</button>
                <button class="btn btn-sell" onclick="sellGood('${goodId}')" ${!hasItem ? 'disabled' : ''}>売る</button>
                <button class="btn btn-sell" onclick="sellAllGood('${goodId}')" ${!hasItem ? 'disabled' : ''}>全部売る</button>
            </div>
        `;
        tradeDiv.appendChild(div);
    }
}

function updatePorts() {
    const portsDiv = document.getElementById('ports');
    portsDiv.innerHTML = '';

    // Add voyage start button if destination is selected
    if (gameState.selectedDestination) {
        const selectedPort = ports[gameState.selectedDestination];
        const travelCost = 0; // No gold cost - supplies are the travel cost
        const baseDays = portDistances[gameState.currentPort][gameState.selectedDestination];
        const travelDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));
        const required = calculateRequiredSupplies(travelDays);
        const suppliesCheck = hasEnoughSupplies(travelDays);
        const recommendedGoods = getRecommendedGoods(gameState.selectedDestination, 3);

        const voyageDiv = document.createElement('div');
        voyageDiv.style.cssText = 'background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #2196f3;';

        let recommendedHTML = '';
        if (recommendedGoods.length > 0) {
            recommendedHTML = `
                <div style="background: rgba(255, 215, 0, 0.1); padding: 10px; border-radius: 5px; margin-top: 10px; border: 1px solid #ffd700;">
                    <div style="font-weight: bold; color: #d4af37; margin-bottom: 5px;">💡 おすすめ商品:</div>
                    ${recommendedGoods.map(item => `
                        <div style="font-size: 0.85em; color: #555; margin-left: 10px;">
                            ${item.good.emoji} ${item.good.name}: 買${item.buyPrice}G → 売${item.sellPrice}G
                            <span style="color: #2e7d32; font-weight: bold;">(+${item.profitPerUnit}G, +${Math.round(item.profitMargin)}%)</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        voyageDiv.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: #1976d2; font-size: 1.1em;">🗺️ 選択中: ${selectedPort.emoji} ${selectedPort.name}</strong>
                <div style="font-size: 0.85em; color: #555; margin-top: 5px;">
                    日数: ${travelDays}日 | 必要物資: 🍖${required.food} 💧${required.water}
                </div>
                ${!suppliesCheck.hasEnough ? `
                    <div style="font-size: 0.85em; color: #d32f2f; margin-top: 5px;">
                        ⚠️ 物資不足: 食糧${suppliesCheck.current.food}/${required.food}、水${suppliesCheck.current.water}/${required.water}
                    </div>
                ` : ''}
                ${recommendedHTML}
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-travel" onclick="startSelectedVoyage()" ${!suppliesCheck.hasEnough ? 'disabled' : ''} style="flex: 1;">
                    ⛵ 航海を開始する
                </button>
                <button class="btn btn-sell" onclick="cancelDestination()" style="flex: 0 0 auto;">
                    キャンセル
                </button>
            </div>
        `;
        portsDiv.appendChild(voyageDiv);
    }

    // Add separator if destination is selected
    if (gameState.selectedDestination) {
        const separator = document.createElement('div');
        separator.style.cssText = 'border-top: 1px solid #ddd; margin: 15px 0; padding-top: 15px;';
        separator.innerHTML = '<div style="font-size: 0.9em; color: #666; margin-bottom: 10px;">他の航海先:</div>';
        portsDiv.appendChild(separator);
    }

    // Collect and filter ports
    const portsList = [];
    for (const [portId, port] of Object.entries(ports)) {
        if (portId === gameState.currentPort) continue;

        const baseDays = portDistances[gameState.currentPort][portId];
        const travelDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));
        const required = calculateRequiredSupplies(travelDays);
        const canAfford = canAffordVoyage(portId);
        const profitable = isProfitable(portId);
        const recommendedGoods = getRecommendedGoods(portId, 3);

        portsList.push({
            portId,
            port,
            travelDays,
            required,
            canAfford,
            profitable,
            recommendedGoods
        });
    }

    // Filter: only show ports that are both reachable and profitable
    const filteredPorts = portsList.filter(p => p.canAfford.canAfford && p.profitable);

    if (filteredPorts.length === 0) {
        const noPortsDiv = document.createElement('div');
        noPortsDiv.style.cssText = 'text-align: center; color: #666; padding: 20px; background: #f5f5f5; border-radius: 8px;';
        noPortsDiv.innerHTML = `
            <div style="font-size: 1.1em; margin-bottom: 10px;">😔 現在、行ける&儲かる港がありません</div>
            <div style="font-size: 0.9em;">資金を貯めるか、現在の港で商品を売却してください</div>
        `;
        portsDiv.appendChild(noPortsDiv);
        return;
    }

    // Sort by profitability (highest profit margin first)
    filteredPorts.sort((a, b) => {
        const aProfitMargin = a.recommendedGoods[0]?.profitMargin || 0;
        const bProfitMargin = b.recommendedGoods[0]?.profitMargin || 0;
        return bProfitMargin - aProfitMargin;
    });

    for (const portData of filteredPorts) {
        const { portId, port, travelDays, required, canAfford, profitable, recommendedGoods } = portData;

        const div = document.createElement('div');
        div.className = 'port-item';

        const isSelected = gameState.selectedDestination === portId;

        // Create recommended goods display
        let recommendedHTML = '';
        if (recommendedGoods.length > 0) {
            const topProfit = recommendedGoods[0];
            recommendedHTML = `
                <div style="background: rgba(46, 125, 50, 0.1); padding: 8px; border-radius: 5px; margin-top: 5px; border-left: 3px solid #2e7d32;">
                    <div style="font-size: 0.85em; color: #2e7d32; font-weight: bold;">
                        💰 最高利益: ${topProfit.good.emoji} ${topProfit.good.name} (+${Math.round(topProfit.profitMargin)}%)
                    </div>
                    ${recommendedGoods.slice(1).map(item => `
                        <div style="font-size: 0.8em; color: #555; margin-left: 10px; margin-top: 2px;">
                            ${item.good.emoji} ${item.good.name} (+${Math.round(item.profitMargin)}%)
                        </div>
                    `).join('')}
                </div>
            `;
        }

        div.innerHTML = `
            <div style="flex: 1;">
                <span class="item-name">${port.emoji} ${port.name}</span>
                <span style="font-size: 0.9em; color: #666; display: block;">${port.description}</span>
                <span style="font-size: 0.85em; color: #666; display: block; margin-top: 5px;">
                    必要物資: 🍖${required.food} 💧${required.water} | 日数: ${travelDays}日
                </span>
                ${recommendedHTML}
            </div>
            <button class="btn btn-travel" onclick="selectDestination('${portId}')" ${isSelected ? 'disabled' : ''}>
                ${isSelected ? '選択中' : '選択'}
            </button>
        `;
        portsDiv.appendChild(div);
    }
}

function updateUpgrades() {
    const upgradesDiv = document.getElementById('upgrades');
    upgradesDiv.innerHTML = '';

    const currentShipIndex = shipUpgrades.findIndex(s => s.name === gameState.ship.name);

    shipUpgrades.forEach((ship, index) => {
        if (index <= currentShipIndex) return;

        const div = document.createElement('div');
        div.className = 'upgrade-item';
        const canAfford = gameState.gold >= ship.cost;

        div.innerHTML = `
            <div>
                <div class="item-name">⛵ ${ship.name}</div>
                <div style="font-size: 0.85em; color: #666; margin-top: 5px;">
                    ${ship.description}<br>
                    積載量: ${ship.capacity} / 速度: ${ship.speed}x / 乗員: ${ship.crew}人
                </div>
            </div>
            <div style="text-align: right;">
                <div class="item-price">${ship.cost}G</div>
                <button class="btn btn-upgrade" onclick="upgradeShip(${index})" ${!canAfford ? 'disabled' : ''}>
                    購入
                </button>
            </div>
        `;
        upgradesDiv.appendChild(div);
    });

    if (currentShipIndex === shipUpgrades.length - 1) {
        upgradesDiv.innerHTML = '<p style="text-align: center; color: #666;">最高級の船を所有しています！</p>';
    }
}

function updateAll() {
    updateStatusBar();
    updateInventory();
    updateTradeGoods();
    updatePorts();
    updateUpgrades();
    updateAutopilotUI();
    saveGame(); // Auto-save after any state change
}

// Game Actions
function buyGood(goodId) {
    const price = getPrice(goodId, true);
    const portStock = getPortStock(gameState.currentPort, goodId);

    if (portStock <= 0) {
        addLog(`❌ ${goods[goodId].name}の在庫がありません！`);
        return;
    }

    if (gameState.gold < price) {
        addLog(`❌ 資金が足りません！(必要: ${price}G)`);
        return;
    }

    if (getCargoSpace() < 1) {
        addLog('❌ 船の積載量が一杯です！');
        return;
    }

    gameState.gold -= price;
    gameState.inventory[goodId] = (gameState.inventory[goodId] || 0) + 1;
    reducePortStock(gameState.currentPort, goodId, 1);

    const good = goods[goodId];
    addLog(`✅ ${good.emoji} ${good.name}を${price}Gで購入しました。(残り在庫: ${getPortStock(gameState.currentPort, goodId)})`);

    updateAll();
}

function buyAllGood(goodId) {
    const price = getPrice(goodId, true);
    const good = goods[goodId];
    const portStock = getPortStock(gameState.currentPort, goodId);

    if (portStock <= 0) {
        addLog(`❌ ${good.name}の在庫がありません！`);
        return;
    }

    // Calculate how many we can buy based on money
    const maxByMoney = Math.floor(gameState.gold / price);

    // Calculate how many we can buy based on cargo space
    const maxByCargo = getCargoSpace();

    // Calculate how many we can buy based on port stock
    const maxByStock = portStock;

    // Take the minimum of all constraints
    const maxCanBuy = Math.min(maxByMoney, maxByCargo, maxByStock);

    if (maxCanBuy < 1) {
        if (gameState.gold < price) {
            addLog(`❌ 資金が足りません！(必要: ${price}G)`);
        } else {
            addLog('❌ 船の積載量が一杯です！');
        }
        return;
    }

    const totalCost = maxCanBuy * price;
    gameState.gold -= totalCost;
    gameState.inventory[goodId] = (gameState.inventory[goodId] || 0) + maxCanBuy;
    reducePortStock(gameState.currentPort, goodId, maxCanBuy);

    addLog(`✅ ${good.emoji} ${good.name}を${maxCanBuy}個、合計${totalCost}Gで購入しました。(残り在庫: ${getPortStock(gameState.currentPort, goodId)})`);

    updateAll();
}

function sellGood(goodId) {
    if (!gameState.inventory[goodId] || gameState.inventory[goodId] < 1) {
        addLog('❌ その商品を持っていません！');
        return;
    }

    const price = getPrice(goodId, false);
    gameState.gold += price;
    gameState.inventory[goodId] -= 1;

    const good = goods[goodId];
    addLog(`💰 ${good.emoji} ${good.name}を${price}Gで売却しました。`);

    // Add animation to gold
    const goldElement = document.getElementById('gold');
    goldElement.classList.add('gold-animation');
    setTimeout(() => goldElement.classList.remove('gold-animation'), 500);

    updateAll();
}

function sellAllGood(goodId) {
    if (!gameState.inventory[goodId] || gameState.inventory[goodId] < 1) {
        addLog('❌ その商品を持っていません！');
        return;
    }

    const price = getPrice(goodId, false);
    const quantity = gameState.inventory[goodId];
    const totalRevenue = quantity * price;

    gameState.gold += totalRevenue;
    gameState.inventory[goodId] = 0;

    const good = goods[goodId];
    addLog(`💰 ${good.emoji} ${good.name}を${quantity}個、合計${totalRevenue}Gで売却しました。`);

    // Add animation to gold
    const goldElement = document.getElementById('gold');
    goldElement.classList.add('gold-animation');
    setTimeout(() => goldElement.classList.remove('gold-animation'), 500);

    updateAll();
}

// Weather and Voyage Functions
function getRandomWeather() {
    const rand = Math.random();
    let cumulative = 0;

    for (const [key, weather] of Object.entries(weatherTypes)) {
        cumulative += weather.probability;
        if (rand <= cumulative) {
            return { id: key, ...weather };
        }
    }
    return { id: 'sunny', ...weatherTypes.sunny };
}

function calculateRequiredSupplies(days) {
    const crew = gameState.ship.crew;
    return {
        food: Math.ceil(crew * days * 0.07), // 0.07 units per crew per day (balanced for better early game progression)
        water: Math.ceil(crew * days * 0.07)
    };
}

function hasEnoughSupplies(days) {
    const required = calculateRequiredSupplies(days);
    const food = gameState.inventory.food || 0;
    const water = gameState.inventory.water || 0;
    return {
        hasEnough: food >= required.food && water >= required.water,
        required,
        current: { food, water }
    };
}

function consumeSupplies(days) {
    const required = calculateRequiredSupplies(days);
    gameState.inventory.food = Math.max(0, (gameState.inventory.food || 0) - required.food);
    gameState.inventory.water = Math.max(0, (gameState.inventory.water || 0) - required.water);
}

// Automatically buy supplies without logging (used for auto-supply)
function buySupply(goodId, amount) {
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
function autoSupplyForVoyage(days) {
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

function startVoyage(destinationPortId) {
    // No gold cost for travel - supplies are the travel cost
    const travelCost = 0;

    // Calculate base travel time
    const baseDays = portDistances[gameState.currentPort][destinationPortId];
    const estimatedDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));

    // Check supplies
    const suppliesCheck = hasEnoughSupplies(estimatedDays);
    if (!suppliesCheck.hasEnough) {
        addLog(`❌ 物資が不足しています！`);
        addLog(`必要: 食糧${suppliesCheck.required.food}個、水${suppliesCheck.required.water}個`);
        addLog(`現在: 食糧${suppliesCheck.current.food}個、水${suppliesCheck.current.water}個`);
        return;
    }

    // Set voyage state with real-time tracking
    gameState.isVoyaging = true;
    gameState.voyageStartTime = Date.now();
    gameState.voyageStartPort = gameState.currentPort;
    gameState.voyageDestinationPort = destinationPortId;
    gameState.voyageEstimatedDays = estimatedDays;
    gameState.voyageActualDays = estimatedDays; // Will be updated by weather
    gameState.voyageWeatherHistory = [];

    const oldPort = ports[gameState.currentPort].name;
    const newPort = ports[destinationPortId].name;

    addLog(`⛵ ${newPort}に向けて出港します！`);

    // Save immediately to persist voyage state
    saveGame();

    // Show voyage modal
    showVoyageModal(oldPort, newPort, destinationPortId, estimatedDays);
}

function showVoyageModal(fromPort, toPort, destinationPortId, estimatedDays) {
    // Remove any existing modal first (in case of reload)
    const existingModal = document.getElementById('voyage-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Get port IDs from names
    const fromPortId = gameState.voyageStartPort;
    const toPortId = destinationPortId;

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'voyage-modal';
    modal.className = 'voyage-modal';
    modal.innerHTML = `
        <div class="voyage-content">
            <h2>⛵ 航海中 ⛵</h2>
            <div class="voyage-route">
                <div>${fromPort}</div>
                <div class="voyage-arrow">→</div>
                <div>${toPort}</div>
            </div>
            <div class="voyage-info">
                <div class="voyage-stat">
                    <span class="stat-label">経過日数:</span>
                    <span id="voyage-days-elapsed" class="stat-value">0</span>
                    <span class="stat-unit">/ 予定 ${estimatedDays}日</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">現在の天候:</span>
                    <span id="voyage-weather" class="stat-value">☀️ 晴天</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">速度:</span>
                    <span id="voyage-speed" class="stat-value">100%</span>
                </div>
            </div>
            <div class="voyage-animation">
                <svg id="voyage-map" class="voyage-map" viewBox="0 0 1000 600">
                    <!-- Ocean background -->
                    <rect width="1000" height="600" fill="#1e3a5f"/>
                    <!-- High resolution realistic world map image -->
                    <!-- Using Natural Earth II with Shaded Relief from Wikimedia Commons -->
                    <image id="world-map-image" x="0" y="0" width="1000" height="600"
                           href="https://upload.wikimedia.org/wikipedia/commons/9/97/Natural_Earth_II_flat_world_map_with_shaded_relief.jpg"
                           preserveAspectRatio="none"
                           crossorigin="anonymous"
                           onload="console.log('World map loaded successfully')"
                           onerror="console.warn('Failed to load world map image, using fallback');this.style.display='none';document.getElementById('landmasses').style.display='block'"/>
                    <!-- Fallback: Low resolution landmasses (shown if image fails to load) -->
                    <g id="landmasses" style="display: none;">
                        <!-- Iberian Peninsula (Spain & Portugal) - リスボン(39,135)とセビリア(60,151) -->
                        <path d="M 20 120 L 30 100 L 45 95 L 60 100 L 75 115 L 85 135 L 90 155 L 85 175 L 70 190 L 50 195 L 30 185 L 20 165 L 15 145 L 18 125 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- France -->
                        <path d="M 75 90 L 95 75 L 115 70 L 135 75 L 150 90 L 155 110 L 150 130 L 140 150 L 125 165 L 110 170 L 95 165 L 85 150 L 80 130 L 75 110 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- Italy - ヴェネツィア(182,55) -->
                        <path d="M 155 35 L 165 25 L 175 20 L 185 22 L 195 30 L 200 45 L 202 65 L 200 85 L 195 105 L 188 120 L 180 130 L 172 135 L 165 130 L 160 115 L 157 95 L 155 75 L 155 55 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- Greece and Balkans -->
                        <path d="M 200 70 L 215 65 L 230 70 L 240 85 L 245 105 L 240 125 L 230 140 L 215 145 L 200 140 L 192 125 L 190 105 L 195 85 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- North Africa (Morocco to Libya) -->
                        <path d="M 0 180 L 40 190 L 80 200 L 120 210 L 160 220 L 200 230 L 240 235 L 280 240 L 320 245 L 340 265 L 350 290 L 345 320 L 335 350 L 320 375 L 300 395 L 275 410 L 240 420 L 200 425 L 160 420 L 120 405 L 85 385 L 55 360 L 30 330 L 15 300 L 5 270 L 0 240 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- Egypt and Red Sea coast - アレクサンドリア(300,226) -->
                        <path d="M 280 200 L 295 195 L 310 200 L 320 215 L 325 235 L 330 260 L 328 285 L 320 305 L 310 320 L 295 325 L 280 320 L 272 305 L 268 285 L 268 260 L 272 235 L 278 215 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- Arabian Peninsula -->
                        <path d="M 330 240 L 350 235 L 370 240 L 390 255 L 405 280 L 410 310 L 405 340 L 395 365 L 380 385 L 360 400 L 340 410 L 325 410 L 315 395 L 310 375 L 308 350 L 310 325 L 315 300 L 320 275 L 325 255 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- India - カリカット(605,465) -->
                        <path d="M 560 350 L 585 340 L 610 345 L 630 360 L 645 385 L 650 415 L 650 445 L 645 475 L 630 500 L 610 520 L 585 530 L 565 530 L 550 515 L 540 490 L 538 460 L 540 430 L 545 400 L 552 375 Z" fill="#c9a882" stroke="#a98862" stroke-width="1"/>

                        <!-- Sri Lanka -->
                        <ellipse cx="620" cy="535" rx="10" ry="15" fill="#c9a882" stroke="#a98862" stroke-width="1"/>

                        <!-- Southeast Asia (Indochina and Malay Peninsula) - マラッカ(782,574) -->
                        <path d="M 660 400 L 685 390 L 710 395 L 730 410 L 745 435 L 755 465 L 760 495 L 765 525 L 768 555 L 770 585 L 765 600 L 750 600 L 735 595 L 720 580 L 710 560 L 705 535 L 700 505 L 695 475 L 690 445 L 682 420 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- Sumatra and Java -->
                        <path d="M 700 560 L 725 565 L 750 570 L 775 580 L 795 590 L 810 600 L 820 600 L 825 590 L 820 575 L 810 565 L 795 560 L 775 558 L 750 557 L 725 558 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- Borneo -->
                        <path d="M 795 510 L 815 505 L 835 512 L 845 528 L 848 545 L 843 560 L 828 568 L 810 565 L 797 555 L 792 540 L 793 525 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- China mainland -->
                        <path d="M 700 140 L 740 120 L 780 110 L 820 115 L 860 130 L 890 155 L 910 185 L 920 220 L 925 260 L 920 295 L 905 325 L 880 348 L 845 365 L 805 375 L 765 378 L 730 370 L 700 355 L 678 335 L 665 310 L 658 280 L 656 245 L 660 210 L 670 175 Z" fill="#a89878" stroke="#887858" stroke-width="1"/>

                        <!-- Korea -->
                        <path d="M 900 170 L 915 160 L 930 165 L 940 180 L 945 200 L 940 220 L 930 235 L 915 240 L 900 235 L 892 220 L 890 200 L 895 185 Z" fill="#a89878" stroke="#887858" stroke-width="1"/>

                        <!-- Japan - 長崎(966,207) -->
                        <path d="M 930 180 L 950 170 L 970 175 L 985 190 L 995 210 L 998 230 L 995 250 L 985 270 L 970 285 L 950 290 L 935 285 L 925 270 L 922 250 L 925 230 L 928 210 L 930 195 Z" fill="#b8a888" stroke="#988868" stroke-width="1"/>
                        <ellipse cx="955" cy="235" rx="15" ry="20" fill="#b8a888" stroke="#988868" stroke-width="1"/>
                    </g>
                    <!-- Route line -->
                    <polyline id="voyage-route-line" stroke="#4a9eff" stroke-width="2" stroke-dasharray="5,5" opacity="0.6" fill="none"/>
                    <!-- Ports will be added here -->
                    <g id="voyage-ports"></g>
                    <!-- Ship icon -->
                    <text id="voyage-ship-icon" class="voyage-ship-icon" font-size="32" text-anchor="middle" dominant-baseline="middle">🚢</text>
                </svg>
                <div id="voyage-weather-effect" class="weather-effect"></div>
            </div>
            <div id="voyage-log" class="voyage-log"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // Initialize map with ports and route
    initializeVoyageMap(fromPortId, toPortId);

    // Start voyage simulation
    simulateVoyage(destinationPortId, estimatedDays);
}

// Show voyage modal for an in-progress voyage (when returning to game)
function showVoyageModalInProgress(fromPort, toPort, currentDaysElapsed, totalDays) {
    // Remove any existing modal first (in case of reload)
    const existingModal = document.getElementById('voyage-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Get port IDs from game state
    const fromPortId = gameState.voyageStartPort;
    const toPortId = gameState.voyageDestinationPort;

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'voyage-modal';
    modal.className = 'voyage-modal';
    modal.innerHTML = `
        <div class="voyage-content">
            <h2>⛵ 航海中 ⛵</h2>
            <div class="voyage-route">
                <div>${fromPort}</div>
                <div class="voyage-arrow">→</div>
                <div>${toPort}</div>
            </div>
            <div class="voyage-info">
                <div class="voyage-stat">
                    <span class="stat-label">経過日数:</span>
                    <span id="voyage-days-elapsed" class="stat-value">${currentDaysElapsed}</span>
                    <span class="stat-unit">/ 予定 ${totalDays}日</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">現在の天候:</span>
                    <span id="voyage-weather" class="stat-value">☀️ 晴天</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">速度:</span>
                    <span id="voyage-speed" class="stat-value">100%</span>
                </div>
            </div>
            <div class="voyage-animation">
                <svg id="voyage-map" class="voyage-map" viewBox="0 0 1000 600">
                    <!-- Ocean background -->
                    <rect width="1000" height="600" fill="#1e3a5f"/>
                    <!-- High resolution realistic world map image -->
                    <!-- Using Natural Earth II with Shaded Relief from Wikimedia Commons -->
                    <image id="world-map-image" x="0" y="0" width="1000" height="600"
                           href="https://upload.wikimedia.org/wikipedia/commons/9/97/Natural_Earth_II_flat_world_map_with_shaded_relief.jpg"
                           preserveAspectRatio="none"
                           crossorigin="anonymous"
                           onload="console.log('World map loaded successfully')"
                           onerror="console.warn('Failed to load world map image, using fallback');this.style.display='none';document.getElementById('landmasses').style.display='block'"/>
                    <!-- Fallback: Low resolution landmasses (shown if image fails to load) -->
                    <g id="landmasses" style="display: none;">
                        <!-- Iberian Peninsula (Spain & Portugal) - リスボン(39,135)とセビリア(60,151) -->
                        <path d="M 20 120 L 30 100 L 45 95 L 60 100 L 75 115 L 85 135 L 90 155 L 85 175 L 70 190 L 50 195 L 30 185 L 20 165 L 15 145 L 18 125 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- France -->
                        <path d="M 75 90 L 95 75 L 115 70 L 135 75 L 150 90 L 155 110 L 150 130 L 140 150 L 125 165 L 110 170 L 95 165 L 85 150 L 80 130 L 75 110 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- Italy - ヴェネツィア(182,55) -->
                        <path d="M 155 35 L 165 25 L 175 20 L 185 22 L 195 30 L 200 45 L 202 65 L 200 85 L 195 105 L 188 120 L 180 130 L 172 135 L 165 130 L 160 115 L 157 95 L 155 75 L 155 55 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- Greece and Balkans -->
                        <path d="M 200 70 L 215 65 L 230 70 L 240 85 L 245 105 L 240 125 L 230 140 L 215 145 L 200 140 L 192 125 L 190 105 L 195 85 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- North Africa (Morocco to Libya) -->
                        <path d="M 0 180 L 40 190 L 80 200 L 120 210 L 160 220 L 200 230 L 240 235 L 280 240 L 320 245 L 340 265 L 350 290 L 345 320 L 335 350 L 320 375 L 300 395 L 275 410 L 240 420 L 200 425 L 160 420 L 120 405 L 85 385 L 55 360 L 30 330 L 15 300 L 5 270 L 0 240 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- Egypt and Red Sea coast - アレクサンドリア(300,226) -->
                        <path d="M 280 200 L 295 195 L 310 200 L 320 215 L 325 235 L 330 260 L 328 285 L 320 305 L 310 320 L 295 325 L 280 320 L 272 305 L 268 285 L 268 260 L 272 235 L 278 215 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- Arabian Peninsula -->
                        <path d="M 330 240 L 350 235 L 370 240 L 390 255 L 405 280 L 410 310 L 405 340 L 395 365 L 380 385 L 360 400 L 340 410 L 325 410 L 315 395 L 310 375 L 308 350 L 310 325 L 315 300 L 320 275 L 325 255 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- India - カリカット(605,465) -->
                        <path d="M 560 350 L 585 340 L 610 345 L 630 360 L 645 385 L 650 415 L 650 445 L 645 475 L 630 500 L 610 520 L 585 530 L 565 530 L 550 515 L 540 490 L 538 460 L 540 430 L 545 400 L 552 375 Z" fill="#c9a882" stroke="#a98862" stroke-width="1"/>

                        <!-- Sri Lanka -->
                        <ellipse cx="620" cy="535" rx="10" ry="15" fill="#c9a882" stroke="#a98862" stroke-width="1"/>

                        <!-- Southeast Asia (Indochina and Malay Peninsula) - マラッカ(782,574) -->
                        <path d="M 660 400 L 685 390 L 710 395 L 730 410 L 745 435 L 755 465 L 760 495 L 765 525 L 768 555 L 770 585 L 765 600 L 750 600 L 735 595 L 720 580 L 710 560 L 705 535 L 700 505 L 695 475 L 690 445 L 682 420 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- Sumatra and Java -->
                        <path d="M 700 560 L 725 565 L 750 570 L 775 580 L 795 590 L 810 600 L 820 600 L 825 590 L 820 575 L 810 565 L 795 560 L 775 558 L 750 557 L 725 558 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- Borneo -->
                        <path d="M 795 510 L 815 505 L 835 512 L 845 528 L 848 545 L 843 560 L 828 568 L 810 565 L 797 555 L 792 540 L 793 525 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- China mainland -->
                        <path d="M 700 140 L 740 120 L 780 110 L 820 115 L 860 130 L 890 155 L 910 185 L 920 220 L 925 260 L 920 295 L 905 325 L 880 348 L 845 365 L 805 375 L 765 378 L 730 370 L 700 355 L 678 335 L 665 310 L 658 280 L 656 245 L 660 210 L 670 175 Z" fill="#a89878" stroke="#887858" stroke-width="1"/>

                        <!-- Korea -->
                        <path d="M 900 170 L 915 160 L 930 165 L 940 180 L 945 200 L 940 220 L 930 235 L 915 240 L 900 235 L 892 220 L 890 200 L 895 185 Z" fill="#a89878" stroke="#887858" stroke-width="1"/>

                        <!-- Japan - 長崎(966,207) -->
                        <path d="M 930 180 L 950 170 L 970 175 L 985 190 L 995 210 L 998 230 L 995 250 L 985 270 L 970 285 L 950 290 L 935 285 L 925 270 L 922 250 L 925 230 L 928 210 L 930 195 Z" fill="#b8a888" stroke="#988868" stroke-width="1"/>
                        <ellipse cx="955" cy="235" rx="15" ry="20" fill="#b8a888" stroke="#988868" stroke-width="1"/>
                    </g>
                    <!-- Route line -->
                    <polyline id="voyage-route-line" stroke="#4a9eff" stroke-width="2" stroke-dasharray="5,5" opacity="0.6" fill="none"/>
                    <!-- Ports will be added here -->
                    <g id="voyage-ports"></g>
                    <!-- Ship icon -->
                    <text id="voyage-ship-icon" class="voyage-ship-icon" font-size="32" text-anchor="middle" dominant-baseline="middle">🚢</text>
                </svg>
                <div id="voyage-weather-effect" class="weather-effect"></div>
            </div>
            <div id="voyage-log" class="voyage-log"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // Initialize map with ports and route
    initializeVoyageMap(fromPortId, toPortId);

    const voyageLog = document.getElementById('voyage-log');
    const addVoyageLog = (message) => {
        const p = document.createElement('p');
        p.textContent = message;
        voyageLog.appendChild(p);
        voyageLog.scrollTop = voyageLog.scrollHeight;
    };

    // Show resume message
    addVoyageLog(`🌊 航海を再開しました（${currentDaysElapsed}日経過）`);

    // Replay weather history
    for (const weatherEvent of gameState.voyageWeatherHistory) {
        if (weatherEvent.day <= currentDaysElapsed) {
            addVoyageLog(`${weatherEvent.emoji} ${weatherEvent.name}`);
        }
    }

    // Continue voyage simulation
    simulateVoyage(gameState.voyageDestinationPort, gameState.voyageEstimatedDays);
}

// Initialize the voyage map with ports, route, and viewport
function initializeVoyageMap(fromPortId, toPortId) {
    const fromPort = ports[fromPortId];
    const toPort = ports[toPortId];

    // Get the sea route with waypoints
    const route = getSeaRoute(fromPortId, toPortId);

    // Calculate viewport bounds with padding (considering all waypoints)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of route) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    const padding = 100;
    const viewBoxX = Math.max(0, minX - padding);
    const viewBoxY = Math.max(0, minY - padding);
    const viewBoxWidth = Math.min(1000, (maxX - minX) + padding * 2);
    const viewBoxHeight = Math.min(600, (maxY - minY) + padding * 2);

    // Update SVG viewBox to focus on the route
    const svg = document.getElementById('voyage-map');
    svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);

    // Draw route line as a polyline through waypoints
    const routeLine = document.getElementById('voyage-route-line');
    const pointsString = route.map(([x, y]) => `${x},${y}`).join(' ');
    routeLine.setAttribute('points', pointsString);

    // Add port markers
    const portsGroup = document.getElementById('voyage-ports');

    // Start port (green)
    const startPortGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startCircle.setAttribute('cx', fromPort.x);
    startCircle.setAttribute('cy', fromPort.y);
    startCircle.setAttribute('r', '8');
    startCircle.setAttribute('fill', '#4ade80');
    startCircle.setAttribute('stroke', '#fff');
    startCircle.setAttribute('stroke-width', '2');
    const startLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    startLabel.setAttribute('x', fromPort.x);
    startLabel.setAttribute('y', fromPort.y - 15);
    startLabel.setAttribute('text-anchor', 'middle');
    startLabel.setAttribute('fill', '#fff');
    startLabel.setAttribute('font-size', '14');
    startLabel.setAttribute('font-weight', 'bold');
    startLabel.textContent = fromPort.name;
    startPortGroup.appendChild(startCircle);
    startPortGroup.appendChild(startLabel);

    // Destination port (red)
    const destPortGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const destCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    destCircle.setAttribute('cx', toPort.x);
    destCircle.setAttribute('cy', toPort.y);
    destCircle.setAttribute('r', '8');
    destCircle.setAttribute('fill', '#f87171');
    destCircle.setAttribute('stroke', '#fff');
    destCircle.setAttribute('stroke-width', '2');
    const destLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    destLabel.setAttribute('x', toPort.x);
    destLabel.setAttribute('y', toPort.y - 15);
    destLabel.setAttribute('text-anchor', 'middle');
    destLabel.setAttribute('fill', '#fff');
    destLabel.setAttribute('font-size', '14');
    destLabel.setAttribute('font-weight', 'bold');
    destLabel.textContent = toPort.name;
    destPortGroup.appendChild(destCircle);
    destPortGroup.appendChild(destLabel);

    portsGroup.appendChild(startPortGroup);
    portsGroup.appendChild(destPortGroup);

    // Initialize ship at start position
    const shipIcon = document.getElementById('voyage-ship-icon');
    shipIcon.setAttribute('x', route[0][0]);
    shipIcon.setAttribute('y', route[0][1]);
}

// Update ship position based on voyage progress
function updateShipPosition(progress) {
    const fromPortId = gameState.voyageStartPort;
    const toPortId = gameState.voyageDestinationPort;

    // Get the sea route with waypoints
    const route = getSeaRoute(fromPortId, toPortId);

    // Calculate total route length
    let totalLength = 0;
    const segmentLengths = [];
    for (let i = 0; i < route.length - 1; i++) {
        const [x1, y1] = route[i];
        const [x2, y2] = route[i + 1];
        const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        segmentLengths.push(segmentLength);
        totalLength += segmentLength;
    }

    // Find the current position along the route based on progress
    const targetDistance = progress * totalLength;
    let accumulatedDistance = 0;
    let x = route[0][0];
    let y = route[0][1];

    for (let i = 0; i < route.length - 1; i++) {
        const segmentLength = segmentLengths[i];
        if (accumulatedDistance + segmentLength >= targetDistance) {
            // The ship is in this segment
            const segmentProgress = (targetDistance - accumulatedDistance) / segmentLength;
            const [x1, y1] = route[i];
            const [x2, y2] = route[i + 1];
            x = x1 + (x2 - x1) * segmentProgress;
            y = y1 + (y2 - y1) * segmentProgress;
            break;
        }
        accumulatedDistance += segmentLength;
    }

    const shipIcon = document.getElementById('voyage-ship-icon');
    if (shipIcon) {
        shipIcon.setAttribute('x', x);
        shipIcon.setAttribute('y', y);
    }
}

function simulateVoyage(destinationPortId, estimatedDays) {
    const TIME_PER_DAY = 15000; // 15 seconds per game day
    let currentWeather = getRandomWeather();
    let lastWeatherChangeDay = 0;

    const voyageLog = document.getElementById('voyage-log');
    const addVoyageLog = (message) => {
        const p = document.createElement('p');
        p.textContent = message;
        voyageLog.appendChild(p);
        voyageLog.scrollTop = voyageLog.scrollHeight;
    };

    addVoyageLog(`🌊 ${ports[gameState.voyageStartPort].name}を出港しました`);
    addVoyageLog(`${currentWeather.emoji} ${currentWeather.name}: ${currentWeather.description}`);

    // Store initial weather
    gameState.voyageWeatherHistory.push({
        day: 0,
        weather: currentWeather.id,
        emoji: currentWeather.emoji,
        name: currentWeather.name
    });

    // Update UI based on real-time elapsed
    const updateVoyageUI = () => {
        const now = Date.now();
        const elapsedRealTime = now - gameState.voyageStartTime;
        const daysElapsedExact = elapsedRealTime / TIME_PER_DAY; // Exact days with decimals for smooth animation
        const daysElapsed = Math.floor(daysElapsedExact); // Integer days for display and weather changes
        const actualDaysNeeded = gameState.voyageActualDays;

        // Random weather change (20% chance per day)
        if (daysElapsed > lastWeatherChangeDay && Math.random() < 0.2) {
            lastWeatherChangeDay = daysElapsed;
            currentWeather = getRandomWeather();
            addVoyageLog(`${currentWeather.emoji} 天候が変化: ${currentWeather.name}`);

            // Store weather change
            gameState.voyageWeatherHistory.push({
                day: daysElapsed,
                weather: currentWeather.id,
                emoji: currentWeather.emoji,
                name: currentWeather.name
            });

            // Adjust estimated arrival based on weather
            if (currentWeather.speedMultiplier < 1.0) {
                const delay = Math.random() < 0.3 ? 1 : 0;
                if (delay > 0) {
                    gameState.voyageActualDays += delay;
                    addVoyageLog(`⚠️ ${currentWeather.name}の影響で到着が遅れています`);
                    saveGame(); // Save updated voyage state
                }
            }
        }

        // Update UI
        document.getElementById('voyage-days-elapsed').textContent = daysElapsed;
        document.getElementById('voyage-weather').textContent = `${currentWeather.emoji} ${currentWeather.name}`;
        document.getElementById('voyage-speed').textContent = `${Math.round(currentWeather.speedMultiplier * 100)}%`;

        // Update weather effect
        const weatherEffect = document.getElementById('voyage-weather-effect');
        if (weatherEffect) {
            weatherEffect.className = 'weather-effect ' + currentWeather.id;
        }

        // Update ship position on map using exact days for smooth animation
        const progress = Math.min(1.0, daysElapsedExact / actualDaysNeeded);
        updateShipPosition(progress);

        // Check if voyage is complete
        if (daysElapsed >= actualDaysNeeded) {
            completeVoyage(destinationPortId, actualDaysNeeded);
            return; // Stop updating
        }

        // Continue updating
        requestAnimationFrame(updateVoyageUI);
    };

    // Start updating UI
    requestAnimationFrame(updateVoyageUI);
}

function completeVoyage(destinationPortId, actualDays) {
    // Advance time
    gameState.gameTime += actualDays;

    // Consume supplies
    consumeSupplies(actualDays);

    // Change port
    const oldPort = ports[gameState.voyageStartPort || gameState.currentPort].name;
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

    // Close modal
    setTimeout(() => {
        const modal = document.getElementById('voyage-modal');
        if (modal) {
            modal.remove();
        }
        updateAll();
    }, 2000);
}

// Select destination and auto-supply, but don't start voyage yet
function selectDestination(portId) {
    if (gameState.isVoyaging) {
        return; // Prevent selection during voyage
    }

    // Calculate required supplies
    const baseDays = portDistances[gameState.currentPort][portId];
    const estimatedDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));
    const required = calculateRequiredSupplies(estimatedDays);

    // Calculate supply space requirements for warning
    const supplySpace = required.food + required.water;
    const supplyPercentage = (supplySpace / gameState.ship.capacity) * 100;

    // Auto-supply food and water
    const supplyResult = autoSupplyForVoyage(estimatedDays);

    // Set selected destination
    gameState.selectedDestination = portId;

    if (supplyResult.success && !supplyResult.alreadyEnough) {
        addLog(`⚓ ${ports[portId].name}への航海に必要な物資を補給しました`);
        if (supplyResult.boughtFood > 0) {
            addLog(`  食糧: ${supplyResult.boughtFood}個を補給`);
        }
        if (supplyResult.boughtWater > 0) {
            addLog(`  水: ${supplyResult.boughtWater}個を補給`);
        }

        // Warning for high supply percentage
        if (supplyPercentage > 75) {
            addLog(`⚠️ この航海は物資が積載量の${Math.round(supplyPercentage)}%を占めます`);
            addLog(`💡 より大きな船へのアップグレード、または中継港経由をお勧めします`);
        } else if (supplyPercentage > 55) {
            addLog(`📊 この航海の物資負担: ${Math.round(supplyPercentage)}%`);
        }

        addLog(`💼 商品を積んだら「航海を開始する」ボタンで出発してください`);
    } else if (supplyResult.success && supplyResult.alreadyEnough) {
        addLog(`⚓ ${ports[portId].name}を航海先に選択しました`);

        // Warning for high supply percentage
        if (supplyPercentage > 75) {
            addLog(`⚠️ この航海は物資が積載量の${Math.round(supplyPercentage)}%を占めます`);
            addLog(`💡 より大きな船へのアップグレード、または中継港経由をお勧めします`);
        } else if (supplyPercentage > 55) {
            addLog(`📊 この航海の物資負担: ${Math.round(supplyPercentage)}%`);
        }

        addLog(`💼 商品を積んだら「航海を開始する」ボタンで出発してください`);
    } else {
        // Could not supply enough
        addLog(`⚠️ ${ports[portId].name}への航海に必要な物資を十分に補給できませんでした`);
        if (supplyResult.boughtFood > 0 || supplyResult.boughtWater > 0) {
            addLog(`  補給した: 食糧${supplyResult.boughtFood}個、水${supplyResult.boughtWater}個`);
        }
        addLog(`  まだ不足: 食糧${supplyResult.required.food - supplyResult.current.food}個、水${supplyResult.required.water - supplyResult.current.water}個`);
        addLog(`💡 資金、積載量、または港の在庫を確認してください`);
    }

    updateAll();
}

// Start voyage to selected destination
function startSelectedVoyage() {
    if (!gameState.selectedDestination) {
        addLog('❌ 航海先が選択されていません');
        return;
    }

    const destinationPortId = gameState.selectedDestination;

    // Clear selection
    gameState.selectedDestination = null;

    // Start the voyage (this will check supplies again)
    startVoyage(destinationPortId);
}

// Cancel selected destination
function cancelDestination() {
    if (gameState.selectedDestination) {
        addLog(`🚫 ${ports[gameState.selectedDestination].name}への航海を取り消しました`);
        gameState.selectedDestination = null;
        updateAll();
    }
}

function travelTo(portId) {
    if (gameState.isVoyaging) {
        return; // Prevent travel during voyage
    }
    startVoyage(portId);
}

function upgradeShip(shipIndex) {
    const newShip = shipUpgrades[shipIndex];

    if (gameState.gold < newShip.cost) {
        addLog(`❌ 資金が足りません！(必要: ${newShip.cost}G)`);
        return;
    }

    // Check if cargo exceeds new capacity
    if (getCargoUsed() > newShip.capacity) {
        addLog('❌ 現在の積荷が多すぎて、この船に乗り換えられません！');
        return;
    }

    gameState.gold -= newShip.cost;
    gameState.ship = { ...newShip };

    addLog(`⚓ ${newShip.name}にアップグレードしました！`);
    addLog(`📦 新しい積載量: ${newShip.capacity} / 速度: ${newShip.speed}x`);

    updateAll();
}

// ====== Autopilot Functions ======

// Start autopilot mode
function startAutopilot(durationHours) {
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

    // Start autopilot loop
    runAutopilotCycle();
}

// Stop autopilot mode
function stopAutopilot() {
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
    const report = generateAutopilotReport();
    showAutopilotReport(report);

    saveGame();
    updateAll();
}

// Check if autopilot should stop
function checkAutopilotTimeout() {
    if (!gameState.autopilotActive) {
        return false;
    }
    
    const elapsed = Date.now() - gameState.autopilotStartTime;
    const elapsedMinutes = elapsed / 60000;
    
    if (elapsedMinutes >= gameState.autopilotDurationMinutes) {
        stopAutopilot();
        return true;
    }
    
    return false;
}

// Run a single autopilot cycle
function runAutopilotCycle() {
    if (!gameState.autopilotActive) {
        return;
    }

    // Check timeout
    if (checkAutopilotTimeout()) {
        return;
    }

    // If currently voyaging, check progress
    if (gameState.isVoyaging) {
        setTimeout(() => runAutopilotCycle(), 1000);
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
function executeAutopilotDecision() {
    // Track if any action was taken this cycle
    let actionTaken = false;

    // Find the most profitable trade route
    const bestTrade = findBestTrade();

    if (bestTrade) {
        // If we have goods to sell, sell them first
        const hasGoodsToSell = Object.keys(gameState.inventory).some(goodId => {
            return gameState.inventory[goodId] > 0 && goodId !== 'food' && goodId !== 'water';
        });

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
        } else if (bestTrade.action === 'buy') {
            // Buy goods at current port
            const goodId = bestTrade.goodId;
            const destinationPortId = bestTrade.destinationPort;
            const buyPrice = getPrice(goodId, true);
            const portStock = getPortStock(gameState.currentPort, goodId);
            const cargoSpace = getCargoSpace();

            // Calculate travel cost to destination
            const distance = portDistances[gameState.currentPort][destinationPortId];
            const estimatedDays = Math.max(1, Math.round(distance / gameState.ship.speed));
            const supplyCost = calculateSupplyCost(estimatedDays);

            // Reserve money for supplies - calculate how many to buy
            const availableMoneyForGoods = Math.max(0, gameState.gold - supplyCost - AUTOPILOT_CONFIG.SAFETY_RESERVE);
            const maxByMoney = Math.floor(availableMoneyForGoods * AUTOPILOT_CONFIG.CARGO_UTILIZATION_RATIO / buyPrice);
            const maxByCargo = Math.floor(cargoSpace * AUTOPILOT_CONFIG.CARGO_UTILIZATION_RATIO);
            const maxByStock = portStock;
            const maxCanBuy = Math.min(maxByMoney, maxByCargo, maxByStock);

            if (maxCanBuy >= AUTOPILOT_CONFIG.MINIMUM_PURCHASE_MULTIPLIER) {
                const totalCost = maxCanBuy * buyPrice;
                gameState.gold -= totalCost;
                gameState.inventory[goodId] = (gameState.inventory[goodId] || 0) + maxCanBuy;
                reducePortStock(gameState.currentPort, goodId, maxCanBuy);

                gameState.autopilotReport.trades.push({
                    port: gameState.currentPort,
                    action: 'buy',
                    good: goods[goodId].name,
                    quantity: maxCanBuy,
                    price: buyPrice,
                    total: totalCost
                });

                addLog(`🤖 ${goods[goodId].name}を${maxCanBuy}個購入しました`);
                updateAll();
                actionTaken = true;
            }
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
        }
    }

    // If no action was taken (stuck due to lack of supplies or no profitable trades),
    // advance time by 1 day to allow inventory to replenish
    if (!actionTaken) {
        gameState.gameTime += 1;
        refreshPortInventory(1);
        addLog(`⏰ 翌日になりました (${gameState.gameTime}日目) - 在庫が補充されました`);
        saveGame();
        updateAll();
    }

    return actionTaken;
}

// Find the best trade opportunity
function findBestTrade() {
    const currentPortId = gameState.currentPort;
    
    // Check if we have goods to sell at current port
    let bestSellValue = 0;
    let hasProfitableGoods = false;
    
    for (const goodId in gameState.inventory) {
        if (goodId === 'food' || goodId === 'water') continue;
        const quantity = gameState.inventory[goodId];
        if (quantity > 0) {
            const sellPrice = getPrice(goodId, false);
            const sellValue = sellPrice * quantity;
            bestSellValue += sellValue;
            hasProfitableGoods = true;
        }
    }
    
    // If we have goods, check if we should sell them here or travel to a better port
    if (hasProfitableGoods) {
        // Check if there's a significantly better port to sell at
        let bestSellPort = currentPortId;
        let bestSellPotential = bestSellValue;
        let bestSupplyCost = 0;
        
        for (const destPortId in ports) {
            if (destPortId === currentPortId) continue;
            
            // Calculate potential sell value at destination
            const originalPort = gameState.currentPort;
            gameState.currentPort = destPortId;
            let destSellValue = 0;
            for (const goodId in gameState.inventory) {
                if (goodId === 'food' || goodId === 'water') continue;
                const quantity = gameState.inventory[goodId];
                if (quantity > 0) {
                    const sellPrice = getPrice(goodId, false);
                    destSellValue += sellPrice * quantity;
                }
            }
            gameState.currentPort = originalPort;
            
            // Calculate travel cost
            const distance = portDistances[currentPortId][destPortId];
            const estimatedDays = Math.max(1, Math.round(distance / gameState.ship.speed));
            const supplyCost = calculateSupplyCost(estimatedDays);
            
            // Net benefit of traveling to sell there
            const netBenefit = destSellValue - bestSellValue - supplyCost;

            // Only travel if:
            // 1. We have enough money for supplies + safety reserve
            // 2. Net benefit exceeds supply cost (travel must be profitable)
            // 3. Net benefit is significant (at least 10% improvement)
            if (gameState.gold >= supplyCost + AUTOPILOT_CONFIG.SAFETY_RESERVE &&
                netBenefit > supplyCost &&
                netBenefit > bestSellValue * AUTOPILOT_CONFIG.PROFIT_IMPROVEMENT_RATIO &&
                destSellValue > bestSellPotential) {
                bestSellPotential = destSellValue;
                bestSellPort = destPortId;
                bestSupplyCost = supplyCost;
            }
        }
        
        // If current port is best OR we don't have money for travel, sell here
        if (bestSellPort === currentPortId) {
            return { action: 'sell' };
        } else {
            // Travel to better selling port (we verified we have enough money above)
            return {
                action: 'travel',
                destinationPort: bestSellPort
            };
        }
    }
    
    // Find best buy-and-sell opportunity
    let bestNetProfit = 0;
    let bestGoodId = null;
    let bestDestination = null;
    
    for (const goodId in goods) {
        if (goodId === 'food' || goodId === 'water') continue;
        
        const buyPrice = getPrice(goodId, true);
        const portStock = getPortStock(currentPortId, goodId);
        
        if (portStock > 0 && buyPrice > 0) {
            // Check selling prices at other ports
            for (const destPortId in ports) {
                if (destPortId === currentPortId) continue;
                
                // Temporarily switch to destination to get sell price
                const originalPort = gameState.currentPort;
                gameState.currentPort = destPortId;
                const sellPrice = getPrice(goodId, false);
                gameState.currentPort = originalPort;
                
                // Calculate travel cost
                const distance = portDistances[currentPortId][destPortId];
                const estimatedDays = Math.max(1, Math.round(distance / gameState.ship.speed));
                const supplyCost = calculateSupplyCost(estimatedDays);
                
                // Calculate potential quantity to buy - must reserve money for supplies!
                const cargoSpace = getCargoSpace();
                const availableMoneyForGoods = Math.max(0, gameState.gold - supplyCost - AUTOPILOT_CONFIG.SAFETY_RESERVE);
                const maxByMoney = Math.floor(availableMoneyForGoods * AUTOPILOT_CONFIG.CARGO_UTILIZATION_RATIO / buyPrice);
                const maxByCargo = Math.floor(cargoSpace * AUTOPILOT_CONFIG.CARGO_UTILIZATION_RATIO);
                const estimatedQuantity = Math.min(maxByMoney, maxByCargo, portStock, AUTOPILOT_CONFIG.MAX_ESTIMATED_QUANTITY);
                
                if (estimatedQuantity >= AUTOPILOT_CONFIG.MINIMUM_PURCHASE_MULTIPLIER) {
                    // Net profit = revenue - cost - travel
                    const revenue = sellPrice * estimatedQuantity;
                    const cost = buyPrice * estimatedQuantity;
                    const netProfit = revenue - cost - supplyCost;
                    
                    // Only consider if net profit is positive and significant
                    if (netProfit > bestNetProfit && netProfit > AUTOPILOT_CONFIG.MINIMUM_PROFIT_THRESHOLD) {
                        bestNetProfit = netProfit;
                        bestGoodId = goodId;
                        bestDestination = destPortId;
                    }
                }
            }
        }
    }
    
    // Only execute trade if it's profitable
    if (bestGoodId && bestNetProfit > 0) {
        const cargoSpace = getCargoSpace();
        
        // The calculation above already verified profitability with proper money reservation
        // Just check if we have minimum cargo space
        if (cargoSpace > AUTOPILOT_CONFIG.MINIMUM_CARGO_SPACE) {
            return {
                action: 'buy',
                goodId: bestGoodId,
                destinationPort: bestDestination
            };
        }
    }
    
    // No profitable trade found - don't do anything (don't waste money on random travel)
    return null;
}

// Helper function to calculate supply cost for a voyage
function calculateSupplyCost(days) {
    const required = calculateRequiredSupplies(days);
    const foodPrice = goods.food.basePrice * portPrices[gameState.currentPort].food;
    const waterPrice = goods.water.basePrice * portPrices[gameState.currentPort].water;
    return Math.ceil(required.food * foodPrice + required.water * waterPrice);
}

// Generate autopilot report
function generateAutopilotReport() {
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

// Show autopilot report modal
function showAutopilotReport(report) {
    const modal = document.createElement('div');
    modal.className = 'voyage-modal';
    modal.style.zIndex = '1000';
    
    let tradesHtml = '<div class="autopilot-trades">';
    if (report.trades.length > 0) {
        tradesHtml += '<h4>取引記録:</h4><ul>';
        report.trades.forEach(trade => {
            const emoji = trade.action === 'buy' ? '📥' : '📤';
            const actionText = trade.action === 'buy' ? '購入' : '売却';
            tradesHtml += `<li>${emoji} ${ports[trade.port].name}: ${trade.good} ${trade.quantity}個 ${actionText} (${trade.total}G)</li>`;
        });
        tradesHtml += '</ul>';
    } else {
        tradesHtml += '<p>取引なし</p>';
    }
    tradesHtml += '</div>';
    
    let voyagesHtml = '<div class="autopilot-voyages">';
    if (report.voyages.length > 0) {
        voyagesHtml += '<h4>航海記録:</h4><ul>';
        report.voyages.forEach(voyage => {
            voyagesHtml += `<li>⛵ ${voyage.from} → ${voyage.to} (${voyage.days}日)</li>`;
        });
        voyagesHtml += '</ul>';
    } else {
        voyagesHtml += '<p>航海なし</p>';
    }
    voyagesHtml += '</div>';
    
    const profitColor = report.profit >= 0 ? '#4CAF50' : '#f44336';
    const profitSign = report.profit >= 0 ? '+' : '';
    
    modal.innerHTML = `
        <div class="voyage-content">
            <h2>🤖 オートパイロット作業報告書</h2>
            <div class="autopilot-summary">
                <div class="voyage-stat">
                    <span class="stat-label">⏱️ 実行時間:</span>
                    <span class="stat-value">${report.durationText}</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">📅 経過日数:</span>
                    <span class="stat-value">${report.daysElapsed}日</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">💰 開始資金:</span>
                    <span class="stat-value">${report.startGold}G</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">💰 終了資金:</span>
                    <span class="stat-value">${report.endGold}G</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">📊 純利益:</span>
                    <span class="stat-value" style="color: ${profitColor}; font-weight: bold;">${profitSign}${report.profit}G</span>
                </div>
            </div>
            ${tradesHtml}
            ${voyagesHtml}
            <button class="btn btn-primary" onclick="closeAutopilotReport()" style="margin-top: 20px; width: 100%;">
                閉じる
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    addLog(`📊 オートパイロット完了！利益: ${profitSign}${report.profit}G`);
}

// Close autopilot report
function closeAutopilotReport() {
    const modal = document.querySelector('.voyage-modal');
    if (modal) {
        modal.remove();
    }
}

// Update autopilot UI
function updateAutopilotUI() {
    const toggleBtn = document.getElementById('autopilot-toggle');
    const timerSpan = document.getElementById('autopilot-timer');
    const durationInput = document.getElementById('autopilot-duration');
    
    if (!toggleBtn || !timerSpan || !durationInput) return;
    
    if (gameState.autopilotActive) {
        toggleBtn.textContent = '⏹️ 停止';
        toggleBtn.className = 'btn btn-sell';
        durationInput.disabled = true;

        const elapsed = Date.now() - gameState.autopilotStartTime;
        const elapsedMinutes = Math.floor(elapsed / 60000);
        const remainingMinutes = gameState.autopilotDurationMinutes - elapsedMinutes;

        if (remainingMinutes > 0) {
            const hours = Math.floor(remainingMinutes / 60);
            const minutes = remainingMinutes % 60;
            if (hours > 0) {
                timerSpan.textContent = `⏱️ 残り: ${hours}時間${minutes}分`;
            } else {
                timerSpan.textContent = `⏱️ 残り: ${minutes}分`;
            }
        } else {
            timerSpan.textContent = '⏱️ まもなく完了...';
        }
    } else {
        toggleBtn.textContent = '🤖 開始';
        toggleBtn.className = 'btn btn-primary';
        durationInput.disabled = false;
        timerSpan.textContent = '';
    }
}

// Toggle autopilot
function toggleAutopilot() {
    if (gameState.autopilotActive) {
        stopAutopilot();
    } else {
        const durationInput = document.getElementById('autopilot-duration');
        const duration = parseInt(durationInput.value) || 60;
        startAutopilot(duration);
    }
}

// Initialize Game
function initGame() {
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
    } else {
        // Check for ongoing voyage (in case loadGame didn't call it)
        if (gameState.isVoyaging && gameState.voyageStartTime) {
            checkAndUpdateVoyageProgress();
        }
        
        // Check for active autopilot
        if (gameState.autopilotActive && gameState.autopilotStartTime) {
            // Check if autopilot should still be running
            const elapsed = Date.now() - gameState.autopilotStartTime;
            const elapsedMinutes = elapsed / 60000;
            
            if (elapsedMinutes >= gameState.autopilotDurationMinutes) {
                // Autopilot time expired, show report
                stopAutopilot();
            } else {
                // Resume autopilot
                addLog('🤖 オートパイロット再開...');
                runAutopilotCycle();
            }
        }
    }

    updateAll();
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', initGame);

// Make functions globally accessible
if (typeof window !== 'undefined') {
    window.buyGood = buyGood;
    window.buyAllGood = buyAllGood;
    window.sellGood = sellGood;
    window.sellAllGood = sellAllGood;
    window.travelTo = travelTo;
    window.upgradeShip = upgradeShip;
    window.clearSave = clearSave;
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
        hasEnoughSupplies,
        consumeSupplies,
        buySupply,
        autoSupplyForVoyage,
        selectDestination,
        getPortStock,
        reducePortStock,
        initializePortInventory,
        getCargoSpace,
        getCargoUsed,
        getPrice,
        saveGame,
        loadGame,
        getSeaRoute,
        initializeVoyageMap,
        updateShipPosition,
        findBestTrade,
        calculateSupplyCost
    };
}
