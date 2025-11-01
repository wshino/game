// リスボンから実際に実行可能な貿易ルートを探す

const goods = {
    wine: { name: 'ワイン', basePrice: 50 },
    cloth: { name: '織物', basePrice: 80 },
    spices: { name: '香辛料', basePrice: 150 },
    silk: { name: '絹', basePrice: 200 },
    gold_ore: { name: '金鉱石', basePrice: 300 },
    porcelain: { name: '陶器', basePrice: 120 },
    tea: { name: '茶', basePrice: 100 },
    silver: { name: '銀', basePrice: 250 }
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
    lisbon: { lisbon: 0, seville: 2, venice: 5, alexandria: 7, calicut: 15, malacca: 20, nagasaki: 30 }
};

const portNames = {
    seville: 'セビリア',
    venice: 'ヴェネツィア',
    alexandria: 'アレクサンドリア',
    calicut: 'カリカット',
    malacca: 'マラッカ',
    nagasaki: '長崎'
};

const ship = { name: 'カラベル船', capacity: 100, speed: 1.0, crew: 20 };
const INITIAL_GOLD = 1000;

function calculatePrice(goodId, portId, isBuying = true) {
    const good = goods[goodId];
    if (!goods[goodId] || !portPrices[portId] || !portPrices[portId][goodId]) {
        return 0;
    }
    const multiplier = portPrices[portId][goodId];
    const basePrice = good.basePrice * multiplier;
    return isBuying ? basePrice : basePrice * 0.8;
}

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  リスボンから実行可能な貿易ルート（初期資金1000G）  ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

const viableRoutes = [];

for (const toPort in portDistances.lisbon) {
    if (toPort === 'lisbon') continue;

    const distance = portDistances.lisbon[toPort];
    const travelDays = Math.max(1, Math.round(distance / ship.speed));

    // 物資計算
    const foodNeeded = ship.crew * travelDays;
    const waterNeeded = ship.crew * travelDays;
    const totalSupplies = foodNeeded + waterNeeded;

    // 物資コスト
    const foodCost = calculatePrice('food', 'lisbon', true);
    const waterCost = calculatePrice('water', 'lisbon', true);
    const supplyCost = (foodNeeded * foodCost) + (waterNeeded * waterCost);

    // 積載スペース
    const cargoSpace = ship.capacity - totalSupplies;

    // 残金
    const remainingGold = INITIAL_GOLD - supplyCost;

    // 物理的・資金的に実行可能かチェック
    if (cargoSpace < 0 || remainingGold < 0) {
        console.log(`❌ ${portNames[toPort]}: 実行不可能（積載スペース: ${cargoSpace}、残金: ${Math.round(remainingGold)}G）`);
        continue;
    }

    // 各商品をチェック
    for (const goodId in goods) {
        const buyPrice = calculatePrice(goodId, 'lisbon', true);
        const sellPrice = calculatePrice(goodId, toPort, false);
        const profitPerUnit = sellPrice - buyPrice;

        if (profitPerUnit <= 0) continue;

        const maxCanBuy = Math.floor(Math.min(remainingGold / buyPrice, cargoSpace));

        if (maxCanBuy > 0) {
            const totalCost = maxCanBuy * buyPrice;
            const totalRevenue = maxCanBuy * sellPrice;
            const grossProfit = totalRevenue - totalCost;

            // 帰りの物資コスト
            const returnFoodCost = calculatePrice('food', toPort, true);
            const returnWaterCost = calculatePrice('water', toPort, true);
            const returnSupplyCost = (foodNeeded * returnFoodCost) + (waterNeeded * returnWaterCost);

            const netProfit = grossProfit - returnSupplyCost;
            const finalGold = INITIAL_GOLD + netProfit;

            viableRoutes.push({
                to: portNames[toPort],
                good: goods[goodId].name,
                distance: travelDays,
                buyPrice: Math.round(buyPrice),
                sellPrice: Math.round(sellPrice),
                maxUnits: maxCanBuy,
                supplyCost: Math.round(supplyCost),
                returnSupplyCost: Math.round(returnSupplyCost),
                netProfit: Math.round(netProfit),
                finalGold: Math.round(finalGold),
                daysTotal: travelDays * 2,
                profitPerDay: Math.round(netProfit / (travelDays * 2))
            });
        }
    }
}

viableRoutes.sort((a, b) => b.netProfit - a.netProfit);

if (viableRoutes.length > 0) {
    console.log(`\n✅ 実行可能なルート: ${viableRoutes.length}件\n`);
    console.log('到着港\t\t商品\t\t距離\t購入数\t物資代\t純利益\t最終資金\t日利');
    console.log('─'.repeat(100));

    for (const r of viableRoutes) {
        console.log(
            `${r.to}\t${r.good}\t\t${r.distance}日\t${r.maxUnits}個\t${r.supplyCost + r.returnSupplyCost}G\t` +
            `${r.netProfit}G\t${r.finalGold}G\t\t${r.profitPerDay}G/日`
        );
    }

    console.log('\n' + '═'.repeat(60));
    console.log('【推奨ルート】');
    console.log('═'.repeat(60));
    const best = viableRoutes[0];
    if (best.netProfit > 0) {
        console.log(`✅ 最適: リスボン → ${best.to} (${best.good})`);
        console.log(`   純利益: ${best.netProfit}G`);
        console.log(`   最終資金: ${best.finalGold}G`);
        console.log(`   日利: ${best.profitPerDay}G/日\n`);
    } else {
        console.log(`⚠️ 全ルートで損失が発生します`);
        console.log(`   最小損失: ${best.netProfit}G (${best.to}の${best.good})\n`);
    }
} else {
    console.log('\n❌ 実行可能なルートが1つもありません！');
    console.log('   ゲームが詰んでいます！\n');
}
