// Game State
const gameState = {
    gold: 1000,
    currentPort: 'lisbon',
    inventory: {},
    ship: {
        name: 'カラベル船',
        capacity: 50,
        speed: 1,
        crew: 20
    },
    logs: [],
    gameTime: 0, // Game time in days
    isVoyaging: false // Flag to track if currently on a voyage
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
    // Essential supplies
    food: { name: '食糧', emoji: '🍖', basePrice: 5 },
    water: { name: '水', emoji: '💧', basePrice: 3 }
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
        capacity: 50,
        speed: 1,
        cost: 0,
        crew: 20,
        description: '小型で機動性の高い船'
    },
    {
        name: 'キャラック船',
        capacity: 100,
        speed: 1.2,
        cost: 5000,
        crew: 40,
        description: '大型で積載量が多い船'
    },
    {
        name: 'ガレオン船',
        capacity: 150,
        speed: 1.5,
        cost: 15000,
        crew: 60,
        description: '最大級の貿易船'
    },
    {
        name: '東インド会社船',
        capacity: 250,
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
            let currentStock = portInventory[portId][goodId];

            // For water and food, ensure minimum stock based on port size (handles old save data)
            if ((goodId === 'water' || goodId === 'food') && currentStock === 0) {
                // Reset to initial values if completely depleted
                if (portSize === 'small') {
                    currentStock = Math.round(maxStock * 0.3);
                } else {
                    currentStock = maxStock;
                }
            }

            const recovered = Math.min(
                maxStock,
                currentStock + (refreshRate * daysPassed)
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

            // Load port inventory if available
            if (loadedState.portInventory) {
                for (const portId in loadedState.portInventory) {
                    portInventory[portId] = loadedState.portInventory[portId];
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
            return true;
        }
    } catch (e) {
        console.error('ロードに失敗しました:', e);
    }
    return false;
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

    if (Object.keys(gameState.inventory).length === 0) {
        inventoryDiv.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">在庫なし</p>';
        return;
    }

    for (const [goodId, qty] of Object.entries(gameState.inventory)) {
        if (qty > 0) {
            const good = goods[goodId];
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                <div class="inventory-item-name">${good.emoji} ${good.name}</div>
                <div class="inventory-item-qty">${qty}個</div>
            `;
            inventoryDiv.appendChild(div);
        }
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

    for (const [portId, port] of Object.entries(ports)) {
        if (portId === gameState.currentPort) continue;

        const div = document.createElement('div');
        div.className = 'port-item';

        const travelCost = Math.round(50 / gameState.ship.speed);
        const baseDays = portDistances[gameState.currentPort][portId];
        const travelDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));

        // Calculate required supplies
        const required = calculateRequiredSupplies(travelDays);
        const suppliesCheck = hasEnoughSupplies(travelDays);
        const hasSupplies = suppliesCheck.hasEnough;

        div.innerHTML = `
            <div style="flex: 1;">
                <span class="item-name">${port.emoji} ${port.name}</span>
                <span style="font-size: 0.9em; color: #666; display: block;">${port.description}</span>
                <span style="font-size: 0.85em; color: ${hasSupplies ? '#666' : '#d32f2f'}; display: block; margin-top: 5px;">
                    必要物資: 🍖${required.food} 💧${required.water}
                    ${!hasSupplies ? '(不足)' : ''}
                </span>
            </div>
            <button class="btn btn-travel" onclick="travelTo('${portId}')" ${!hasSupplies ? 'disabled' : ''}>
                航海 (${travelCost}G / ${travelDays}日)
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
        food: Math.ceil(crew * days * 1.5), // 1.5x for safety margin
        water: Math.ceil(crew * days * 1.5)
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

function startVoyage(destinationPortId) {
    const travelCost = Math.round(50 / gameState.ship.speed);

    if (gameState.gold < travelCost) {
        addLog(`❌ 航海費用が足りません！(必要: ${travelCost}G)`);
        return;
    }

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

    // Deduct travel cost
    gameState.gold -= travelCost;
    gameState.isVoyaging = true;

    const oldPort = ports[gameState.currentPort].name;
    const newPort = ports[destinationPortId].name;

    // Show voyage modal
    showVoyageModal(oldPort, newPort, destinationPortId, estimatedDays);
}

function showVoyageModal(fromPort, toPort, destinationPortId, estimatedDays) {
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

function simulateVoyage(destinationPortId, estimatedDays) {
    const TIME_PER_DAY = 15000; // 15 seconds per game day
    let daysElapsed = 0;
    let actualDaysNeeded = estimatedDays;
    let currentWeather = getRandomWeather();

    const voyageLog = document.getElementById('voyage-log');
    const addVoyageLog = (message) => {
        const p = document.createElement('p');
        p.textContent = message;
        voyageLog.appendChild(p);
        voyageLog.scrollTop = voyageLog.scrollHeight;
    };

    addVoyageLog(`🌊 ${ports[gameState.currentPort].name}を出港しました`);
    addVoyageLog(`${currentWeather.emoji} ${currentWeather.name}: ${currentWeather.description}`);

    const interval = setInterval(() => {
        daysElapsed++;

        // Random weather change (20% chance per day)
        if (Math.random() < 0.2) {
            currentWeather = getRandomWeather();
            addVoyageLog(`${currentWeather.emoji} 天候が変化: ${currentWeather.name}`);

            // Adjust estimated arrival based on weather
            if (currentWeather.speedMultiplier < 1.0) {
                const delay = Math.random() < 0.3 ? 1 : 0;
                if (delay > 0) {
                    actualDaysNeeded += delay;
                    addVoyageLog(`⚠️ ${currentWeather.name}の影響で到着が遅れています`);
                }
            }
        }

        // Update UI
        document.getElementById('voyage-days-elapsed').textContent = daysElapsed;
        document.getElementById('voyage-weather').textContent = `${currentWeather.emoji} ${currentWeather.name}`;
        document.getElementById('voyage-speed').textContent = `${Math.round(currentWeather.speedMultiplier * 100)}%`;

        // Update weather effect
        const weatherEffect = document.getElementById('voyage-weather-effect');
        weatherEffect.className = 'weather-effect ' + currentWeather.id;

        // Check if voyage is complete
        if (daysElapsed >= actualDaysNeeded) {
            clearInterval(interval);
            completeVoyage(destinationPortId, daysElapsed);
        }
    }, TIME_PER_DAY);
}

function completeVoyage(destinationPortId, actualDays) {
    // Advance time
    gameState.gameTime += actualDays;

    // Consume supplies
    consumeSupplies(actualDays);

    // Change port
    const oldPort = ports[gameState.currentPort].name;
    gameState.currentPort = destinationPortId;
    const newPort = ports[destinationPortId].name;

    // Refresh port inventories
    refreshPortInventory(actualDays);

    gameState.isVoyaging = false;

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
