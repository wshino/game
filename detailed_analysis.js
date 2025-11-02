// 詳細なバランス問題分析スクリプト

// ゲームデータの定義
const ports = {
    lisbon: { name: 'リスボン', size: 'large' },
    seville: { name: 'セビリア', size: 'large' },
    venice: { name: 'ヴェネツィア', size: 'very_large' },
    alexandria: { name: 'アレクサンドリア', size: 'medium' },
    calicut: { name: 'カリカット', size: 'medium' },
    malacca: { name: 'マラッカ', size: 'medium' },
    nagasaki: { name: '長崎', size: 'small' }
};

const goods = {
    wine: { name: 'ワイン', basePrice: 50 },
    cloth: { name: '織物', basePrice: 80 },
    spices: { name: '香辛料', basePrice: 150 },
    silk: { name: '絹', basePrice: 200 },
    gold_ore: { name: '金鉱石', basePrice: 300 },
    porcelain: { name: '陶器', basePrice: 120 },
    tea: { name: '茶', basePrice: 100 },
    silver: { name: '銀', basePrice: 250 },
    food: { name: '食糧', basePrice: 2 },
    water: { name: '水', basePrice: 1 }
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

const portPrices = {
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.0, silk: 1.8, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4, food: 1.0, water: 1.0 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.8, silk: 1.7, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3, food: 0.9, water: 0.9 },
    venice: { wine: 1.1, cloth: 0.7, spices: 1.5, silk: 1.3, gold_ore: 1.6, porcelain: 1.4, tea: 1.4, silver: 1.5, food: 1.1, water: 1.0 },
    alexandria: { wine: 1.2, cloth: 1.1, spices: 0.9, silk: 1.2, gold_ore: 1.4, porcelain: 1.3, tea: 1.2, silver: 1.4, food: 1.2, water: 1.3 },
    calicut: { wine: 1.5, cloth: 1.3, spices: 0.6, silk: 1.0, gold_ore: 1.3, porcelain: 1.2, tea: 0.9, silver: 1.2, food: 1.0, water: 1.1 },
    malacca: { wine: 1.6, cloth: 1.4, spices: 0.8, silk: 0.9, gold_ore: 1.2, porcelain: 1.0, tea: 0.8, silver: 1.1, food: 1.1, water: 1.2 },
    nagasaki: { wine: 1.8, cloth: 1.5, spices: 1.3, silk: 0.7, gold_ore: 1.5, porcelain: 0.8, tea: 0.7, silver: 0.6, food: 1.3, water: 1.2 }
};

const shipUpgrades = [
    { name: 'カラベル船', capacity: 100, speed: 1, cost: 0, crew: 20 },
    { name: 'キャラック船', capacity: 200, speed: 1.2, cost: 5000, crew: 40 },
    { name: 'ガレオン船', capacity: 300, speed: 1.5, cost: 15000, crew: 60 },
    { name: '東インド会社船', capacity: 500, speed: 2, cost: 50000, crew: 100 }
];

function getPrice(portId, goodId, isBuying = true) {
    const good = goods[goodId];
    const multiplier = portPrices[portId][goodId];
    const basePrice = good.basePrice * multiplier;
    const price = Math.round(basePrice * 0.95);
    return isBuying ? price : Math.round(price * 0.8);
}

function calculateRequiredSupplies(ship, days) {
    const crew = ship.crew;
    return {
        food: Math.ceil(crew * days * 0.08),
        water: Math.ceil(crew * days * 0.08)
    };
}

console.log('='.repeat(80));
console.log('詳細なゲームバランス分析');
console.log('='.repeat(80));
console.log('');

// 問題1: 遠距離航路の物資コスト分析
console.log('【問題1】遠距離航路の物資コスト分析');
console.log('-'.repeat(80));

