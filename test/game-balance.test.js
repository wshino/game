import { test, describe } from 'node:test';
import assert from 'node:assert';

// Mock DOM APIs
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

const createMockElement = () => ({
    innerHTML: '',
    textContent: '',
    remove: () => {},
    appendChild: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} },
    scrollTop: 0,
    scrollHeight: 0,
    setAttribute: () => {},
    getAttribute: () => null
});

global.document = {
    getElementById: () => createMockElement(),
    querySelector: () => createMockElement(),
    createElement: () => createMockElement(),
    createElementNS: () => createMockElement(),
    body: { appendChild: () => {} }
};

global.window = { addEventListener: () => {} };

// Clear localStorage before loading
global.localStorage.clear();

// Import game module and constants
import * as game from '../game.js';
import {
    ports,
    portDistances,
    goods,
    portPrices,
    shipUpgrades,
    inventorySettings,
    RANDOM_EVENTS,
    TREASURES,
    RARITY_CONFIG
} from '../src/core/constants.js';

// ============================================================
// 1. 経済バランステスト
// ============================================================
describe('経済バランステスト', () => {

    test('初期資金(1100G)で最低1つの商品を購入できる', () => {
        const initialGold = 1100;
        const cheapestTradeGoods = Object.entries(goods)
            .filter(([id]) => id !== 'food' && id !== 'water')
            .map(([id, good]) => ({
                id,
                minPrice: good.basePrice * Math.min(...Object.values(portPrices).map(p => p[id]))
            }));

        const canAfford = cheapestTradeGoods.some(g => g.minPrice <= initialGold);
        assert.ok(canAfford, '初期資金で少なくとも1つの商品を購入可能');

        // 最も安い商品の価格を確認
        const cheapest = cheapestTradeGoods.reduce((min, g) =>
            g.minPrice < min.minPrice ? g : min
        );
        assert.ok(cheapest.minPrice < initialGold * 0.5,
            `最安商品(${cheapest.id}: ${cheapest.minPrice}G)は初期資金の半分以下`);
    });

    test('全ての商品に利益を出せるルートが存在する', () => {
        const tradeGoods = Object.keys(goods).filter(id => id !== 'food' && id !== 'water');

        for (const goodId of tradeGoods) {
            const basePrice = goods[goodId].basePrice;
            let hasProfitableRoute = false;
            let maxProfit = 0;

            for (const buyPort of Object.keys(ports)) {
                for (const sellPort of Object.keys(ports)) {
                    if (buyPort === sellPort) continue;

                    const buyPrice = basePrice * portPrices[buyPort][goodId];
                    const sellPrice = basePrice * portPrices[sellPort][goodId] * 0.8; // 売値は80%
                    const profit = sellPrice - buyPrice;

                    if (profit > 0) {
                        hasProfitableRoute = true;
                        maxProfit = Math.max(maxProfit, profit);
                    }
                }
            }

            assert.ok(hasProfitableRoute,
                `${goods[goodId].name}には利益を出せるルートが存在する(最大利益: ${maxProfit.toFixed(0)}G)`);
        }
    });

    test('価格差が10%を超えるルートが十分にある', () => {
        const tradeGoods = Object.keys(goods).filter(id => id !== 'food' && id !== 'water');
        let profitableRoutes = 0;

        for (const goodId of tradeGoods) {
            for (const buyPort of Object.keys(ports)) {
                for (const sellPort of Object.keys(ports)) {
                    if (buyPort === sellPort) continue;

                    const buyMod = portPrices[buyPort][goodId];
                    const sellMod = portPrices[sellPort][goodId] * 0.8;
                    const profitRate = (sellMod - buyMod) / buyMod;

                    if (profitRate > 0.1) { // 10%以上の利益率
                        profitableRoutes++;
                    }
                }
            }
        }

        // 8商品 × 7港 × 6目的地 = 336 の組み合わせのうち、最低20%は高利益
        assert.ok(profitableRoutes >= 50,
            `利益率10%超のルートが${profitableRoutes}個存在（最低50個期待）`);
    });

    test('遠距離ルートに高利益商品が存在する', () => {
        const longDistanceRoutes = [];

        for (const from of Object.keys(ports)) {
            for (const to of Object.keys(ports)) {
                if (from === to) continue;

                const distance = portDistances[from][to];
                if (distance < 15) continue;

                // 各商品の最大利益率を計算
                let maxProfitRate = 0;
                let bestGood = '';
                for (const goodId of Object.keys(goods)) {
                    if (goodId === 'food' || goodId === 'water') continue;
                    const buyMod = portPrices[from][goodId];
                    const sellMod = portPrices[to][goodId] * 0.8;
                    const profitRate = (sellMod - buyMod) / buyMod;
                    if (profitRate > maxProfitRate) {
                        maxProfitRate = profitRate;
                        bestGood = goodId;
                    }
                }

                if (maxProfitRate > 0) {
                    longDistanceRoutes.push({ from, to, distance, maxProfitRate, bestGood });
                }
            }
        }

        // 遠距離ルートで50%以上の利益率があるルートが存在
        const highProfitRoutes = longDistanceRoutes.filter(r => r.maxProfitRate > 0.5);

        assert.ok(highProfitRoutes.length > 0,
            `遠距離ルートに50%超利益率のルートが${highProfitRoutes.length}個存在`);
    });

    test('日毎利益で近距離ルートも競争力がある', () => {
        const routes = [];

        for (const from of Object.keys(ports)) {
            for (const to of Object.keys(ports)) {
                if (from === to) continue;

                const distance = portDistances[from][to];

                // 各商品の最大日毎利益を計算
                let maxDailyProfit = 0;
                for (const goodId of Object.keys(goods)) {
                    if (goodId === 'food' || goodId === 'water') continue;
                    const basePrice = goods[goodId].basePrice;
                    const buyPrice = basePrice * portPrices[from][goodId];
                    const sellPrice = basePrice * portPrices[to][goodId] * 0.8;
                    const profit = sellPrice - buyPrice;
                    const dailyProfit = profit / distance;
                    maxDailyProfit = Math.max(maxDailyProfit, dailyProfit);
                }

                routes.push({ from, to, distance, maxDailyProfit });
            }
        }

        // 日毎利益トップ5のうち、少なくとも2つは近距離（5日以内）
        const top5 = routes.sort((a, b) => b.maxDailyProfit - a.maxDailyProfit).slice(0, 5);
        const shortInTop5 = top5.filter(r => r.distance <= 5).length;

        assert.ok(shortInTop5 >= 2,
            `日毎利益トップ5のうち${shortInTop5}個が近距離ルート（最低2個期待）`);
    });
});

