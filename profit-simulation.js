#!/usr/bin/env node

/**
 * 大航海時代ゲーム - 利益シミュレーター
 *
 * 異なる戦略でプレイした場合の利益の推移をシミュレートします
 */

// ゲームデータ定義
const goods = {
    wine: { name: 'ワイン', basePrice: 50 },
    cloth: { name: '織物', basePrice: 80 },
    spices: { name: '香辛料', basePrice: 150 },
    silk: { name: '絹', basePrice: 200 },
    gold_ore: { name: '金鉱石', basePrice: 300 },
    porcelain: { name: '陶器', basePrice: 120 },
    tea: { name: '茶', basePrice: 100 },
    silver: { name: '銀', basePrice: 250 },
    food: { name: '食糧', basePrice: 5 },
    water: { name: '水', basePrice: 3 }
};

const portPrices = {
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.0, silk: 1.8, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4, food: 1.0, water: 1.0 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.8, silk: 1.7, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3, food: 0.9, water: 0.9 },
    venice: { wine: 1.1, cloth: 0.7, spices: 1.5, silk: 1.3, gold_ore: 1.6, porcelain: 1.4, tea: 1.4, silver: 1.5, food: 1.1, water: 1.0 },
    alexandria: { wine: 1.2, cloth: 1.1, spices: 0.9, silk: 1.2, gold_ore: 1.4, porcelain: 1.3, tea: 1.2, silver: 1.4, food: 1.2, water: 1.3 },
    calicut: { wine: 1.5, cloth: 1.3, spices: 0.6, silk: 1.0, gold_ore: 1.3, porcelain: 1.2, tea: 0.9, silver: 1.2, food: 1.0, water: 1.1 },
    malacca: { wine: 1.6, cloth: 1.4, spices: 0.8, silk: 0.9, gold_ore: 1.2, porcelain: 1.0, tea: 0.8, silver: 1.1, food: 1.1, water: 1.2 },
    nagasaki: { wine: 1.8, cloth: 1.5, spices: 1.3, silk: 0.7, gold_ore: 1.5, porcelain: 0.8, tea: 0.7, silver: 0.6, food: 1.3, water: 1.2 }
};

const portDistances = {
    lisbon: { lisbon: 0, seville: 2, venice: 5, alexandria: 7, calicut: 15, malacca: 20, nagasaki: 30 },
    seville: { lisbon: 2, seville: 0, venice: 5, alexandria: 6, calicut: 14, malacca: 19, nagasaki: 29 },
    venice: { lisbon: 5, seville: 5, venice: 0, alexandria: 3, calicut: 12, malacca: 17, nagasaki: 27 },
    alexandria: { lisbon: 7, seville: 6, venice: 3, alexandria: 0, calicut: 10, malacca: 15, nagasaki: 25 },
    calicut: { lisbon: 15, seville: 14, venice: 12, alexandria: 10, calicut: 0, malacca: 5, nagasaki: 15 },
    malacca: { lisbon: 20, seville: 19, venice: 17, alexandria: 15, calicut: 5, malacca: 0, nagasaki: 10 },
    nagasaki: { lisbon: 30, seville: 29, venice: 27, alexandria: 25, calicut: 15, malacca: 10, nagasaki: 0 }
};

const shipUpgrades = [
    { name: 'カラベル船', capacity: 100, speed: 1.0, cost: 0, crew: 20 },
    { name: 'キャラック船', capacity: 200, speed: 1.2, cost: 5000, crew: 40 },
    { name: 'ガレオン船', capacity: 300, speed: 1.5, cost: 15000, crew: 60 },
    { name: '東インド会社船', capacity: 500, speed: 2.0, cost: 50000, crew: 100 }
];

// 価格計算関数（簡略版、ランダム要素は平均1.0として計算）
function getPrice(goodId, portId, isBuying = true) {
    const basePrice = goods[goodId].basePrice;
    const multiplier = portPrices[portId][goodId];
    const price = Math.round(basePrice * multiplier);
    return isBuying ? price : Math.round(price * 0.8);
}

