#!/usr/bin/env node

/**
 * 価格分析 - どのルートで利益が出るか分析
 */

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

const portPrices = {
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.0, silk: 1.8, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.8, silk: 1.7, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3 },
    venice: { wine: 1.1, cloth: 0.7, spices: 1.5, silk: 1.3, gold_ore: 1.6, porcelain: 1.4, tea: 1.4, silver: 1.5 },
    alexandria: { wine: 1.2, cloth: 1.1, spices: 0.9, silk: 1.2, gold_ore: 1.4, porcelain: 1.3, tea: 1.2, silver: 1.4 },
    calicut: { wine: 1.5, cloth: 1.3, spices: 0.6, silk: 1.0, gold_ore: 1.3, porcelain: 1.2, tea: 0.9, silver: 1.2 },
    malacca: { wine: 1.6, cloth: 1.4, spices: 0.8, silk: 0.9, gold_ore: 1.2, porcelain: 1.0, tea: 0.8, silver: 1.1 },
    nagasaki: { wine: 1.8, cloth: 1.5, spices: 1.3, silk: 0.7, gold_ore: 1.5, porcelain: 0.8, tea: 0.7, silver: 0.6 }
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

const ports = ['lisbon', 'seville', 'venice', 'alexandria', 'calicut', 'malacca', 'nagasaki'];

function getPrice(goodId, portId, isBuying = true) {
    const basePrice = goods[goodId].basePrice;
    const multiplier = portPrices[portId][goodId];
    const price = Math.round(basePrice * multiplier);
    return isBuying ? price : Math.round(price * 0.8);
}

function calculateSupplyCost(fromPort, toPort, crew = 20) {
    const days = portDistances[fromPort][toPort];
    const foodNeeded = crew * days;
    const waterNeeded = crew * days;
    const foodPrice = 5; // 平均価格
    const waterPrice = 3; // 平均価格
    return foodNeeded * foodPrice + waterNeeded * waterPrice;
}

console.log('📊 各ルートの利益分析\n');
console.log('='.repeat(100));

const routes = [];

for (const fromPort of ports) {
    for (const toPort of ports) {
        if (fromPort === toPort) continue;

        for (const goodId in goods) {
            const buyPrice = getPrice(goodId, fromPort, true);
            const sellPrice = getPrice(goodId, toPort, false);
            const profitPerUnit = sellPrice - buyPrice;
            const distance = portDistances[fromPort][toPort];
            const supplyCost = calculateSupplyCost(fromPort, toPort);

            // 初期資金1000Gで購入できる最大量（補給品と安全マージンを考慮）
            const availableGold = 1000 - supplyCost - 100;
            const maxQuantity = Math.min(Math.floor(availableGold / buyPrice), 100 - (20 * distance * 2)); // 容量制限

            if (maxQuantity > 0) {
                const totalProfit = (profitPerUnit * maxQuantity) - supplyCost;
                const profitPerDay = totalProfit / distance;

                routes.push({
                    from: fromPort,
                    to: toPort,
                    good: goods[goodId].name,
                    goodId,
                    buyPrice,
                    sellPrice,
                    profitPerUnit,
                    distance,
                    supplyCost,
                    maxQuantity,
                    totalProfit,
                    profitPerDay
                });
            }
        }
    }
}

// 総利益順にソート
routes.sort((a, b) => b.totalProfit - a.totalProfit);

console.log('\n🏆 総利益TOP20ルート（初期資金1000Gで1航海）');
console.log('-'.repeat(100));
console.log('順位 | ルート                    | 商品     | 距離 | 数量 | 単価利益 | 補給 | 総利益');
console.log('-'.repeat(100));

routes.slice(0, 20).forEach((r, i) => {
    const rank = (i + 1).toString().padStart(2);
    const route = `${r.from} → ${r.to}`.padEnd(24);
    const good = r.good.padEnd(8);
    const dist = r.distance.toString().padStart(2);
    const qty = r.maxQuantity.toString().padStart(3);
    const unitProfit = (r.profitPerUnit >= 0 ? '+' : '') + r.profitPerUnit.toString().padStart(4);
    const supply = r.supplyCost.toString().padStart(4);
    const total = (r.totalProfit >= 0 ? '+' : '') + r.totalProfit.toString().padStart(6);

    console.log(`${rank}位 | ${route} | ${good} | ${dist}日 | ${qty}個 | ${unitProfit}G | ${supply}G | ${total}G`);
});

// 1日あたり利益順にソート
routes.sort((a, b) => b.profitPerDay - a.profitPerDay);

console.log('\n\n⚡ 1日あたり利益TOP20ルート（効率重視）');
console.log('-'.repeat(100));
console.log('順位 | ルート                    | 商品     | 距離 | 数量 | 総利益 | 1日利益');
console.log('-'.repeat(100));

routes.slice(0, 20).forEach((r, i) => {
    const rank = (i + 1).toString().padStart(2);
    const route = `${r.from} → ${r.to}`.padEnd(24);
    const good = r.good.padEnd(8);
    const dist = r.distance.toString().padStart(2);
    const qty = r.maxQuantity.toString().padStart(3);
    const total = (r.totalProfit >= 0 ? '+' : '') + r.totalProfit.toString().padStart(6);
    const perDay = (r.profitPerDay >= 0 ? '+' : '') + r.profitPerDay.toFixed(1).padStart(7);

    console.log(`${rank}位 | ${route} | ${good} | ${dist}日 | ${qty}個 | ${total}G | ${perDay}G`);
});

// 短距離（2-5日）で利益が出るルート
const shortRoutes = routes.filter(r => r.distance <= 5 && r.totalProfit > 0);
shortRoutes.sort((a, b) => b.totalProfit - a.totalProfit);

console.log('\n\n🎯 短距離(2-5日)で利益が出るルート TOP10');
console.log('-'.repeat(100));
console.log('順位 | ルート                    | 商品     | 距離 | 数量 | 総利益 | 1日利益');
console.log('-'.repeat(100));

shortRoutes.slice(0, 10).forEach((r, i) => {
    const rank = (i + 1).toString().padStart(2);
    const route = `${r.from} → ${r.to}`.padEnd(24);
    const good = r.good.padEnd(8);
    const dist = r.distance.toString().padStart(2);
    const qty = r.maxQuantity.toString().padStart(3);
    const total = (r.totalProfit >= 0 ? '+' : '') + r.totalProfit.toString().padStart(6);
    const perDay = (r.profitPerDay >= 0 ? '+' : '') + r.profitPerDay.toFixed(1).padStart(7);

    console.log(`${rank}位 | ${route} | ${good} | ${dist}日 | ${qty}個 | ${total}G | ${perDay}G`);
});

console.log('\n');