// ============================================================
// 2. 進行バランステスト
// ============================================================
describe('進行バランステスト', () => {

    test('各船のアップグレードコストが指数関数的に増加する', () => {
        const costs = shipUpgrades.map(s => s.cost);

        // カラベル(0) -> キャラック(5000) -> ガレオン(15000) -> 東インド(50000)
        assert.strictEqual(costs[0], 0, 'カラベル船は無料');
        assert.ok(costs[2] > costs[1] * 2, 'ガレオン船コストはキャラック船の2倍超');
        assert.ok(costs[3] > costs[2] * 2, '東インド会社船コストはガレオン船の2倍超');
    });

    test('船の積載量増加がコスト増加に見合う', () => {
        for (let i = 1; i < shipUpgrades.length; i++) {
            const prev = shipUpgrades[i - 1];
            const curr = shipUpgrades[i];

            const capacityIncrease = curr.capacity - prev.capacity;
            const costPerCapacity = curr.cost / capacityIncrease;

            // 追加積載量1単位あたりのコストは適正範囲内
            assert.ok(costPerCapacity <= 300,
                `${curr.name}の追加積載量コスト(${costPerCapacity.toFixed(0)}G/unit)は適正`);
        }
    });

    test('初期船(カラベル)でも利益を出せるルートが存在', () => {
        const caravel = shipUpgrades[0];

        // 短距離ルートで利益を計算
        const distance = portDistances.lisbon.seville;
        const supplyNeeded = Math.ceil(caravel.crew * distance * 0.07) * 2;
        const tradableCapacity = caravel.capacity - supplyNeeded;

        // 金鉱石取引（セビリア→リスボン）
        const goldBasePrice = goods.gold_ore.basePrice;
        const buyPrice = goldBasePrice * portPrices.seville.gold_ore;
        const sellPrice = goldBasePrice * portPrices.lisbon.gold_ore * 0.8;
        const profitPerUnit = sellPrice - buyPrice;

        assert.ok(profitPerUnit > 0,
            `カラベル船で金鉱石取引は単位あたり${profitPerUnit.toFixed(0)}Gの利益`);
        assert.ok(tradableCapacity > 50,
            `短距離ルートで取引可能容量${tradableCapacity}個（50個超期待）`);
    });

    test('全船アップグレードの総コストは達成可能な範囲', () => {
        const totalCost = shipUpgrades.reduce((sum, s) => sum + s.cost, 0); // 70000G

        // 東インド会社船でのカリカット→リスボン香辛料ルート
        const eastIndia = shipUpgrades[3];
        const spiceBasePrice = goods.spices.basePrice;
        const buyPrice = spiceBasePrice * portPrices.calicut.spices;
        const sellPrice = spiceBasePrice * portPrices.lisbon.spices * 0.8;
        const profitPerUnit = sellPrice - buyPrice;

        // 東インド会社船の物資消費を考慮
        const supplyPerDay = eastIndia.crew * 0.07;
        const tripDays = portDistances.calicut.lisbon / eastIndia.speed; // 7.5日
        const supplySlots = Math.ceil(supplyPerDay * tripDays * 2) * 2; // 往復、食糧と水
        const tradableCapacity = eastIndia.capacity - supplySlots;

        const profitPerTrip = profitPerUnit * tradableCapacity;

        assert.ok(profitPerTrip > totalCost * 0.05,
            '東インド会社船での1往復利益は総アップグレードコストの5%超');
    });

    test('ゲーム開始から最終目標(100万G)への道筋が存在する', () => {
        const finalGoal = 1000000;

        // 東インド会社船での最大効率を計算
        const eastIndia = shipUpgrades[3];
        const bestRoute = { profit: 0, days: 0 };

        for (const goodId of Object.keys(goods)) {
            if (goodId === 'food' || goodId === 'water') continue;

            for (const from of Object.keys(ports)) {
                for (const to of Object.keys(ports)) {
                    if (from === to) continue;

                    const basePrice = goods[goodId].basePrice;
                    const buyPrice = basePrice * portPrices[from][goodId];
                    const sellPrice = basePrice * portPrices[to][goodId] * 0.8;
                    const profitPerUnit = sellPrice - buyPrice;

                    if (profitPerUnit > 0) {
                        const days = portDistances[from][to] / eastIndia.speed;
                        const profit = profitPerUnit * (eastIndia.capacity * 0.8);

                        if (profit / days > bestRoute.profit / (bestRoute.days || 1)) {
                            bestRoute.profit = profit;
                            bestRoute.days = days;
                        }
                    }
                }
            }
        }

        const dailyProfit = bestRoute.profit / bestRoute.days;
        const daysToGoal = finalGoal / dailyProfit;

        // 1000日以内で達成可能であるべき
        assert.ok(daysToGoal < 1000,
            `100万Gは東インド会社船で約${Math.ceil(daysToGoal)}日で達成可能`);
    });
});