// 補給品コスト計算
function calculateSupplyCost(fromPort, toPort, ship) {
    const days = Math.ceil(portDistances[fromPort][toPort] / ship.speed);
    const foodNeeded = ship.crew * days;
    const waterNeeded = ship.crew * days;

    const foodPrice = getPrice('food', fromPort, true);
    const waterPrice = getPrice('water', fromPort, true);

    return {
        cost: foodNeeded * foodPrice + waterNeeded * waterPrice,
        days: days,
        food: foodNeeded,
        water: waterNeeded
    };
}

// 航海シミュレーション
function simulateVoyage(fromPort, toPort, cargo, ship, currentGold) {
    // 補給品必要量計算
    const supply = calculateSupplyCost(fromPort, toPort, ship);

    // 補給品だけで積載容量を超えていないか確認
    const totalSupplies = supply.food + supply.water;
    if (totalSupplies > ship.capacity) {
        return null; // 補給品だけで容量オーバー
    }

    // 補給品コスト計算
    const foodPrice = getPrice('food', fromPort, true);
    const waterPrice = getPrice('water', fromPort, true);
    const supplyCost = supply.food * foodPrice + supply.water * waterPrice;

    // 資金から補給品コストを引いた残りで商品を購入
    let availableGold = currentGold - supplyCost;
    if (availableGold < 0) {
        return null; // 補給品すら買えない
    }

    // 利用可能な積載容量を計算（補給品を除く）
    const availableCapacity = ship.capacity - totalSupplies;

    // 出発港で荷物を購入
    let totalCost = supplyCost;
    const purchasedCargo = {};

    for (const [goodId, quantity] of Object.entries(cargo)) {
        // 実際に購入できる数量を計算
        const price = getPrice(goodId, fromPort, true);
        const affordableQty = Math.floor(availableGold / price);
        const actualQty = Math.min(quantity, affordableQty, availableCapacity);

        if (actualQty <= 0) continue;

        const cost = price * actualQty;
        totalCost += cost;
        availableGold -= cost;
        purchasedCargo[goodId] = { quantity: actualQty, price, cost };
    }

    // 到着港で荷物を売却
    let totalRevenue = 0;
    const soldCargo = {};

    for (const [goodId, data] of Object.entries(purchasedCargo)) {
        const sellPrice = getPrice(goodId, toPort, false);
        const revenue = sellPrice * data.quantity;
        totalRevenue += revenue;
        soldCargo[goodId] = { quantity: data.quantity, price: sellPrice, revenue };
    }

    const profit = totalRevenue - totalCost;
    const newGold = currentGold - totalCost + totalRevenue;

    return {
        fromPort,
        toPort,
        purchased: purchasedCargo,
        sold: soldCargo,
        supply: { ...supply, cost: supplyCost },
        totalCost,
        totalRevenue,
        profit,
        newGold,
        days: supply.days
    };
}

// 最適な船へのアップグレードを判断
function shouldUpgradeShip(currentShip, gold) {
    const currentIndex = shipUpgrades.findIndex(s => s.name === currentShip.name);
    if (currentIndex >= shipUpgrades.length - 1) return null;

    const nextShip = shipUpgrades[currentIndex + 1];
    if (gold >= nextShip.cost * 1.5) { // 余裕を持ってアップグレード
        return nextShip;
    }
    return null;
}

// 資金と容量に応じた購入可能な商品数を計算
function calculateAffordableQuantity(goodId, portId, availableGold, maxCapacity) {
    if (availableGold <= 0 || maxCapacity <= 0) {
        return 0;
    }
    const price = getPrice(goodId, portId, true);
    const affordableQty = Math.floor(availableGold / price);
    return Math.max(0, Math.min(affordableQty, maxCapacity));
}

