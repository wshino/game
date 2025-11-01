// 初期資金1,000Gでのゲーム進行可能性チェック

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

const portPrices = {
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.0, silk: 1.8, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4, food: 1.0, water: 1.0 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.8, silk: 1.7, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3, food: 0.9, water: 0.9 }
};

const ships = {
    caravel: { name: 'カラベル船', capacity: 100, speed: 1.0, crew: 20 }
};

const distance = 2;
const INITIAL_GOLD = 1000;

function calculatePrice(goodId, portId, isBuying = true) {
    const good = goods[goodId];
    const multiplier = portPrices[portId][goodId];
    const basePrice = good.basePrice * multiplier;
    return isBuying ? basePrice : basePrice * 0.8;
}

// 初期資金での実行可能性チェック
function checkInitialFunds() {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║  初期資金1,000Gでの実行可能性チェック                ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    const ship = ships.caravel;
    const travelDays = Math.max(1, Math.round(distance / ship.speed));

    // 物資コスト計算
    const foodNeeded = ship.crew * travelDays; // 20人 × 2日 = 40個
    const waterNeeded = ship.crew * travelDays; // 20人 × 2日 = 40個

    console.log('【リスボン出発の場合】');
    const foodCostLisbon = calculatePrice('food', 'lisbon', true);
    const waterCostLisbon = calculatePrice('water', 'lisbon', true);
    const supplyCostLisbon = (foodNeeded * foodCostLisbon) + (waterNeeded * waterCostLisbon);
    const cargoSpaceLisbon = ship.capacity - foodNeeded - waterNeeded;

    console.log(`物資コスト: ${Math.round(supplyCostLisbon)}G (食糧${foodNeeded}×${foodCostLisbon}G + 水${waterNeeded}×${waterCostLisbon}G)`);
    console.log(`積載可能スペース: ${cargoSpaceLisbon}個\n`);

    console.log('【セビリア出発の場合】');
    const foodCostSeville = calculatePrice('food', 'seville', true);
    const waterCostSeville = calculatePrice('water', 'seville', true);
    const supplyCostSeville = (foodNeeded * foodCostSeville) + (waterNeeded * waterCostSeville);
    const cargoSpaceSeville = ship.capacity - foodNeeded - waterNeeded;

    console.log(`物資コスト: ${Math.round(supplyCostSeville)}G (食糧${foodNeeded}×${foodCostSeville}G + 水${waterNeeded}×${waterCostSeville}G)`);
    console.log(`積載可能スペース: ${cargoSpaceSeville}個\n`);

    // 各港からの実行可能性チェック
    console.log('═'.repeat(60));
    console.log('【リスボン → セビリア → リスボン】');
    console.log('═'.repeat(60));

    let remainingGold = INITIAL_GOLD - supplyCostLisbon;
    console.log(`物資購入後の残金: ${Math.round(remainingGold)}G\n`);

    const tradeableGoods = [];

    for (const goodId in goods) {
        if (goodId === 'food' || goodId === 'water') continue;

        const buyPrice = calculatePrice(goodId, 'lisbon', true);
        const sellPrice = calculatePrice(goodId, 'seville', false);
        const profitPerUnit = sellPrice - buyPrice;

        const maxCanBuy = Math.floor(Math.min(remainingGold / buyPrice, cargoSpaceLisbon));

        if (maxCanBuy > 0) {
            const totalCost = maxCanBuy * buyPrice;
            const totalRevenue = maxCanBuy * sellPrice;
            const grossProfit = totalRevenue - totalCost;

            // 帰りの物資コスト
            const returnSupplyCost = (foodNeeded * foodCostSeville) + (waterNeeded * waterCostSeville);
            const netProfit = grossProfit - returnSupplyCost;

            tradeableGoods.push({
                goodId,
                name: goods[goodId].name,
                buyPrice: Math.round(buyPrice),
                sellPrice: Math.round(sellPrice),
                profitPerUnit: Math.round(profitPerUnit),
                maxCanBuy,
                totalCost: Math.round(totalCost),
                totalRevenue: Math.round(totalRevenue),
                grossProfit: Math.round(grossProfit),
                returnSupplyCost: Math.round(returnSupplyCost),
                netProfit: Math.round(netProfit),
                finalGold: Math.round(INITIAL_GOLD + netProfit)
            });
        }
    }

    tradeableGoods.sort((a, b) => b.netProfit - a.netProfit);

    console.log('商品\t\t購入価格\t購入可能数\t投資額\t\t収益\t\t純利益\t\t最終資金');
    console.log('─'.repeat(100));

    for (const item of tradeableGoods) {
        console.log(
            `${item.name}\t\t${item.buyPrice}G\t\t${item.maxCanBuy}個\t\t` +
            `${item.totalCost}G\t\t${item.totalRevenue}G\t\t` +
            `${item.netProfit}G\t\t${item.finalGold}G`
        );
    }

    // セビリアからの金鉱石貿易
    console.log('\n' + '═'.repeat(60));
    console.log('【セビリア → リスボン → セビリア（金鉱石貿易）】');
    console.log('═'.repeat(60));

    // ゲーム開始はリスボンなので、セビリアに行くための資金チェック
    console.log('\n⚠️ 注意: ゲーム開始地点はリスボンです');
    console.log('セビリアで金鉱石を買うには、まずセビリアに行く必要があります\n');

    const goldOreBuyPrice = calculatePrice('gold_ore', 'seville', true);
    const goldOreSellPrice = calculatePrice('gold_ore', 'lisbon', false);

    console.log(`セビリアでの金鉱石購入価格: ${Math.round(goldOreBuyPrice)}G/個`);
    console.log(`リスボンでの金鉱石売却価格: ${Math.round(goldOreSellPrice)}G/個`);
    console.log(`単位利益: ${Math.round(goldOreSellPrice - goldOreBuyPrice)}G/個\n`);

    // セビリアでの購入可能数（仮に資金がある場合）
    remainingGold = INITIAL_GOLD - supplyCostSeville;
    const maxGoldOre = Math.floor(Math.min(remainingGold / goldOreBuyPrice, cargoSpaceSeville));

    console.log(`物資購入後の残金: ${Math.round(INITIAL_GOLD - supplyCostSeville)}G`);
    console.log(`購入可能数: ${maxGoldOre}個`);

    if (maxGoldOre > 0) {
        const totalCost = maxGoldOre * goldOreBuyPrice;
        const totalRevenue = maxGoldOre * goldOreSellPrice;
        const grossProfit = totalRevenue - totalCost;
        const returnSupplyCost = (foodNeeded * foodCostLisbon) + (waterNeeded * waterCostLisbon);
        const netProfit = grossProfit - returnSupplyCost;

        console.log(`投資額: ${Math.round(totalCost)}G`);
        console.log(`収益: ${Math.round(totalRevenue)}G`);
        console.log(`純利益: ${Math.round(netProfit)}G`);
        console.log(`最終資金: ${Math.round(INITIAL_GOLD + netProfit)}G`);
    } else {
        console.log('❌ 資金不足で金鉱石を購入できません！');
    }

    // 結論
    console.log('\n' + '═'.repeat(60));
    console.log('【結論】');
    console.log('═'.repeat(60));

    if (tradeableGoods.length > 0) {
        const best = tradeableGoods[0];
        if (best.netProfit > 0) {
            console.log(`✅ 初期資金で利益を出せる貿易ルートが存在します`);
            console.log(`   最適商品: ${best.name}`);
            console.log(`   純利益: ${best.netProfit}G`);
            console.log(`   最終資金: ${best.finalGold}G`);
        } else {
            console.log(`❌ すべての貿易ルートで損失が発生します`);
            console.log(`   最小損失: ${tradeableGoods[0].netProfit}G (${tradeableGoods[0].name})`);
        }
    } else {
        console.log('❌ 初期資金では何も購入できません！ゲームが詰んでいます！');
    }
}

checkInitialFunds();
