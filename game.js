// Game State
const gameState = {
    gold: 1000,
    currentPort: 'lisbon',
    inventory: {},
    ship: {
        name: 'カラベル船',
        capacity: 50,
        speed: 1
    }
};

// Port Definitions
const ports = {
    lisbon: {
        name: 'リスボン',
        emoji: '🇵🇹',
        description: 'ポルトガルの首都。冒険の始まりの地。'
    },
    seville: {
        name: 'セビリア',
        emoji: '🇪🇸',
        description: 'スペインの港町。新大陸への玄関口。'
    },
    venice: {
        name: 'ヴェネツィア',
        emoji: '🇮🇹',
        description: '水の都。東方貿易の中心地。'
    },
    alexandria: {
        name: 'アレクサンドリア',
        emoji: '🇪🇬',
        description: 'エジプトの古都。香辛料の集積地。'
    },
    calicut: {
        name: 'カリカット',
        emoji: '🇮🇳',
        description: 'インドの港町。胡椒の産地。'
    },
    malacca: {
        name: 'マラッカ',
        emoji: '🇲🇾',
        description: '東南アジアの交易拠点。'
    },
    nagasaki: {
        name: '長崎',
        emoji: '🇯🇵',
        description: '日本の港町。銀と絹の取引が盛ん。'
    }
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
    silver: { name: '銀', emoji: '💍', basePrice: 250 }
};

// Port-specific price modifiers (multipliers)
const portPrices = {
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.0, silk: 1.8, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.8, silk: 1.7, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3 },
    venice: { wine: 1.1, cloth: 0.7, spices: 1.5, silk: 1.3, gold_ore: 1.6, porcelain: 1.4, tea: 1.4, silver: 1.5 },
    alexandria: { wine: 1.2, cloth: 1.1, spices: 0.9, silk: 1.2, gold_ore: 1.4, porcelain: 1.3, tea: 1.2, silver: 1.4 },
    calicut: { wine: 1.5, cloth: 1.3, spices: 0.6, silk: 1.0, gold_ore: 1.3, porcelain: 1.2, tea: 0.9, silver: 1.2 },
    malacca: { wine: 1.6, cloth: 1.4, spices: 0.8, silk: 0.9, gold_ore: 1.2, porcelain: 1.0, tea: 0.8, silver: 1.1 },
    nagasaki: { wine: 1.8, cloth: 1.5, spices: 1.3, silk: 0.7, gold_ore: 1.5, porcelain: 0.8, tea: 0.7, silver: 0.6 }
};

// Ship upgrades
const shipUpgrades = [
    {
        name: 'カラベル船',
        capacity: 50,
        speed: 1,
        cost: 0,
        description: '小型で機動性の高い船'
    },
    {
        name: 'キャラック船',
        capacity: 100,
        speed: 1.2,
        cost: 5000,
        description: '大型で積載量が多い船'
    },
    {
        name: 'ガレオン船',
        capacity: 150,
        speed: 1.5,
        cost: 15000,
        description: '最大級の貿易船'
    },
    {
        name: '東インド会社船',
        capacity: 250,
        speed: 2,
        cost: 50000,
        description: '伝説の大型貿易船'
    }
];

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
}

// Update UI Functions
function updateStatusBar() {
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('ship-name').textContent = gameState.ship.name;
    document.getElementById('cargo-space').textContent = getCargoUsed();
    document.querySelector('#cargo-space + .stat-unit').textContent = ` / ${gameState.ship.capacity}`;
    document.getElementById('current-port').textContent = getCurrentPortName();
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

        const div = document.createElement('div');
        div.className = 'good-item';
        div.innerHTML = `
            <span class="item-name">${good.emoji} ${good.name}</span>
            <span class="item-price">買: ${buyPrice}G / 売: ${sellPrice}G</span>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button class="btn btn-buy" onclick="buyGood('${goodId}')">買う</button>
                <button class="btn btn-buy" onclick="buyAllGood('${goodId}')">全部買う</button>
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

        div.innerHTML = `
            <span class="item-name">${port.emoji} ${port.name}</span>
            <span style="font-size: 0.9em; color: #666;">${port.description}</span>
            <button class="btn btn-travel" onclick="travelTo('${portId}')">
                航海 (費用: ${travelCost}G)
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
                    積載量: ${ship.capacity} / 速度: ${ship.speed}x
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
}

// Game Actions
function buyGood(goodId) {
    const price = getPrice(goodId, true);

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

    const good = goods[goodId];
    addLog(`✅ ${good.emoji} ${good.name}を${price}Gで購入しました。`);

    updateAll();
}

function buyAllGood(goodId) {
    const price = getPrice(goodId, true);
    const good = goods[goodId];

    // Calculate how many we can buy based on money
    const maxByMoney = Math.floor(gameState.gold / price);

    // Calculate how many we can buy based on cargo space
    const maxByCargo = getCargoSpace();

    // Take the minimum of both constraints
    const maxCanBuy = Math.min(maxByMoney, maxByCargo);

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

    addLog(`✅ ${good.emoji} ${good.name}を${maxCanBuy}個、合計${totalCost}Gで購入しました。`);

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

function travelTo(portId) {
    const travelCost = Math.round(50 / gameState.ship.speed);

    if (gameState.gold < travelCost) {
        addLog(`❌ 航海費用が足りません！(必要: ${travelCost}G)`);
        return;
    }

    gameState.gold -= travelCost;

    const oldPort = ports[gameState.currentPort].name;
    gameState.currentPort = portId;
    const newPort = ports[portId].name;

    // Sailing animation
    const ship = document.getElementById('ship-sprite');
    ship.classList.add('sailing');

    addLog(`⛵ ${oldPort}から${newPort}へ航海しました！(費用: ${travelCost}G)`);
    addLog(`🏖️ ${ports[portId].emoji} ${newPort}に到着！${ports[portId].description}`);

    updateAll();
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
    addLog('🌊 大航海時代へようこそ！');
    addLog('💡 各港で商品を安く買い、高く売って利益を得ましょう。');
    addLog('💡 資金を貯めて、より大きな船にアップグレードしましょう！');
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