// 戦略1: 初心者戦略（短距離・低リスク）
function beginnerStrategy(voyageNum, ship, gold, currentPort) {
    let from, to, goodId;

    if (currentPort === 'lisbon') {
        from = 'lisbon';
        to = 'seville';
        goodId = 'wine';
    } else {
        from = 'seville';
        to = 'lisbon';
        goodId = 'gold_ore';
    }

    const supply = calculateSupplyCost(from, to, ship);
    const foodPrice = getPrice('food', from, true);
    const waterPrice = getPrice('water', from, true);
    const supplyCost = supply.food * foodPrice + supply.water * waterPrice;

    const availableGold = gold - supplyCost - 50; // 50Gは安全マージン
    const totalSupplies = supply.food + supply.water;
    const availableCapacity = ship.capacity - totalSupplies;

    const quantity = calculateAffordableQuantity(goodId, from, availableGold, availableCapacity);

    return {
        from: from,
        to: to,
        cargo: { [goodId]: quantity }
    };
}

// 戦略2: 中級戦略（スパイス取引）
function intermediateStrategy(voyageNum, ship, gold, currentPort) {
    let from, to, goodId;

    if (currentPort === 'lisbon') {
        from = 'lisbon';
        to = 'calicut';
        goodId = 'cloth';
    } else {
        from = 'calicut';
        to = 'lisbon';
        goodId = 'spices';
    }

    const supply = calculateSupplyCost(from, to, ship);
    const foodPrice = getPrice('food', from, true);
    const waterPrice = getPrice('water', from, true);
    const supplyCost = supply.food * foodPrice + supply.water * waterPrice;

    const availableGold = gold - supplyCost - 100;
    const totalSupplies = supply.food + supply.water;
    const availableCapacity = ship.capacity - totalSupplies;

    const quantity = calculateAffordableQuantity(goodId, from, availableGold, availableCapacity);

    return {
        from: from,
        to: to,
        cargo: { [goodId]: quantity }
    };
}

// 戦略3: 上級戦略（最適化ルート）
function advancedStrategy(voyageNum, ship, gold, currentPort) {
    let from, to, goodId;

    if (currentPort === 'calicut') {
        from = 'calicut';
        to = 'lisbon';
        goodId = 'spices';
    } else if (currentPort === 'lisbon') {
        from = 'lisbon';
        to = 'nagasaki';
        goodId = 'cloth';
    } else { // nagasaki
        from = 'nagasaki';
        to = 'calicut';
        goodId = 'silver';
    }

    const supply = calculateSupplyCost(from, to, ship);
    const foodPrice = getPrice('food', from, true);
    const waterPrice = getPrice('water', from, true);
    const supplyCost = supply.food * foodPrice + supply.water * waterPrice;

    const availableGold = gold - supplyCost - 200;
    const totalSupplies = supply.food + supply.water;
    const availableCapacity = ship.capacity - totalSupplies;

    const quantity = calculateAffordableQuantity(goodId, from, availableGold, availableCapacity);

    return {
        from: from,
        to: to,
        cargo: { [goodId]: quantity }
    };
}