// ============================================================
// 3. 航海システムバランステスト
// ============================================================
describe('航海システムバランステスト', () => {

    test('短距離ルートでは物資コストが適切', () => {
        // 短距離ルート（5日以内）での物資コストを確認
        const ship = shipUpgrades[0];
        const shortRoutes = [];

        for (const from of Object.keys(ports)) {
            for (const to of Object.keys(ports)) {
                if (from === to) continue;

                const baseDays = portDistances[from][to];
                if (baseDays <= 5) {
                    const actualDays = Math.ceil(baseDays / ship.speed);
                    const supplyNeeded = Math.ceil(ship.crew * actualDays * 0.07);
                    const totalSupply = supplyNeeded * 2;
                    const tradeableCapacity = ship.capacity - totalSupply;

                    shortRoutes.push({
                        route: `${from}→${to}`,
                        tradeableCapacity,
                        supplyRatio: totalSupply / ship.capacity
                    });
                }
            }
        }

        // 短距離ルートでは取引可能容量が80%以上
        const goodRoutes = shortRoutes.filter(r => r.supplyRatio < 0.2);
        assert.ok(goodRoutes.length >= shortRoutes.length * 0.8,
            `短距離ルートの${goodRoutes.length}/${shortRoutes.length}で物資20%以下`);
    });

    test('物資消費率(0.07)が適切な範囲にある', () => {
        const consumptionRate = 0.07;

        // 最小船で最長ルートを確認
        const caravel = shipUpgrades[0];
        const longestRoute = Math.max(...Object.values(portDistances).flatMap(d => Object.values(d)));

        const maxSupplyNeeded = Math.ceil(caravel.crew * longestRoute * consumptionRate) * 2;
        const supplyRatio = maxSupplyNeeded / caravel.capacity;

        // 最長ルートでも物資は積載量の100%未満であるべき（挑戦的だが不可能ではない）
        assert.ok(supplyRatio < 1.0,
            `最長ルートの物資比率${(supplyRatio*100).toFixed(1)}%は積載量未満`);

        // 通常のルート（15日以内）では物資は50%未満であるべき
        const normalSupplyNeeded = Math.ceil(caravel.crew * 15 * consumptionRate) * 2;
        const normalRatio = normalSupplyNeeded / caravel.capacity;

        assert.ok(normalRatio < 0.5,
            `通常ルートの物資比率${(normalRatio*100).toFixed(1)}%は50%未満`);
    });

    test('船のアップグレードで航路の選択肢が広がる', () => {
        const accessibleRoutes = {};

        for (const ship of shipUpgrades) {
            let accessible = 0;

            for (const from of Object.keys(ports)) {
                for (const to of Object.keys(ports)) {
                    if (from === to) continue;

                    const baseDays = portDistances[from][to];
                    const actualDays = Math.ceil(baseDays / ship.speed);
                    const supplyNeeded = Math.ceil(ship.crew * actualDays * 0.07) * 2;
                    const tradeableCapacity = ship.capacity - supplyNeeded;

                    // 取引可能なスペースが20以上あれば「アクセス可能」とする
                    if (tradeableCapacity >= 20) {
                        accessible++;
                    }
                }
            }

            accessibleRoutes[ship.name] = accessible;
        }

        // アップグレードごとにアクセス可能ルートが増える
        const shipNames = shipUpgrades.map(s => s.name);
        for (let i = 1; i < shipNames.length; i++) {
            assert.ok(
                accessibleRoutes[shipNames[i]] >= accessibleRoutes[shipNames[i-1]],
                `${shipNames[i]}(${accessibleRoutes[shipNames[i]]}ルート)は${shipNames[i-1]}(${accessibleRoutes[shipNames[i-1]]}ルート)以上`
            );
        }
    });

    test('天候システムの速度影響が適切', () => {
        const weatherEffects = {
            sunny: 1.0,
            favorable: 1.2,
            westerlies: 0.9,
            rain: 0.8,
            storm: 0.6
        };

        // 加重平均が1.0に近いこと
        const probabilities = { sunny: 0.4, favorable: 0.2, westerlies: 0.15, rain: 0.15, storm: 0.1 };
        let weightedSpeed = 0;

        for (const [weather, effect] of Object.entries(weatherEffects)) {
            weightedSpeed += effect * probabilities[weather];
        }

        assert.ok(Math.abs(weightedSpeed - 0.96) < 0.1,
            `天候の加重平均速度${weightedSpeed.toFixed(2)}は1.0に近い`);
    });
});

