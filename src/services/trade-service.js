import { gameState } from '../core/game-state.js';
import { goods, shipUpgrades } from '../core/constants.js';
import { getPrice, getCargoSpace, getCargoUsed } from '../utils/calculations.js';
import { getPortStock, reducePortStock } from './port-service.js';
import { addLog } from '../utils/logger.js';

// UI callback functions
let updateAll;

// Set UI callback functions (call this from main game initialization)
export function setUICallbacks(updateAllFn) {
    updateAll = updateAllFn;
}

// Buy a single unit of a good
export function buyGood(goodId) {
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

// Buy all possible units of a good
export function buyAllGood(goodId) {
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

// Sell a single unit of a good
export function sellGood(goodId) {
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

// Sell all units of a good
export function sellAllGood(goodId) {
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

// Upgrade ship
export function upgradeShip(shipIndex) {
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

// Travel to a port (wrapper for startVoyage)
export function travelTo(portId, startVoyageFn) {
    if (gameState.isVoyaging) {
        return; // Prevent travel during voyage
    }
    startVoyageFn(portId);
}
