// 全港間での利益の出る貿易ルートを網羅的にチェック

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
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.0, silk: 1.8, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.8, silk: 1.7, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3 },
    venice: { wine: 1.1, cloth: 0.7, spices: 1.5, silk: 1.3, gold_ore: 1.6, porcelain: 1.4, tea: 1.4, silver: 1.5 },
    alexandria: { wine: 1.2, cloth: 1.1, spices: 0.9, silk: 1.2, gold_ore: 1.4, porcelain: 1.3, tea: 1.2, silver: 1.4 },
    calicut: { wine: 1.5, cloth: 1.3, spices: 0.6, silk: 1.0, gold_ore: 1.3, porcelain: 1.2, tea: 0.9, silver: 1.2 },
    malacca: { wine: 1.6, cloth: 1.4, spices: 0.8, silk: 0.9, gold_ore: 1.2, porcelain: 1.0, tea: 0.8, silver: 1.1 },
    nagasaki: { wine: 1.8, cloth: 1.5, spices: 1.3, silk: 0.7, gold_ore: 1.5, porcelain: 0.8, tea: 0.7, silver: 0.6 }
};

const portNames = {
    lisbon: 'リスボン',
    seville: 'セビリア',
    venice: 'ヴェネツィア',
    alexandria: 'アレクサンドリア',
    calicut: 'カリカット',
    malacca: 'マラッカ',
    nagasaki: '長崎'
};

function calculatePrice(goodId, portId, isBuying = true) {
    const good = goods[goodId];
    const multiplier = portPrices[portId][goodId];
    const basePrice = good.basePrice * multiplier;
    return isBuying ? basePrice : basePrice * 0.8; // 売却は80%
}

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  全港間での利益の出る貿易ルート分析                  ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

const profitableRoutes = [];

// 全港間での全商品チェック
for (const fromPort in portPrices) {
    for (const toPort in portPrices) {
        if (fromPort === toPort) continue;

        for (const goodId in goods) {
            const buyPrice = calculatePrice(goodId, fromPort, true);
            const sellPrice = calculatePrice(goodId, toPort, false);
            const profitPerUnit = sellPrice - buyPrice;

            if (profitPerUnit > 0) {
                profitableRoutes.push({
                    from: portNames[fromPort],
                    to: portNames[toPort],
                    good: goods[goodId].name,
                    buyPrice: Math.round(buyPrice),
                    sellPrice: Math.round(sellPrice),
                    profit: Math.round(profitPerUnit),
                    margin: Math.round((profitPerUnit / buyPrice) * 100)
                });
            }
        }
    }
}

// 利益率でソート
profitableRoutes.sort((a, b) => b.margin - a.margin);

console.log(`見つかった利益の出るルート: ${profitableRoutes.length}件\n`);

if (profitableRoutes.length > 0) {
    console.log('【トップ20の利益率の高いルート】\n');
    console.log('出発港\t\t→\t到着港\t\t商品\t\t購入\t売却\t利益\t利益率');
    console.log('─'.repeat(100));

    for (let i = 0; i < Math.min(20, profitableRoutes.length); i++) {
        const r = profitableRoutes[i];
        console.log(
            `${r.from}\t→\t${r.to}\t${r.good}\t\t${r.buyPrice}G\t${r.sellPrice}G\t+${r.profit}G\t${r.margin}%`
        );
    }

    // リスボン出発のルートだけを抽出
    console.log('\n\n【リスボン出発で利益の出るルート】\n');
    const lisbonRoutes = profitableRoutes.filter(r => r.from === 'リスボン');

    if (lisbonRoutes.length > 0) {
        console.log('到着港\t\t商品\t\t購入\t売却\t利益\t利益率');
        console.log('─'.repeat(80));
        for (const r of lisbonRoutes) {
            console.log(`${r.to}\t${r.good}\t\t${r.buyPrice}G\t${r.sellPrice}G\t+${r.profit}G\t${r.margin}%`);
        }
    } else {
        console.log('❌ リスボン出発で利益の出るルートは存在しません！');
    }
} else {
    console.log('❌ 利益の出る貿易ルートが1つも存在しません！');
}

// 売買差額20%の影響を計算
console.log('\n\n【売買差額（20%手数料）の影響分析】\n');

console.log('もし売買差額がなかったら（買値=売値）、利益の出るルート数:');

let noFeeRoutes = 0;
for (const fromPort in portPrices) {
    for (const toPort in portPrices) {
        if (fromPort === toPort) continue;

        for (const goodId in goods) {
            const buyPrice = calculatePrice(goodId, fromPort, true);
            const sellPriceNoFee = goods[goodId].basePrice * portPrices[toPort][goodId]; // 手数料なし

            if (sellPriceNoFee > buyPrice) {
                noFeeRoutes++;
            }
        }
    }
}

console.log(`手数料なしの場合: ${noFeeRoutes}件`);
console.log(`現在（20%手数料）: ${profitableRoutes.length}件`);
console.log(`減少: ${noFeeRoutes - profitableRoutes.length}件 (${Math.round((noFeeRoutes - profitableRoutes.length) / noFeeRoutes * 100)}%)\n`);