for (const ship of shipUpgrades) {
    console.log(`\n■ ${ship.name} (積載量: ${ship.capacity}, 速度: ${ship.speed}x, 乗員: ${ship.crew})`);
    console.log('');

    const problematicRoutes = [];

    for (const fromPort in ports) {
        for (const toPort in ports) {
            if (fromPort === toPort) continue;

            const baseDays = portDistances[fromPort][toPort];
            const travelDays = Math.max(1, Math.round(baseDays / ship.speed));
            const required = calculateRequiredSupplies(ship, travelDays);

            const foodPrice = getPrice(fromPort, 'food', true);
            const waterPrice = getPrice(fromPort, 'water', true);
            const supplyCost = (required.food * foodPrice) + (required.water * waterPrice);

            const supplySpace = required.food + required.water;
            const remainingCapacity = ship.capacity - supplySpace;
            const supplyPercentage = (supplySpace / ship.capacity) * 100;

            // 問題があるルート: 物資が積載量の30%以上を占める、または残りが10以下
            if (supplyPercentage > 30 || remainingCapacity < 10) {
                problematicRoutes.push({
                    route: `${ports[fromPort].name} → ${ports[toPort].name}`,
                    days: travelDays,
                    foodNeeded: required.food,
                    waterNeeded: required.water,
                    totalSupply: supplySpace,
                    capacity: ship.capacity,
                    remaining: remainingCapacity,
                    percentage: supplyPercentage,
                    cost: supplyCost
                });
            }
        }
    }

    if (problematicRoutes.length > 0) {
        problematicRoutes.sort((a, b) => b.percentage - a.percentage);
        console.log(`  ⚠️  物資負担が大きいルート (${problematicRoutes.length}件):`);
        for (const route of problematicRoutes.slice(0, 10)) {
            console.log(`    ${route.route}:`);
            console.log(`      日数: ${route.days}日, 物資: 食糧${route.foodNeeded}+水${route.waterNeeded}=${route.totalSupply} (${route.percentage.toFixed(1)}%)`);
            console.log(`      残り積載量: ${route.remaining}/${route.capacity}, コスト: ${route.cost}G`);
        }
    } else {
        console.log('  ✅ すべてのルートが物資面で問題なし');
    }
}

console.log('');
console.log('【問題2】初期資金からの成長速度分析');
console.log('-'.repeat(80));

// 初期状態での最適ルートを分析
const initialGold = 1000;
const initialShip = shipUpgrades[0];

console.log(`\n初期状態: 資金${initialGold}G, ${initialShip.name}`);
console.log('');

const profitableRoutes = [];

for (const fromPort in ports) {
    for (const toPort in ports) {
        if (fromPort === toPort) continue;

        const baseDays = portDistances[fromPort][toPort];
        const travelDays = Math.max(1, Math.round(baseDays / initialShip.speed));
        const required = calculateRequiredSupplies(initialShip, travelDays);

        const foodPrice = getPrice(fromPort, 'food', true);
        const waterPrice = getPrice(fromPort, 'water', true);
        const supplyCost = (required.food * foodPrice) + (required.water * waterPrice);

        for (const goodId in goods) {
            if (goodId === 'food' || goodId === 'water') continue;

            const buyPrice = getPrice(fromPort, goodId, true);
            const sellPrice = getPrice(toPort, goodId, false);
            const profitPerUnit = sellPrice - buyPrice;

            if (profitPerUnit <= 0) continue;

            const availableGold = initialGold - supplyCost;
            if (availableGold < buyPrice) continue;

            const maxByMoney = Math.floor(availableGold / buyPrice);
            const supplySpace = required.food + required.water;
            const maxByCargo = initialShip.capacity - supplySpace;

            if (maxByCargo < 1) continue;

            const maxQuantity = Math.min(maxByMoney, maxByCargo);
            const totalProfit = maxQuantity * profitPerUnit;
            const profitPerDay = totalProfit / travelDays;
            const roi = (totalProfit / initialGold) * 100;

            profitableRoutes.push({
                from: ports[fromPort].name,
                to: ports[toPort].name,
                good: goods[goodId].name,
                days: travelDays,
                quantity: maxQuantity,
                buyPrice,
                sellPrice,
                profitPerUnit,
                totalProfit,
                profitPerDay,
                roi,
                supplyCost,
                totalCost: (maxQuantity * buyPrice) + supplyCost
            });
        }
    }
}

profitableRoutes.sort((a, b) => b.totalProfit - a.totalProfit);

console.log('初期資金で実行可能な最も利益の高いルートTOP10:');
for (const route of profitableRoutes.slice(0, 10)) {
    console.log(`  ${route.from} → ${route.to}: ${route.good}`);
    console.log(`    数量: ${route.quantity}個, 日数: ${route.days}日`);
    console.log(`    総利益: ${route.totalProfit}G, ROI: ${route.roi.toFixed(1)}%, 日毎利益: ${route.profitPerDay.toFixed(1)}G`);
    console.log(`    コスト: 商品${route.quantity * route.buyPrice}G + 物資${route.supplyCost}G = ${route.totalCost}G`);
}

// 5000Gに到達するのに必要な取引回数を計算
console.log('');
console.log('5000Gに到達するために必要な取引回数の推定:');
const bestRoute = profitableRoutes[0];
let currentGold = initialGold;
let currentDay = 0;
let trades = 0;

while (currentGold < 5000 && trades < 50) {
    trades++;
    currentGold += bestRoute.totalProfit;
    currentDay += bestRoute.days;
}

console.log(`  最適ルート(${bestRoute.from}→${bestRoute.to}: ${bestRoute.good})を繰り返すと:`);
console.log(`    取引回数: ${trades}回`);
console.log(`    経過日数: ${currentDay}日`);
console.log(`    最終資金: ${currentGold}G`);