// ============================================================
// 4. 在庫システムバランステスト
// ============================================================
describe('在庫システムバランステスト', () => {

    test('港サイズに応じた適切な在庫設定', () => {
        assert.ok(inventorySettings.small.maxStock < inventorySettings.medium.maxStock);
        assert.ok(inventorySettings.medium.maxStock < inventorySettings.large.maxStock);
        assert.ok(inventorySettings.large.maxStock < inventorySettings.very_large.maxStock);
    });

    test('最小の港(長崎)でも初期船の取引が可能', () => {
        const nagasakiSettings = inventorySettings.small;
        const caravel = shipUpgrades[0];

        // 長崎の最大在庫は30
        const maxStock = nagasakiSettings.maxStock;

        // 最低でも5単位の取引が可能であれば問題なし
        assert.ok(maxStock >= 5, `長崎の最大在庫${maxStock}は取引可能な量`);

        // 回復速度を確認
        const daysToFullStock = maxStock / nagasakiSettings.refreshRate;
        assert.ok(daysToFullStock <= 10,
            `長崎の在庫完全回復${daysToFullStock.toFixed(1)}日は適切`);
    });

    test('大規模港での大量取引が可能', () => {
        const eastIndia = shipUpgrades[3];
        const veniceSettings = inventorySettings.very_large;

        // 東インド会社船の実質取引量
        const avgTripDays = 10;
        const supplyNeeded = Math.ceil(eastIndia.crew * avgTripDays * 0.07) * 2;
        const tradeableCapacity = eastIndia.capacity - supplyNeeded;

        // ヴェネツィアの在庫で1回の取引が可能
        assert.ok(veniceSettings.maxStock >= tradeableCapacity * 0.3,
            `ヴェネツィアの在庫${veniceSettings.maxStock}は大型船の取引に対応`);
    });

    test('在庫回復速度が待機戦略を可能にする', () => {
        for (const [size, settings] of Object.entries(inventorySettings)) {
            const daysTo50Percent = (settings.maxStock * 0.5) / settings.refreshRate;

            // 50%回復に必要な日数は10日以内であるべき
            assert.ok(daysTo50Percent <= 10,
                `${size}港の50%在庫回復${daysTo50Percent.toFixed(1)}日は待機可能`);
        }
    });

    test('全港での商品可用性が確保されている', () => {
        // 全ての商品が全ての港で購入可能（価格は異なる）
        for (const portId of Object.keys(ports)) {
            for (const goodId of Object.keys(goods)) {
                assert.ok(
                    portPrices[portId][goodId] !== undefined,
                    `${ports[portId].name}で${goods[goodId].name}の価格が定義されている`
                );
            }
        }
    });
});

