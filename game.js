// Game State
const gameState = {
    gold: 1000,
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
    voyageWeatherHistory: [] // Weather changes during voyage
};

// Port Definitions (based on historical 15-16th century city sizes)
const ports = {
    lisbon: {
        name: 'リスボン',
        emoji: '🇵🇹',
        description: 'ポルトガルの首都。冒険の始まりの地。',
        size: 'large', // 大規模港 (人口10万人以上、大航海時代の中心地)
        historicalNote: '15世紀末から16世紀にかけて、大航海時代の中心として急成長。人口10万人超。'
    },
    seville: {
        name: 'セビリア',
        emoji: '🇪🇸',
        description: 'スペインの港町。新大陸への玄関口。',
        size: 'large', // 大規模港 (新大陸貿易独占港、人口10万人規模)
        historicalNote: '16世紀、新大陸との貿易を独占し、スペイン随一の商業都市に成長。'
    },
    venice: {
        name: 'ヴェネツィア',
        emoji: '🇮🇹',
        description: '水の都。東方貿易の中心地。',
        size: 'very_large', // 最大規模港 (人口15-18万人、当時のヨーロッパ最大級都市)
        historicalNote: '15世紀、人口15-18万人を擁し、地中海貿易を支配する最大級の商業共和国。'
    },
    alexandria: {
        name: 'アレクサンドリア',
        emoji: '🇪🇬',
        description: 'エジプトの古都。香辛料の集積地。',
        size: 'medium', // 中規模港 (マムルーク朝/オスマン朝下で往時より衰退)
        historicalNote: '15世紀マムルーク朝下で往時の栄華からは衰退も、依然として香辛料貿易の要衝。'
    },
    calicut: {
        name: 'カリカット',
        emoji: '🇮🇳',
        description: 'インドの港町。胡椒の産地。',
        size: 'medium', // 中規模港 (インド西海岸の重要な香辛料貿易港)
        historicalNote: '15-16世紀、インド西海岸最大の香辛料貿易港。ヴァスコ・ダ・ガマが到達。'
    },
    malacca: {
        name: 'マラッカ',
        emoji: '🇲🇾',
        description: '東南アジアの交易拠点。',
        size: 'medium', // 中規模港 (マラッカ王国の首都、東南アジア貿易の中心)
        historicalNote: '15世紀、マラッカ王国の首都として東西貿易の要衝。1511年ポルトガルに征服。'
    },
    nagasaki: {
        name: '長崎',
        emoji: '🇯🇵',
        description: '日本の港町。銀と絹の取引が盛ん。',
        size: 'small', // 小規模港 (16世紀半ばまで小さな漁村、1570年代に貿易港化)
        historicalNote: '1570年代、ポルトガル貿易の拠点として開港。それまでは小さな漁村。'
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
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.0, silk: 1.8, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4, food: 1.0, water: 1.0 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.8, silk: 1.7, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3, food: 0.9, water: 0.9 },
    venice: { wine: 1.1, cloth: 0.7, spices: 1.5, silk: 1.3, gold_ore: 1.6, porcelain: 1.4, tea: 1.4, silver: 1.5, food: 1.1, water: 1.0 },
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
            // Water and food are more abundant in larger cities
            if (goodId === 'water' || goodId === 'food') {
                // Small ports have limited supplies (30% of max)
                // Medium and larger ports have full supplies
                if (portSize === 'small') {
                    portInventory[portId][goodId] = Math.round(maxStock * 0.3);
                } else {
                    portInventory[portId][goodId] = maxStock;
                }
            } else {
                // Other goods start at max stock
                portInventory[portId][goodId] = maxStock;
            }
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
            gameState.ship = loadedState.ship;
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

                    // Ensure water and food have proper initial values
                    for (const goodId in goods) {
                        if (goodId === 'water' || goodId === 'food') {
                            // If water or food is missing or 0, reset to initial value
                            if (!portInventory[portId][goodId] || portInventory[portId][goodId] === 0) {
                                if (portSize === 'small') {
                                    portInventory[portId][goodId] = Math.round(maxStock * 0.3);
                                } else {
                                    portInventory[portId][goodId] = maxStock;
                                }
                            }
                        } else {
                            // Initialize other goods if missing
                            if (!portInventory[portId][goodId]) {
                                portInventory[portId][goodId] = maxStock;
                            }
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
        food: Math.ceil(crew * days * 1.0), // 1 unit per crew per day
        water: Math.ceil(crew * days * 1.0)
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
                <div id="voyage-ship" class="voyage-ship">🚢</div>
                <div id="voyage-weather-effect" class="weather-effect"></div>
            </div>
            <div id="voyage-log" class="voyage-log"></div>
        </div>
    `;
    document.body.appendChild(modal);

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
                <div id="voyage-ship" class="voyage-ship">🚢</div>
                <div id="voyage-weather-effect" class="weather-effect"></div>
            </div>
            <div id="voyage-log" class="voyage-log"></div>
        </div>
    `;
    document.body.appendChild(modal);

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
        const daysElapsed = Math.floor(elapsedRealTime / TIME_PER_DAY);
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
        addLog(`💼 商品を積んだら「航海を開始する」ボタンで出発してください`);
    } else if (supplyResult.success && supplyResult.alreadyEnough) {
        addLog(`⚓ ${ports[portId].name}を航海先に選択しました`);
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

// Initialize Game
function initGame() {
    const loaded = loadGame();

    if (!loaded) {
        // Initialize port inventory for new game
        initializePortInventory();

        addLog('🌊 大航海時代へようこそ！');
        addLog('💡 各港で商品を安く買い、高く売って利益を得ましょう。');
        addLog('💡 港の在庫は限られています。時間が経つと在庫が回復します。');
        addLog('💡 資金を貯めて、より大きな船にアップグレードしましょう！');
        addLog('💡 移動中にゲームを閉じても、現実時間で移動が進行します！');
    } else {
        // Check for ongoing voyage (in case loadGame didn't call it)
        if (gameState.isVoyaging && gameState.voyageStartTime) {
            checkAndUpdateVoyageProgress();
        }
    }

    updateAll();
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', initGame);

// Make functions globally accessible
window.buyGood = buyGood;
window.buyAllGood = buyAllGood;
window.sellGood = sellGood;
window.sellAllGood = sellAllGood;
window.travelTo = travelTo;
window.upgradeShip = upgradeShip;
window.clearSave = clearSave;