// シミュレーション実行
function runSimulation(strategyName, strategyFunc, maxVoyages = 15, startPort = 'lisbon') {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 ${strategyName} シミュレーション`);
    console.log(`${'='.repeat(80)}\n`);

    let gold = 1000;
    let ship = { ...shipUpgrades[0] };
    let totalDays = 0;
    let voyageResults = [];

    let currentPort = startPort;

    for (let i = 0; i < maxVoyages; i++) {
        const route = strategyFunc(i, ship, gold, currentPort);

        // 積荷がない場合はスキップ
        if (!route.cargo || Object.values(route.cargo).every(q => q === 0)) {
            console.log(`❌ 航海 ${i + 1}: 資金不足で商品を購入できません`);
            break;
        }

        const result = simulateVoyage(route.from, route.to, route.cargo, ship, gold);

        if (!result) {
            console.log(`❌ 航海 ${i + 1}: 資金不足で航海できませんでした`);
            break;
        }

        gold = result.newGold;
        totalDays += result.days;
        voyageResults.push(result);
        currentPort = result.toPort;

        // 結果表示
        const cargoDesc = Object.entries(route.cargo)
            .map(([goodId, qty]) => `${goods[goodId].name}×${qty}`)
            .join(', ');

        console.log(`\n🚢 航海 ${i + 1}: ${result.fromPort.toUpperCase()} → ${result.toPort.toUpperCase()}`);
        console.log(`   船: ${ship.name} (容量${ship.capacity}, 速度${ship.speed}x)`);
        console.log(`   積荷: ${cargoDesc}`);
        console.log(`   日数: ${result.days}日`);
        console.log(`   購入費: ${result.totalCost.toLocaleString()}G (補給品: ${result.supply.cost}G)`);
        console.log(`   売上: ${result.totalRevenue.toLocaleString()}G`);
        console.log(`   利益: ${result.profit >= 0 ? '+' : ''}${result.profit.toLocaleString()}G`);
        console.log(`   資金: ${gold.toLocaleString()}G`);

        // 船のアップグレードチェック
        const upgrade = shouldUpgradeShip(ship, gold);
        if (upgrade) {
            gold -= upgrade.cost;
            ship = { ...upgrade };
            console.log(`\n   ⬆️  船をアップグレード: ${ship.name} (費用: ${upgrade.cost.toLocaleString()}G)`);
            console.log(`   新しい資金: ${gold.toLocaleString()}G`);
        }
    }

    // サマリー
    const totalProfit = gold - 1000;
    const avgProfitPerVoyage = totalProfit / voyageResults.length;
    const avgProfitPerDay = totalProfit / totalDays;

    console.log(`\n${'-'.repeat(80)}`);
    console.log(`📈 サマリー`);
    console.log(`${'-'.repeat(80)}`);
    console.log(`航海回数: ${voyageResults.length}回`);
    console.log(`総日数: ${totalDays}日`);
    console.log(`最終資金: ${gold.toLocaleString()}G`);
    console.log(`総利益: ${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()}G`);
    console.log(`航海あたり平均利益: ${avgProfitPerVoyage >= 0 ? '+' : ''}${avgProfitPerVoyage.toFixed(0)}G`);
    console.log(`1日あたり平均利益: ${avgProfitPerDay >= 0 ? '+' : ''}${avgProfitPerDay.toFixed(1)}G`);
    console.log(`最終船: ${ship.name}`);

    return {
        strategyName,
        voyageCount: voyageResults.length,
        totalDays,
        finalGold: gold,
        totalProfit,
        avgProfitPerVoyage,
        avgProfitPerDay,
        finalShip: ship.name
    };
}

// メイン実行
console.log('\n🌊 大航海時代 - 利益シミュレーション 🌊');
console.log('各戦略でどのように利益が積み上がるかシミュレートします\n');

const results = [];

// 初心者戦略
results.push(runSimulation('初心者戦略（短距離往復）', beginnerStrategy, 15, 'lisbon'));

// 中級戦略
results.push(runSimulation('中級戦略（スパイス取引）', intermediateStrategy, 15, 'lisbon'));

// 上級戦略
results.push(runSimulation('上級戦略（3港循環ルート）', advancedStrategy, 15, 'calicut'));

// 最終比較
console.log(`\n${'='.repeat(80)}`);
console.log(`🏆 戦略比較サマリー`);
console.log(`${'='.repeat(80)}\n`);

console.log('戦略名                       | 航海数 | 日数  | 最終資金     | 総利益       | 1日平均');
console.log('-'.repeat(80));

results.forEach(r => {
    const name = r.strategyName.padEnd(28);
    const voyages = r.voyageCount.toString().padStart(3);
    const days = r.totalDays.toString().padStart(4);
    const gold = r.finalGold.toLocaleString().padStart(9);
    const profit = (r.totalProfit >= 0 ? '+' : '') + r.totalProfit.toLocaleString().padStart(9);
    const perDay = (r.avgProfitPerDay >= 0 ? '+' : '') + r.avgProfitPerDay.toFixed(1).padStart(6);

    console.log(`${name} | ${voyages}回 | ${days}日 | ${gold}G | ${profit}G | ${perDay}G`);
});

console.log('\n💡 推奨プレイ方法:');
console.log('   1. 最初は短距離で資金を貯める（リスボン↔セビリア）');
console.log('   2. 5,000G貯まったらキャラック船にアップグレード');
console.log('   3. スパイス取引を開始（カリカット↔リスボン）');
console.log('   4. 15,000G以上になったらガレオン船を目指す');
console.log('   5. 長距離の最適化ルートで大きな利益を狙う\n');