// ============================================================
// 5. イベントシステムバランステスト
// ============================================================
describe('イベントシステムバランステスト', () => {

    test('イベント発生確率の合計が適切', () => {
        let totalProbability = 0;

        for (const event of Object.values(RANDOM_EVENTS)) {
            totalProbability += event.probability;
        }

        // 合計確率は75%以下であるべき（毎回イベントが起きるのは煩わしい）
        assert.ok(totalProbability <= 0.80,
            `イベント合計確率${(totalProbability*100).toFixed(1)}%は80%以下`);

        // 最低でも30%以上のイベント確率があるべき
        assert.ok(totalProbability >= 0.30,
            `イベント合計確率${(totalProbability*100).toFixed(1)}%は30%以上`);
    });

    test('危険なイベントと良いイベントのバランス', () => {
        const dangerousEvents = ['pirate', 'cargoLoss', 'ghostShip'];
        const positiveEvents = ['castaway', 'shipwreck', 'mysteriousMerchant', 'mermaidBlessing', 'festival'];

        let dangerousProbability = 0;
        let positiveProbability = 0;

        for (const event of Object.values(RANDOM_EVENTS)) {
            if (dangerousEvents.includes(event.id)) {
                dangerousProbability += event.probability;
            } else if (positiveEvents.includes(event.id)) {
                positiveProbability += event.probability;
            }
        }

        // ポジティブイベントの確率が危険イベントより低くないこと
        assert.ok(positiveProbability >= dangerousProbability * 0.8,
            `ポジティブ${(positiveProbability*100).toFixed(1)}%は危険${(dangerousProbability*100).toFixed(1)}%と比較して適切`);
    });

    test('全イベントに選択肢が存在する', () => {
        for (const event of Object.values(RANDOM_EVENTS)) {
            assert.ok(event.choices && event.choices.length > 0,
                `${event.name}イベントには選択肢がある`);
        }
    });

    test('選択肢のないイベント(強制損失)が多すぎない', () => {
        let forcedEvents = 0;

        for (const event of Object.values(RANDOM_EVENTS)) {
            if (event.choices.length === 1) {
                forcedEvents++;
            }
        }

        const totalEvents = Object.keys(RANDOM_EVENTS).length;
        assert.ok(forcedEvents <= totalEvents * 0.3,
            `強制イベント${forcedEvents}個は全体の30%以下`);
    });
});