if (currentDay > 100) {
    console.log(`  ⚠️  100日以内に5000Gに到達するのは困難（推定${currentDay}日）`);
} else {
    console.log(`  ✅ 100日以内に5000Gに到達可能`);
}

console.log('');
console.log('【問題3】長崎への到達可能性分析');
console.log('-'.repeat(80));

for (const ship of shipUpgrades) {
    console.log(`\n■ ${ship.name}`);

    const fromPorts = ['lisbon', 'seville', 'venice', 'alexandria', 'calicut', 'malacca'];

    for (const fromPort of fromPorts) {
        const baseDays = portDistances[fromPort]['nagasaki'];
        const travelDays = Math.max(1, Math.round(baseDays / ship.speed));
        const required = calculateRequiredSupplies(ship, travelDays);

        const supplySpace = required.food + required.water;
        const remainingCapacity = ship.capacity - supplySpace;
        const supplyPercentage = (supplySpace / ship.capacity) * 100;

        const status = remainingCapacity >= 10 ? '✅' : '⚠️';
        console.log(`  ${status} ${ports[fromPort].name} → 長崎:`);
        console.log(`      日数: ${travelDays}日, 物資: ${supplySpace}個 (${supplyPercentage.toFixed(1)}%), 残り: ${remainingCapacity}個`);
    }
}

console.log('');
console.log('【問題4】各船のアップグレードコスト対効果分析');
console.log('-'.repeat(80));

for (let i = 1; i < shipUpgrades.length; i++) {
    const prevShip = shipUpgrades[i - 1];
    const newShip = shipUpgrades[i];

    console.log(`\n■ ${prevShip.name} → ${newShip.name}`);
    console.log(`  コスト: ${newShip.cost}G`);
    console.log(`  積載量: ${prevShip.capacity} → ${newShip.capacity} (+${newShip.capacity - prevShip.capacity})`);
    console.log(`  速度: ${prevShip.speed}x → ${newShip.speed}x (+${((newShip.speed - prevShip.speed) / prevShip.speed * 100).toFixed(1)}%)`);
    console.log(`  乗員: ${prevShip.crew} → ${newShip.crew} (+${newShip.crew - prevShip.crew})`);

    // 1日あたりの物資消費増加
    const supplyIncrease = (newShip.crew - prevShip.crew) * 0.08 * 2; // food + water
    console.log(`  1日あたりの物資消費増加: ${supplyIncrease.toFixed(1)}個`);

    // 利益増加の推定（積載量と速度の改善）
    const capacityMultiplier = newShip.capacity / prevShip.capacity;
    const speedMultiplier = newShip.speed / prevShip.speed;
    const effectiveMultiplier = capacityMultiplier * speedMultiplier;

    console.log(`  効率向上: ${((effectiveMultiplier - 1) * 100).toFixed(1)}%`);

    // 投資回収に必要な取引数の推定
    const avgProfit = 200; // 1取引あたりの平均利益（仮）
    const profitIncrease = avgProfit * (effectiveMultiplier - 1);
    const tradesNeeded = Math.ceil(newShip.cost / profitIncrease);

    console.log(`  推定投資回収取引数: ${tradesNeeded}回 (1取引+${(profitIncrease).toFixed(0)}Gの増益と仮定)`);
}

console.log('');
console.log('【問題5】小規模港（長崎）の在庫制限影響分析');
console.log('-'.repeat(80));

const nagasakiMaxStock = 30;
const nagasakiRefreshRate = 3;

console.log(`\n長崎の在庫設定: 最大${nagasakiMaxStock}個, 回復速度${nagasakiRefreshRate}個/日`);
console.log('');

for (const ship of shipUpgrades) {
    console.log(`■ ${ship.name} (積載量: ${ship.capacity})`);

    // 長崎で満載できるか
    const canFillShip = nagasakiMaxStock >= ship.capacity / 2; // 半分以上積めるか

    if (canFillShip) {
        console.log(`  ✅ 在庫制限の影響は小さい（積載量の半分以上を購入可能）`);
    } else {
        const possibleLoad = (nagasakiMaxStock / ship.capacity) * 100;
        console.log(`  ⚠️  在庫制限の影響あり（積載量の${possibleLoad.toFixed(1)}%しか購入できない）`);

        // 在庫回復待ち時間
        const neededStock = ship.capacity / 2;
        const additionalNeeded = neededStock - nagasakiMaxStock;
        if (additionalNeeded > 0) {
            const waitDays = Math.ceil(additionalNeeded / nagasakiRefreshRate);
            console.log(`    満載するには${waitDays}日待つ必要がある`);
        }
    }
}

console.log('');
console.log('='.repeat(80));
console.log('分析完了');
console.log('='.repeat(80));
