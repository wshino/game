import { gameState } from '../core/game-state.js';
import { ports, goods, portDistances, shipUpgrades } from '../core/constants.js';
import { getPrice, getCargoUsed, getCargoSpace, getCurrentPortName, getRecommendedGoods, canAffordVoyage, isProfitable } from '../utils/calculations.js';
import { getPortStock } from '../services/port-service.js';
import { calculateRequiredSupplies, hasEnoughSupplies } from '../services/supply-service.js';
import { saveGame } from '../services/save-service.js';

// Callback functions that will be set from main game file
let updateAutopilotUI;

// Set callback functions (call this from main game initialization)
export function setUICallbacks(updateAutopilotUIFn) {
    updateAutopilotUI = updateAutopilotUIFn;
}

// Update status bar
export function updateStatusBar() {
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

// Update inventory display
export function updateInventory() {
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

// Update trade goods display
export function updateTradeGoods() {
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

// Update ports display
export function updatePorts() {
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
        const recommendedGoods = getRecommendedGoods(gameState.selectedDestination, getPortStock, 3);

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
        const canAfford = canAffordVoyage(portId, calculateRequiredSupplies);
        const profitable = isProfitable(portId, getPortStock);
        const recommendedGoods = getRecommendedGoods(portId, getPortStock, 3);

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

// Update upgrades display
export function updateUpgrades() {
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

// Update all UI elements
export function updateAll() {
    updateStatusBar();
    updateInventory();
    updateTradeGoods();
    updatePorts();
    updateUpgrades();
    if (updateAutopilotUI) {
        updateAutopilotUI();
    }
    saveGame(); // Auto-save after any state change
}