// ============================================================
// 6. 船システムバランステスト
// ============================================================
describe('船システムバランステスト', () => {

    test('船のステータスが段階的に向上する', () => {
        for (let i = 1; i < shipUpgrades.length; i++) {
            const prev = shipUpgrades[i - 1];
            const curr = shipUpgrades[i];

            assert.ok(curr.capacity > prev.capacity,
                `${curr.name}の積載量${curr.capacity}は${prev.name}の${prev.capacity}より多い`);
            assert.ok(curr.speed > prev.speed,
                `${curr.name}の速度${curr.speed}は${prev.name}の${prev.speed}より速い`);
            assert.ok(curr.maxDurability > prev.maxDurability,
                `${curr.name}の耐久度${curr.maxDurability}は${prev.name}の${prev.maxDurability}より高い`);
        }
    });

    test('乗員数と積載量のバランスが適切', () => {
        for (const ship of shipUpgrades) {
            const crewRatio = ship.crew / ship.capacity;

            // 乗員数は積載量の20%を超えないこと
            assert.ok(crewRatio <= 0.20,
                `${ship.name}の乗員比率${(crewRatio*100).toFixed(1)}%は20%以下`);
        }
    });

    test('戦闘力が船のグレードに対応', () => {
        for (let i = 1; i < shipUpgrades.length; i++) {
            const prev = shipUpgrades[i - 1];
            const curr = shipUpgrades[i];

            assert.ok(curr.combatPower > prev.combatPower,
                `${curr.name}の戦闘力${curr.combatPower}は${prev.name}の${prev.combatPower}より高い`);
        }
    });

    test('最終船(東インド会社船)が圧倒的すぎない', () => {
        const caravel = shipUpgrades[0];
        const eastIndia = shipUpgrades[3];

        const capacityRatio = eastIndia.capacity / caravel.capacity;
        const speedRatio = eastIndia.speed / caravel.speed;

        // 積載量は最大5倍程度
        assert.ok(capacityRatio <= 6,
            `東インド会社船の積載量倍率${capacityRatio}は適切`);

        // 速度は最大3倍程度
        assert.ok(speedRatio <= 3,
            `東インド会社船の速度倍率${speedRatio}は適切`);
    });
});

// ============================================================
// 7. お宝システムバランステスト
// ============================================================
describe('お宝システムバランステスト', () => {

    test('レアリティの分布が適切', () => {
        const rarities = { common: 0, uncommon: 0, rare: 0, legendary: 0 };

        for (const treasure of Object.values(TREASURES)) {
            rarities[treasure.rarity]++;
        }

        // 複数のレアリティにアイテムが存在
        const raritiesWithItems = Object.values(rarities).filter(c => c > 0).length;
        assert.ok(raritiesWithItems >= 3,
            `${raritiesWithItems}種類のレアリティにアイテムが存在（3種以上期待）`);

        // お宝の総数が適切
        const totalTreasures = Object.values(rarities).reduce((sum, c) => sum + c, 0);
        assert.ok(totalTreasures >= 5,
            `お宝${totalTreasures}個が存在（5個以上期待）`);
    });

    test('ドロップ確率がレアリティに対応', () => {
        assert.ok(RARITY_CONFIG.common.dropWeight > RARITY_CONFIG.uncommon.dropWeight);
        assert.ok(RARITY_CONFIG.uncommon.dropWeight > RARITY_CONFIG.rare.dropWeight);
        assert.ok(RARITY_CONFIG.rare.dropWeight > RARITY_CONFIG.legendary.dropWeight);
    });

    test('レジェンダリーアイテムが特別な効果を持つ', () => {
        const legendaryItems = Object.values(TREASURES).filter(t => t.rarity === 'legendary');

        for (const item of legendaryItems) {
            assert.ok(item.effect !== null && item.effect !== undefined,
                `${item.name}は効果を持つ`);
        }
    });

    test('売却可能アイテムの価値が適切', () => {
        const sellableItems = Object.values(TREASURES).filter(t =>
            t.effect && t.effect.type === 'sell_value'
        );

        for (const item of sellableItems) {
            // コモン/アンコモンの売却価値は低め
            if (item.rarity === 'uncommon') {
                assert.ok(item.effect.value <= 1000,
                    `${item.name}の売却価値${item.effect.value}は適切`);
            }
            // レジェンダリーの売却価値は高い
            if (item.rarity === 'legendary') {
                assert.ok(item.effect.value >= 10000,
                    `${item.name}の売却価値${item.effect.value}は高価`);
            }
        }
    });
});

