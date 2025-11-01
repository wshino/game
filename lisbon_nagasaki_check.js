// リスボン→長崎のワイン貿易の実行可能性チェック

const goods = {
    wine: { name: 'ワイン', basePrice: 50 },
    food: { name: '食糧', basePrice: 2 },
    water: { name: '水', basePrice: 1 }
};

const portPrices = {
    lisbon: { wine: 0.8, food: 1.0, water: 1.0 },
    nagasaki: { wine: 1.8, food: 1.3, water: 1.2 }
};

const ship = { name: 'カラベル船', capacity: 100, speed: 1.0, crew: 20 };
const distance = 30; // リスボン→長崎は30日
const INITIAL_GOLD = 1000;

function calculatePrice(goodId, portId, isBuying = true) {
    const good = goods[goodId];
    const multiplier = portPrices[portId][goodId];
    const basePrice = good.basePrice * multiplier;
    return isBuying ? basePrice : basePrice * 0.8;
}

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  リスボン → 長崎 ワイン貿易の実行可能性             ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

const travelDays = Math.max(1, Math.round(distance / ship.speed)); // 30日

// 物資計算
const foodNeeded = ship.crew * travelDays; // 20人 × 30日 = 600個
const waterNeeded = ship.crew * travelDays; // 20人 × 30日 = 600個

console.log(`航海日数: ${travelDays}日`);
console.log(`必要物資: 食糧${foodNeeded}個、水${waterNeeded}個`);
console.log(`物資の総量: ${foodNeeded + waterNeeded}個\n`);

// 物資コスト
const foodCost = calculatePrice('food', 'lisbon', true);
const waterCost = calculatePrice('water', 'lisbon', true);
const supplyCost = (foodNeeded * foodCost) + (waterNeeded * waterCost);

console.log(`物資コスト:`);
console.log(`  食糧: ${foodNeeded}個 × ${foodCost}G = ${foodNeeded * foodCost}G`);
console.log(`  水: ${waterNeeded}個 × ${waterCost}G = ${waterNeeded * waterCost}G`);
console.log(`  合計: ${Math.round(supplyCost)}G\n`);

// 積載スペース
const totalSupplies = foodNeeded + waterNeeded;
const cargoSpace = ship.capacity - totalSupplies;

console.log(`船の積載量: ${ship.capacity}個`);
console.log(`物資で使用: ${totalSupplies}個`);
console.log(`残りスペース: ${cargoSpace}個\n`);

if (cargoSpace < 0) {
    console.log('❌ 物資だけで積載量オーバー！このルートは実行不可能です！\n');
    console.log(`【結論】`);
    console.log(`リスボン→長崎ルートはカラベル船では物理的に不可能です。`);
    console.log(`物資だけで${totalSupplies}個必要ですが、船の積載量は${ship.capacity}個しかありません。`);
    process.exit(0);
}

// ワインの購入
const wineBuyPrice = calculatePrice('wine', 'lisbon', true);
const wineSellPrice = calculatePrice('wine', 'nagasaki', false);

const remainingGold = INITIAL_GOLD - supplyCost;
const maxWineCanBuy = Math.floor(Math.min(remainingGold / wineBuyPrice, cargoSpace));

console.log(`【ワイン貿易】`);
console.log(`購入価格: ${Math.round(wineBuyPrice)}G/個`);
console.log(`売却価格: ${Math.round(wineSellPrice)}G/個`);
console.log(`単位利益: ${Math.round(wineSellPrice - wineBuyPrice)}G/個\n`);

console.log(`物資購入後の残金: ${Math.round(remainingGold)}G`);
console.log(`購入可能数: ${maxWineCanBuy}個\n`);

if (maxWineCanBuy <= 0) {
    console.log('❌ 資金不足でワインを購入できません！\n');
} else {
    const wineCost = maxWineCanBuy * wineBuyPrice;
    const wineRevenue = maxWineCanBuy * wineSellPrice;
    const grossProfit = wineRevenue - wineCost;

    // 帰りの物資コスト
    const returnFoodCost = calculatePrice('food', 'nagasaki', true);
    const returnWaterCost = calculatePrice('water', 'nagasaki', true);
    const returnSupplyCost = (foodNeeded * returnFoodCost) + (waterNeeded * returnWaterCost);

    const netProfit = grossProfit - returnSupplyCost;
    const finalGold = INITIAL_GOLD + netProfit;

    console.log(`ワイン購入費: ${Math.round(wineCost)}G`);
    console.log(`ワイン売却収入: ${Math.round(wineRevenue)}G`);
    console.log(`ワインの粗利: ${Math.round(grossProfit)}G\n`);

    console.log(`帰りの物資コスト:`);
    console.log(`  食糧: ${foodNeeded}個 × ${returnFoodCost}G = ${Math.round(foodNeeded * returnFoodCost)}G`);
    console.log(`  水: ${waterNeeded}個 × ${returnWaterCost}G = ${Math.round(waterNeeded * returnWaterCost)}G`);
    console.log(`  合計: ${Math.round(returnSupplyCost)}G\n`);

    console.log(`純利益: ${Math.round(netProfit)}G`);
    console.log(`最終資金: ${Math.round(finalGold)}G`);
    console.log(`往復日数: ${travelDays * 2}日`);
    console.log(`日利: ${Math.round(netProfit / (travelDays * 2))}G/日\n`);
}

console.log('─'.repeat(60));
console.log('【結論】');
console.log('─'.repeat(60));

if (cargoSpace < 0) {
    console.log('❌ 物資だけで船が満杯になり、商品を積めません');
} else if (maxWineCanBuy <= 0) {
    console.log('❌ 物資購入後に資金が不足し、ワインを買えません');
} else if (remainingGold < 0) {
    console.log('❌ 物資を買う資金すらありません');
} else {
    const netProfit = (maxWineCanBuy * wineSellPrice) - (maxWineCanBuy * wineBuyPrice) - ((foodNeeded * calculatePrice('food', 'nagasaki', true)) + (waterNeeded * calculatePrice('water', 'nagasaki', true)));
    if (netProfit > 0) {
        console.log('✅ このルートは実行可能で、利益が出ます');
    } else {
        console.log('❌ このルートは実行できますが、損失が出ます');
    }
}
