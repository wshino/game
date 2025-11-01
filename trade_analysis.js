// リスボン-セビリア間の貿易収益性分析

// 商品定義
const goods = {
    wine: { name: 'ワイン', basePrice: 50 },
    cloth: { name: '織物', basePrice: 80 },
    spices: { name: '香辛料', basePrice: 150 },
    silk: { name: '絹', basePrice: 200 },
    gold_ore: { name: '金鉱石', basePrice: 300 },
    porcelain: { name: '陶器', basePrice: 120 },
    tea: { name: '茶', basePrice: 100 },
    silver: { name: '銀', basePrice: 250 },
};

// 港の価格倍率
const portPrices = {
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.0, silk: 1.8, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4, food: 1.0, water: 1.0 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.8, silk: 1.7, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3, food: 0.9, water: 0.9 }
};

// 船の定義
const ships = {
    caravel: { name: 'カラベル船', capacity: 100, speed: 1.0, crew: 20, cost: 0 },
    carrack: { name: 'キャラック船', capacity: 200, speed: 1.2, crew: 40, cost: 5000 }
};

// 距離
const distance = 2; // リスボン-セビリア間は2日

// 価格計算（平均値を使用）
function calculatePrice(goodId, portId, isBuying = true) {
    const good = goods[goodId];
    const multiplier = portPrices[portId][goodId];
    const basePrice = good.basePrice * multiplier;
    // 売却時は0.8倍
    return isBuying ? basePrice : basePrice * 0.8;
}

// 往復貿易の利益計算
function calculateRoundTripProfit(goodId, fromPort, toPort, ship) {
    const buyPrice = calculatePrice(goodId, fromPort, true);
    const sellPrice = calculatePrice(goodId, toPort, false);
    const profitPerUnit = sellPrice - buyPrice;
    const profitMargin = buyPrice > 0 ? (profitPerUnit / buyPrice) * 100 : 0;

    // 移動時間
    const travelDays = Math.max(1, Math.round(distance / ship.speed));
    const roundTripDays = travelDays * 2;

    // 物資消費（片道分のみ積載、帰りは目的地で補給）
    const foodNeededOneWay = ship.crew * travelDays;
    const waterNeededOneWay = ship.crew * travelDays;

    // 往復の総物資コスト（出発港と目的港で補給）
    const foodCostFrom = 2 * (portPrices[fromPort].food || 1.0);
    const waterCostFrom = 1 * (portPrices[fromPort].water || 1.0);
    const foodCostTo = 2 * (portPrices[toPort].food || 1.0);
    const waterCostTo = 1 * (portPrices[toPort].water || 1.0);

    const supplyOneWayCost = (foodNeededOneWay * foodCostFrom) + (waterNeededOneWay * waterCostFrom);
    const supplyReturnCost = (foodNeededOneWay * foodCostTo) + (waterNeededOneWay * waterCostTo);
    const supplyCost = supplyOneWayCost + supplyReturnCost;

    // 最大積載量（片道分の物資を除く）
    const totalSuppliesOneWay = foodNeededOneWay + waterNeededOneWay;
    const cargoSpace = ship.capacity - totalSuppliesOneWay;
    const maxUnits = Math.max(0, Math.floor(cargoSpace));

    // 総利益
    const grossProfit = profitPerUnit * maxUnits;
    const netProfit = grossProfit - supplyCost;

    return {
        goodName: goods[goodId].name,
        buyPrice: Math.round(buyPrice),
        sellPrice: Math.round(sellPrice),
        profitPerUnit: Math.round(profitPerUnit),
        profitMargin: Math.round(profitMargin * 10) / 10,
        maxUnits,
        grossProfit: Math.round(grossProfit),
        supplyCost: Math.round(supplyCost),
        netProfit: Math.round(netProfit),
        days: roundTripDays,
        profitPerDay: Math.round(netProfit / roundTripDays)
    };
}

// 全商品の分析
function analyzeAllGoods(fromPort, toPort, ship) {
    console.log(`\n========== ${ship.name} ==========`);
    console.log(`航路: ${fromPort.toUpperCase()} → ${toPort.toUpperCase()} → ${fromPort.toUpperCase()}`);
    console.log(`船: ${ship.name} (積載${ship.capacity}, 速度${ship.speed}x, 乗員${ship.crew}人)`);
    console.log('');

    const results = [];

    for (const goodId in goods) {
        if (goodId === 'food' || goodId === 'water') continue;

        const result = calculateRoundTripProfit(goodId, fromPort, toPort, ship);
        results.push({ goodId, ...result });
    }

    // 純利益の高い順にソート
    results.sort((a, b) => b.netProfit - a.netProfit);

    console.log('商品名\t\t購入\t売却\t単利益\t利益率\t積載\t総利益\t物資\t純利益\t日数\t日利');
    console.log('─'.repeat(100));

    for (const r of results) {
        console.log(
            `${r.goodName}\t\t` +
            `${r.buyPrice}G\t` +
            `${r.sellPrice}G\t` +
            `${r.profitPerUnit}G\t` +
            `${r.profitMargin}%\t` +
            `${r.maxUnits}\t` +
            `${r.grossProfit}G\t` +
            `${r.supplyCost}G\t` +
            `${r.netProfit}G\t` +
            `${r.days}日\t` +
            `${r.profitPerDay}G/日`
        );
    }

    return results;
}

// セビリア→リスボンの分析
console.log('\n\n╔═══════════════════════════════════════════════╗');
console.log('║  リスボン-セビリア間 貿易収益性分析        ║');
console.log('╚═══════════════════════════════════════════════╝');

console.log('\n【ルート1: セビリア → リスボン → セビリア】');
const sevillaToLisbonCaravel = analyzeAllGoods('seville', 'lisbon', ships.caravel);
const sevillaToLisbonCarrack = analyzeAllGoods('seville', 'lisbon', ships.carrack);

console.log('\n【ルート2: リスボン → セビリア → リスボン】');
const lisbonToSevillaCaravel = analyzeAllGoods('lisbon', 'seville', ships.caravel);
const lisbonToSevillaCarrack = analyzeAllGoods('lisbon', 'seville', ships.carrack);

// 比較サマリー
console.log('\n\n╔═══════════════════════════════════════════════╗');
console.log('║  最適戦略の比較                               ║');
console.log('╚═══════════════════════════════════════════════╝');

console.log('\n【カラベル船 vs キャラック船】');
const bestCaravelRoute = Math.max(
    sevillaToLisbonCaravel[0].netProfit,
    lisbonToSevillaCaravel[0].netProfit
);
const bestCarrackRoute = Math.max(
    sevillaToLisbonCarrack[0].netProfit,
    lisbonToSevillaCarrack[0].netProfit
);

console.log(`カラベル船の最大利益: ${bestCaravelRoute}G`);
console.log(`キャラック船の最大利益: ${bestCarrackRoute}G`);
console.log(`差額: ${bestCarrackRoute - bestCaravelRoute}G`);
console.log(`キャラック船への投資回収: ${Math.ceil(ships.carrack.cost / (bestCarrackRoute - bestCaravelRoute))}往復`);