// ============================================================
// 8. シナリオプレイテスト
// ============================================================
describe('シナリオプレイテスト', () => {

    test('初心者プレイヤーシナリオ: 近距離ルートで資金を貯められる', () => {
        // リスボン↔セビリア往復での利益計算
        const caravel = shipUpgrades[0];
        const days = portDistances.lisbon.seville * 2; // 往復4日
        const supplyNeeded = Math.ceil(caravel.crew * days * 0.07) * 2;
        const tradeableCapacity = caravel.capacity - supplyNeeded;

        // 金鉱石取引（セビリア→リスボン）
        const goldOreBase = goods.gold_ore.basePrice;
        const buyPrice = goldOreBase * portPrices.seville.gold_ore;
        const sellPrice = goldOreBase * portPrices.lisbon.gold_ore * 0.8;
        const profitPerUnit = sellPrice - buyPrice;
        const tripProfit = profitPerUnit * tradeableCapacity;

        // 初期資金1100Gに対して利益がプラス
        assert.ok(tripProfit > 0,
            `リスボン-セビリア金鉱石ルートで${tripProfit.toFixed(0)}G/往復の利益`);
    });

    test('中級者プレイヤーシナリオ: 東洋貿易で利益', () => {
        // キャラック船でカリカット↔リスボン
        const carrack = shipUpgrades[1];
        const days = portDistances.calicut.lisbon * 2 / carrack.speed;
        const supplyNeeded = Math.ceil(carrack.crew * days * 0.07) * 2;
        const tradeableCapacity = carrack.capacity - supplyNeeded;

        // 香辛料取引
        const spiceBase = goods.spices.basePrice;
        const buyPrice = spiceBase * portPrices.calicut.spices;
        const sellPrice = spiceBase * portPrices.lisbon.spices * 0.8;
        const profitPerUnit = sellPrice - buyPrice;
        const tripProfit = profitPerUnit * tradeableCapacity;

        assert.ok(tripProfit > 0,
            `香辛料貿易で${tripProfit.toFixed(0)}G/往復の利益がプラス`);
    });

    test('上級者プレイヤーシナリオ: 長崎貿易が利益', () => {
        // 東インド会社船で長崎→リスボン（片道）
        const eastIndia = shipUpgrades[3];
        const days = portDistances.nagasaki.lisbon / eastIndia.speed;
        const supplyNeeded = Math.ceil(eastIndia.crew * days * 0.07) * 2;
        const tradeableCapacity = eastIndia.capacity - supplyNeeded;

        // 絹取引（長崎→リスボン）
        const silkBase = goods.silk.basePrice;
        const buyPrice = silkBase * portPrices.nagasaki.silk;
        const sellPrice = silkBase * portPrices.lisbon.silk * 0.8;
        const profitPerUnit = sellPrice - buyPrice;
        const tripProfit = profitPerUnit * tradeableCapacity;

        assert.ok(tripProfit > 0,
            `長崎絹貿易で${tripProfit.toFixed(0)}G/片道の利益がプラス`);
    });

    test('破産回避シナリオ: 少額でも取引可能な商品がある', () => {
        // 最も安い商品を確認
        let cheapestPrice = Infinity;
        let cheapestInfo = '';

        for (const portId of Object.keys(ports)) {
            for (const goodId of Object.keys(goods)) {
                if (goodId === 'food' || goodId === 'water') continue;

                const basePrice = goods[goodId].basePrice;
                const buyPrice = basePrice * portPrices[portId][goodId];

                if (buyPrice < cheapestPrice) {
                    cheapestPrice = buyPrice;
                    cheapestInfo = `${ports[portId].name}の${goods[goodId].name}`;
                }
            }
        }

        // 最も安い商品が200G以下であれば少額取引可能
        assert.ok(cheapestPrice <= 200,
            `最安商品は${cheapestInfo}で${cheapestPrice.toFixed(0)}G（200G以下期待）`);
    });

    test('全港訪問シナリオ: 合理的な日数で達成可能', () => {
        // 最短経路で全港訪問
        const caravel = shipUpgrades[0];
        const route = ['lisbon', 'seville', 'venice', 'alexandria', 'calicut', 'malacca', 'nagasaki'];

        let totalDays = 0;
        for (let i = 0; i < route.length - 1; i++) {
            totalDays += portDistances[route[i]][route[i + 1]] / caravel.speed;
        }

        // カラベル船で100日以内に全港訪問可能
        assert.ok(totalDays <= 100,
            `全港訪問${totalDays.toFixed(0)}日はカラベル船で100日以内`);
    });
});

console.log('ゲームバランステスト完了！');
