// Game Balance Simulation Script
// このスクリプトはゲームバランスを包括的にテストします

// ゲームデータの定義（game.jsから）
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

const inventorySettings = {
    small: { maxStock: 30, refreshRate: 3 },
    medium: { maxStock: 60, refreshRate: 5 },
    large: { maxStock: 100, refreshRate: 8 },
    very_large: { maxStock: 150, refreshRate: 12 }
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

// シミュレーション用のゲーム状態クラス
class GameSimulator {
    constructor() {
        this.reset();
    }

    reset() {
        this.gold = 1000;
        this.currentPort = 'lisbon';
        this.inventory = {};
        this.ship = { ...shipUpgrades[0] };
        this.gameTime = 0;
        this.portInventory = {};
        this.history = [];
        this.initializePortInventory();
    }

    initializePortInventory() {
        for (const portId in ports) {
            this.portInventory[portId] = {};
            const portSize = ports[portId].size;
            const maxStock = inventorySettings[portSize].maxStock;
            for (const goodId in goods) {
                this.portInventory[portId][goodId] = maxStock;
            }
        }
    }

    refreshPortInventory(daysPassed) {
        for (const portId in this.portInventory) {
            const portSize = ports[portId].size;
            const refreshRate = inventorySettings[portSize].refreshRate;
            const maxStock = inventorySettings[portSize].maxStock;
            for (const goodId in this.portInventory[portId]) {
                const recovered = Math.min(
                    maxStock,
                    this.portInventory[portId][goodId] + (refreshRate * daysPassed)
                );
                this.portInventory[portId][goodId] = Math.round(recovered);
            }
        }
    }

    getPrice(portId, goodId, isBuying = true) {
        const good = goods[goodId];
        const multiplier = portPrices[portId][goodId];
        const basePrice = good.basePrice * multiplier;
        const price = Math.round(basePrice * 0.95); // 固定価格（ランダム要素なし）
        return isBuying ? price : Math.round(price * 0.8);
    }

    getCargoUsed() {
        return Object.values(this.inventory).reduce((sum, qty) => sum + qty, 0);
    }

    getCargoSpace() {
        return this.ship.capacity - this.getCargoUsed();
    }

    calculateRequiredSupplies(days) {
        const crew = this.ship.crew;
        return {
            food: Math.ceil(crew * days * 0.08),
            water: Math.ceil(crew * days * 0.08)
        };
    }

    calculateProfitForPort(destinationPortId) {
        const profits = [];
        for (const [goodId, good] of Object.entries(goods)) {
            if (goodId === 'food' || goodId === 'water') continue;

            const buyPrice = this.getPrice(this.currentPort, goodId, true);
            const sellPrice = this.getPrice(destinationPortId, goodId, false);
            const profitPerUnit = sellPrice - buyPrice;
            const profitMargin = buyPrice > 0 ? (profitPerUnit / buyPrice) * 100 : 0;

            if (profitPerUnit > 0) {
                profits.push({
                    goodId,
                    buyPrice,
                    sellPrice,
                    profitPerUnit,
                    profitMargin,
                    stock: this.portInventory[this.currentPort][goodId]
                });
            }
        }
        profits.sort((a, b) => b.profitMargin - a.profitMargin);
        return profits;
    }

    buyGood(goodId, quantity = 1) {
        const price = this.getPrice(this.currentPort, goodId, true);
        const portStock = this.portInventory[this.currentPort][goodId];
        const maxByMoney = Math.floor(this.gold / price);
        const maxByCargo = this.getCargoSpace();
        const maxByStock = portStock;
        const actualQuantity = Math.min(quantity, maxByMoney, maxByCargo, maxByStock);

        if (actualQuantity < 1) return 0;

        const totalCost = actualQuantity * price;
        this.gold -= totalCost;
        this.inventory[goodId] = (this.inventory[goodId] || 0) + actualQuantity;
        this.portInventory[this.currentPort][goodId] -= actualQuantity;

        return actualQuantity;
    }

    sellGood(goodId, quantity = null) {
        if (!this.inventory[goodId] || this.inventory[goodId] < 1) return 0;

        const sellQuantity = quantity === null ? this.inventory[goodId] : Math.min(quantity, this.inventory[goodId]);
        const price = this.getPrice(this.currentPort, goodId, false);
        const totalRevenue = sellQuantity * price;

        this.gold += totalRevenue;
        this.inventory[goodId] -= sellQuantity;

        return totalRevenue;
    }

    travel(destinationPortId) {
        const baseDays = portDistances[this.currentPort][destinationPortId];
        const travelDays = Math.max(1, Math.round(baseDays / this.ship.speed));
        const required = this.calculateRequiredSupplies(travelDays);

        // 物資を購入
        this.buyGood('food', required.food);
        this.buyGood('water', required.water);

        // 物資が足りない場合は旅行できない
        const currentFood = this.inventory.food || 0;
        const currentWater = this.inventory.water || 0;
        if (currentFood < required.food || currentWater < required.water) {
            return false;
        }

        // 物資を消費
        this.inventory.food -= required.food;
        this.inventory.water -= required.water;

        // 時間経過
        this.gameTime += travelDays;
        this.refreshPortInventory(travelDays);

        // 港を移動
        this.currentPort = destinationPortId;

        return true;
    }

    upgradeShip(shipIndex) {
        const newShip = shipUpgrades[shipIndex];
        if (this.gold < newShip.cost) return false;
        if (this.getCargoUsed() > newShip.capacity) return false;

        this.gold -= newShip.cost;
        this.ship = { ...newShip };
        return true;
    }

    // 最適な取引ルートを見つける
    findBestTrade() {
        let bestTrade = null;
        let bestProfit = 0;

        for (const destPortId in ports) {
            if (destPortId === this.currentPort) continue;

            const profits = this.calculateProfitForPort(destPortId);
            if (profits.length === 0) continue;

            const topGood = profits[0];
            const baseDays = portDistances[this.currentPort][destPortId];
            const travelDays = Math.max(1, Math.round(baseDays / this.ship.speed));
            const required = this.calculateRequiredSupplies(travelDays);

            // 物資コストを計算
            const foodPrice = this.getPrice(this.currentPort, 'food', true);
            const waterPrice = this.getPrice(this.currentPort, 'water', true);
            const currentFood = this.inventory.food || 0;
            const currentWater = this.inventory.water || 0;
            const needFood = Math.max(0, required.food - currentFood);
            const needWater = Math.max(0, required.water - currentWater);
            const supplyCost = (needFood * foodPrice) + (needWater * waterPrice);

            // 購入できる最大数量を計算
            const availableGold = this.gold - supplyCost;
            if (availableGold < topGood.buyPrice) continue;

            const maxByMoney = Math.floor(availableGold / topGood.buyPrice);
            const maxByCargo = this.getCargoSpace() - needFood - needWater;
            const maxByStock = topGood.stock;
            const maxQuantity = Math.min(maxByMoney, maxByCargo, maxByStock);

            if (maxQuantity < 1) continue;

            const totalProfit = maxQuantity * topGood.profitPerUnit;
            const profitPerDay = totalProfit / travelDays;

            if (profitPerDay > bestProfit) {
                bestProfit = profitPerDay;
                bestTrade = {
                    destination: destPortId,
                    good: topGood.goodId,
                    quantity: maxQuantity,
                    totalProfit,
                    travelDays,
                    profitPerDay,
                    supplyCost
                };
            }
        }

        return bestTrade;
    }

    // 自動最適化取引を実行
    executeOptimalTrade() {
        const trade = this.findBestTrade();
        if (!trade) return null;

        // 商品を購入
        const bought = this.buyGood(trade.good, trade.quantity);
        if (bought !== trade.quantity) {
            trade.quantity = bought;
            trade.totalProfit = bought * (trade.totalProfit / trade.quantity);
        }

        // 旅行
        const traveled = this.travel(trade.destination);
        if (!traveled) return null;

        // 商品を売却
        const revenue = this.sellGood(trade.good);

        return {
            ...trade,
            actualRevenue: revenue
        };
    }

    logState(message) {
        this.history.push({
            message,
            day: this.gameTime,
            gold: this.gold,
            port: ports[this.currentPort].name,
            ship: this.ship.name
        });
    }
}

// テストシナリオの定義
const testScenarios = [
    {
        name: '初期フェーズ進行テスト（0-100日）',
        test: (sim) => {
            sim.reset();
            sim.logState('ゲーム開始');

            let trades = 0;
            while (sim.gameTime < 100 && trades < 50) {
                const trade = sim.executeOptimalTrade();
                if (!trade) break;
                trades++;

                // 船をアップグレード可能なら実行
                if (sim.gold >= 5000 && sim.ship.name === 'カラベル船') {
                    sim.upgradeShip(1);
                    sim.logState('キャラック船にアップグレード');
                }
            }

            sim.logState('初期フェーズ終了');

            return {
                success: sim.gameTime <= 100 && sim.gold >= 5000,
                finalGold: sim.gold,
                finalDay: sim.gameTime,
                trades: trades,
                details: `最終資金: ${sim.gold}G, 日数: ${sim.gameTime}日, 取引回数: ${trades}`
            };
        }
    },
    {
        name: '全船アップグレード達成テスト',
        test: (sim) => {
            sim.reset();
            sim.logState('ゲーム開始');

            const targetShips = [5000, 15000, 50000];
            const achieved = [];
            let trades = 0;

            while (sim.gameTime < 1000 && achieved.length < targetShips.length && trades < 500) {
                const trade = sim.executeOptimalTrade();
                if (!trade) break;
                trades++;

                // 船をアップグレード
                for (let i = 1; i < shipUpgrades.length; i++) {
                    const upgrade = shipUpgrades[i];
                    if (sim.gold >= upgrade.cost && sim.ship.name !== upgrade.name) {
                        const currentIndex = shipUpgrades.findIndex(s => s.name === sim.ship.name);
                        if (i === currentIndex + 1) {
                            if (sim.upgradeShip(i)) {
                                achieved.push({ ship: upgrade.name, day: sim.gameTime, cost: upgrade.cost });
                                sim.logState(`${upgrade.name}にアップグレード`);
                            }
                        }
                    }
                }
            }

            sim.logState('テスト終了');

            return {
                success: achieved.length === targetShips.length,
                finalGold: sim.gold,
                finalDay: sim.gameTime,
                achievedUpgrades: achieved.length,
                details: achieved.map(a => `${a.ship} (${a.day}日目)`).join(', '),
                trades: trades
            };
        }
    },
    {
        name: '遠距離航路テスト（リスボン↔長崎）',
        test: (sim) => {
            sim.reset();
            sim.gold = 10000; // 十分な資金でスタート
            sim.logState('遠距離航路テスト開始');

            // まず長崎に行けるか
            const profitsToNagasaki = sim.calculateProfitForPort('nagasaki');
            const baseDays = portDistances['lisbon']['nagasaki'];
            const travelDays = Math.max(1, Math.round(baseDays / sim.ship.speed));
            const required = sim.calculateRequiredSupplies(travelDays);

            // 商品を購入
            let boughtItems = [];
            if (profitsToNagasaki.length > 0) {
                const topGood = profitsToNagasaki[0];
                const bought = sim.buyGood(topGood.goodId, 10);
                boughtItems.push({ good: goods[topGood.goodId].name, quantity: bought });
            }

            // 長崎へ旅行
            const goldBefore = sim.gold;
            const traveled = sim.travel('nagasaki');

            if (!traveled) {
                return {
                    success: false,
                    details: `長崎へ旅行できませんでした。必要物資: 食糧${required.food}, 水${required.water}`
                };
            }

            sim.logState('長崎到着');

            // 長崎から戻る
            const profitsFromNagasaki = sim.calculateProfitForPort('lisbon');
            if (profitsFromNagasaki.length > 0) {
                const topGood = profitsFromNagasaki[0];
                const bought = sim.buyGood(topGood.goodId, 10);
                boughtItems.push({ good: goods[topGood.goodId].name, quantity: bought });
            }

            const returnTraveled = sim.travel('lisbon');
            sim.logState('リスボン帰還');

            // 商品を売却
            let totalRevenue = 0;
            for (const goodId in sim.inventory) {
                if (sim.inventory[goodId] > 0 && goodId !== 'food' && goodId !== 'water') {
                    totalRevenue += sim.sellGood(goodId);
                }
            }

            const profit = sim.gold - goldBefore;

            return {
                success: traveled && returnTraveled && profit > 0,
                finalGold: sim.gold,
                profit: profit,
                travelDays: sim.gameTime,
                details: `往復${sim.gameTime}日、利益: ${profit}G`
            };
        }
    },
    {
        name: '小規模港（長崎）在庫システムテスト',
        test: (sim) => {
            sim.reset();
            sim.gold = 50000;
            sim.currentPort = 'nagasaki';
            sim.logState('長崎在庫テスト開始');

            const initialStock = sim.portInventory['nagasaki']['silk'];

            // 在庫を枯渇させる
            let boughtTotal = 0;
            while (sim.portInventory['nagasaki']['silk'] > 0) {
                const bought = sim.buyGood('silk', 10);
                if (bought === 0) break;
                boughtTotal += bought;
            }

            const stockAfterBuy = sim.portInventory['nagasaki']['silk'];
            sim.logState(`絹を${boughtTotal}個購入、在庫残: ${stockAfterBuy}`);

            // 時間経過で回復させる
            const refreshRate = inventorySettings['small'].refreshRate;
            const daysToRecover = 5;
            sim.gameTime += daysToRecover;
            sim.refreshPortInventory(daysToRecover);

            const stockAfterRecover = sim.portInventory['nagasaki']['silk'];
            const expectedRecovery = Math.min(inventorySettings['small'].maxStock, stockAfterBuy + (refreshRate * daysToRecover));

            sim.logState(`${daysToRecover}日経過後、在庫: ${stockAfterRecover}`);

            return {
                success: stockAfterRecover > stockAfterBuy && stockAfterRecover <= inventorySettings['small'].maxStock,
                initialStock,
                boughtTotal,
                stockAfterBuy,
                stockAfterRecover,
                expectedRecovery,
                details: `初期${initialStock} → 購入後${stockAfterBuy} → ${daysToRecover}日後${stockAfterRecover} (期待値${expectedRecovery})`
            };
        }
    },
    {
        name: '全港訪問可能性テスト',
        test: (sim) => {
            sim.reset();
            sim.logState('全港訪問テスト開始');

            const visitedPorts = new Set(['lisbon']);
            const portsToVisit = Object.keys(ports).filter(p => p !== 'lisbon');
            let attempts = 0;
            const maxAttempts = 100;

            while (visitedPorts.size < Object.keys(ports).length && attempts < maxAttempts) {
                attempts++;

                // 未訪問の港を探す
                let bestPort = null;
                let bestProfitPerDay = 0;

                for (const portId of portsToVisit) {
                    if (visitedPorts.has(portId)) continue;

                    const profits = sim.calculateProfitForPort(portId);
                    if (profits.length === 0) continue;

                    const baseDays = portDistances[sim.currentPort][portId];
                    const travelDays = Math.max(1, Math.round(baseDays / sim.ship.speed));
                    const profitPerDay = profits[0].profitPerUnit / travelDays;

                    if (profitPerDay > bestProfitPerDay) {
                        bestProfitPerDay = profitPerDay;
                        bestPort = portId;
                    }
                }

                if (bestPort) {
                    // 商品を購入して旅行
                    const profits = sim.calculateProfitForPort(bestPort);
                    if (profits.length > 0) {
                        sim.buyGood(profits[0].goodId, 10);
                    }

                    if (sim.travel(bestPort)) {
                        visitedPorts.add(bestPort);
                        sim.logState(`${ports[bestPort].name}訪問`);

                        // 商品を売却
                        for (const goodId in sim.inventory) {
                            if (sim.inventory[goodId] > 0 && goodId !== 'food' && goodId !== 'water') {
                                sim.sellGood(goodId);
                            }
                        }

                        // 船のアップグレード
                        for (let i = 1; i < shipUpgrades.length; i++) {
                            const upgrade = shipUpgrades[i];
                            const currentIndex = shipUpgrades.findIndex(s => s.name === sim.ship.name);
                            if (i === currentIndex + 1 && sim.gold >= upgrade.cost) {
                                sim.upgradeShip(i);
                                sim.logState(`${upgrade.name}にアップグレード`);
                            }
                        }
                    }
                } else {
                    // 他の港で取引して資金を貯める
                    const trade = sim.executeOptimalTrade();
                    if (!trade) break;
                }
            }

            return {
                success: visitedPorts.size === Object.keys(ports).length,
                visitedCount: visitedPorts.size,
                totalPorts: Object.keys(ports).length,
                finalDay: sim.gameTime,
                finalGold: sim.gold,
                details: `訪問した港: ${Array.from(visitedPorts).map(p => ports[p].name).join(', ')}`
            };
        }
    },
    {
        name: '最大利益商品・ルート分析',
        test: (sim) => {
            sim.reset();
            sim.gold = 100000; // 制限なしで分析

            const profitAnalysis = [];

            for (const fromPort in ports) {
                for (const toPort in ports) {
                    if (fromPort === toPort) continue;

                    sim.currentPort = fromPort;
                    const profits = sim.calculateProfitForPort(toPort);

                    if (profits.length > 0) {
                        const topGood = profits[0];
                        const baseDays = portDistances[fromPort][toPort];
                        const travelDays = Math.max(1, Math.round(baseDays / sim.ship.speed));

                        profitAnalysis.push({
                            route: `${ports[fromPort].name} → ${ports[toPort].name}`,
                            good: goods[topGood.goodId].name,
                            buyPrice: topGood.buyPrice,
                            sellPrice: topGood.sellPrice,
                            profit: topGood.profitPerUnit,
                            margin: topGood.profitMargin,
                            days: travelDays,
                            profitPerDay: topGood.profitPerUnit / travelDays
                        });
                    }
                }
            }

            // 利益率順にソート
            profitAnalysis.sort((a, b) => b.margin - a.margin);
            const top5ByMargin = profitAnalysis.slice(0, 5);

            // 日毎利益順にソート
            profitAnalysis.sort((a, b) => b.profitPerDay - a.profitPerDay);
            const top5ByProfitPerDay = profitAnalysis.slice(0, 5);

            return {
                success: true,
                top5ByMargin: top5ByMargin.map(p => `${p.route}: ${p.good} (利益率${p.margin.toFixed(1)}%)`),
                top5ByProfitPerDay: top5ByProfitPerDay.map(p => `${p.route}: ${p.good} (${p.profitPerDay.toFixed(1)}G/日)`),
                details: '最も効率の良い取引ルートを分析しました'
            };
        }
    },
    {
        name: '長期プレイ（500日）安定性テスト',
        test: (sim) => {
            sim.reset();
            sim.logState('長期プレイテスト開始');

            const checkpoints = [100, 200, 300, 400, 500];
            const checkpointData = [];
            let trades = 0;

            while (sim.gameTime < 500 && trades < 1000) {
                const trade = sim.executeOptimalTrade();
                if (!trade) break;
                trades++;

                // 船のアップグレード
                for (let i = 1; i < shipUpgrades.length; i++) {
                    const upgrade = shipUpgrades[i];
                    const currentIndex = shipUpgrades.findIndex(s => s.name === sim.ship.name);
                    if (i === currentIndex + 1 && sim.gold >= upgrade.cost) {
                        sim.upgradeShip(i);
                        sim.logState(`${upgrade.name}にアップグレード (${sim.gameTime}日目)`);
                    }
                }

                // チェックポイントでデータを記録
                for (const checkpoint of checkpoints) {
                    if (sim.gameTime >= checkpoint && !checkpointData.find(c => c.day === checkpoint)) {
                        checkpointData.push({
                            day: checkpoint,
                            gold: sim.gold,
                            ship: sim.ship.name,
                            trades: trades
                        });
                    }
                }
            }

            sim.logState('長期プレイテスト終了');

            // 資金が順調に増えているか確認
            const goldProgression = checkpointData.every((data, i) => {
                if (i === 0) return true;
                return data.gold >= checkpointData[i - 1].gold * 0.8; // 多少の減少は許容
            });

            return {
                success: sim.gameTime >= 500 && goldProgression && sim.gold > 1000,
                finalGold: sim.gold,
                finalDay: sim.gameTime,
                finalShip: sim.ship.name,
                trades: trades,
                checkpoints: checkpointData.map(c => `${c.day}日: ${c.gold}G (${c.ship})`).join(', '),
                details: `500日プレイ完了。最終資金: ${sim.gold}G`
            };
        }
    },
    {
        name: '物資コスト妥当性テスト',
        test: (sim) => {
            sim.reset();

            const supplyCostAnalysis = [];

            for (const fromPort in ports) {
                for (const toPort in ports) {
                    if (fromPort === toPort) continue;

                    sim.currentPort = fromPort;
                    const baseDays = portDistances[fromPort][toPort];
                    const travelDays = Math.max(1, Math.round(baseDays / sim.ship.speed));
                    const required = sim.calculateRequiredSupplies(travelDays);

                    const foodPrice = sim.getPrice(fromPort, 'food', true);
                    const waterPrice = sim.getPrice(fromPort, 'water', true);
                    const supplyCost = (required.food * foodPrice) + (required.water * waterPrice);

                    const profits = sim.calculateProfitForPort(toPort);
                    if (profits.length > 0) {
                        const topProfit = profits[0];
                        const profitPerUnit = topProfit.profitPerUnit;
                        const itemsNeededToCoverSupplies = Math.ceil(supplyCost / profitPerUnit);
                        const percentageOfCapacity = (itemsNeededToCoverSupplies / sim.ship.capacity) * 100;

                        supplyCostAnalysis.push({
                            route: `${ports[fromPort].name} → ${ports[toPort].name}`,
                            days: travelDays,
                            supplyCost,
                            itemsNeeded: itemsNeededToCoverSupplies,
                            capacity: sim.ship.capacity,
                            percentage: percentageOfCapacity,
                            reasonable: percentageOfCapacity < 50 // 積載量の50%未満なら妥当
                        });
                    }
                }
            }

            // 最も物資コストが高いルート
            supplyCostAnalysis.sort((a, b) => b.percentage - a.percentage);
            const worstRoutes = supplyCostAnalysis.slice(0, 5);
            const reasonableCount = supplyCostAnalysis.filter(r => r.reasonable).length;
            const unreasonableCount = supplyCostAnalysis.length - reasonableCount;

            return {
                success: unreasonableCount < supplyCostAnalysis.length * 0.2, // 20%未満なら合格
                totalRoutes: supplyCostAnalysis.length,
                reasonableCount,
                unreasonableCount,
                worstRoutes: worstRoutes.map(r => `${r.route}: ${r.percentage.toFixed(1)}%の積載量が必要`),
                details: `物資コストが妥当なルート: ${reasonableCount}/${supplyCostAnalysis.length}`
            };
        }
    },
    {
        name: '在庫回復速度適切性テスト',
        test: (sim) => {
            sim.reset();
            sim.gold = 100000;

            const recoveryTests = [];

            for (const portId in ports) {
                const portSize = ports[portId].size;
                const maxStock = inventorySettings[portSize].maxStock;
                const refreshRate = inventorySettings[portSize].refreshRate;

                // 在庫を50%消費
                const targetConsumption = Math.floor(maxStock * 0.5);
                sim.portInventory[portId]['wine'] = maxStock - targetConsumption;

                // 回復にかかる日数を計算
                const daysToFull = Math.ceil(targetConsumption / refreshRate);

                // 実際に回復させる
                const beforeStock = sim.portInventory[portId]['wine'];
                sim.refreshPortInventory(daysToFull);
                const afterStock = sim.portInventory[portId]['wine'];

                recoveryTests.push({
                    port: ports[portId].name,
                    size: portSize,
                    maxStock,
                    refreshRate,
                    consumed: targetConsumption,
                    daysToFull,
                    beforeStock,
                    afterStock,
                    recovered: afterStock >= maxStock * 0.95 // 95%以上回復すれば合格
                });

                // リセット
                sim.portInventory[portId]['wine'] = maxStock;
            }

            const allRecovered = recoveryTests.every(t => t.recovered);

            return {
                success: allRecovered,
                tests: recoveryTests.map(t => `${t.port} (${t.size}): ${t.daysToFull}日で回復`),
                details: `すべての港で在庫が適切に回復: ${allRecovered ? 'はい' : 'いいえ'}`
            };
        }
    }
];

// すべてのテストを実行
function runAllTests() {
    console.log('='.repeat(80));
    console.log('ゲームバランス包括的シミュレーション開始');
    console.log('='.repeat(80));
    console.log('');

    const results = [];

    for (const scenario of testScenarios) {
        console.log(`[テスト] ${scenario.name}`);
        console.log('-'.repeat(80));

        const sim = new GameSimulator();
        const result = scenario.test(sim);

        results.push({
            name: scenario.name,
            ...result
        });

        console.log(`結果: ${result.success ? '✅ 合格' : '❌ 不合格'}`);
        console.log(`詳細: ${result.details || 'なし'}`);

        // 追加情報を表示
        if (result.finalGold !== undefined) {
            console.log(`最終資金: ${result.finalGold}G`);
        }
        if (result.finalDay !== undefined) {
            console.log(`経過日数: ${result.finalDay}日`);
        }
        if (result.top5ByMargin) {
            console.log('\n【最高利益率TOP5】');
            result.top5ByMargin.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
        }
        if (result.top5ByProfitPerDay) {
            console.log('\n【日毎利益TOP5】');
            result.top5ByProfitPerDay.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
        }
        if (result.worstRoutes) {
            console.log('\n【物資コストが高いルートTOP5】');
            result.worstRoutes.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
        }
        if (result.tests) {
            console.log('\n【在庫回復テスト結果】');
            result.tests.forEach(test => console.log(`  ${test}`));
        }

        console.log('');
    }

    // 総合結果
    console.log('='.repeat(80));
    console.log('総合結果');
    console.log('='.repeat(80));

    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    const passRate = (passedTests / totalTests * 100).toFixed(1);

    console.log(`合格: ${passedTests} / ${totalTests} (${passRate}%)`);
    console.log('');

    // 不合格のテストを列挙
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
        console.log('【不合格テスト】');
        failedTests.forEach(test => {
            console.log(`  ❌ ${test.name}`);
            console.log(`     理由: ${test.details || '不明'}`);
        });
        console.log('');
    }

    // 推奨事項
    console.log('【推奨事項】');
    if (passedTests === totalTests) {
        console.log('  ✅ すべてのテストに合格しました！ゲームバランスは良好です。');
    } else {
        console.log('  ⚠️  いくつかのテストが不合格です。以下を確認してください:');

        if (failedTests.find(t => t.name.includes('初期フェーズ'))) {
            console.log('     - 初期資金またはアップグレードコストの調整を検討');
        }
        if (failedTests.find(t => t.name.includes('遠距離航路'))) {
            console.log('     - 物資コストまたは遠距離航路の価格差を調整');
        }
        if (failedTests.find(t => t.name.includes('在庫'))) {
            console.log('     - 港の在庫量または回復速度を調整');
        }
        if (failedTests.find(t => t.name.includes('全港訪問'))) {
            console.log('     - すべての港へのアクセス性を改善');
        }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('シミュレーション完了');
    console.log('='.repeat(80));

    return results;
}

// Node.js環境で実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameSimulator, runAllTests };
}

// ブラウザまたは直接実行の場合
if (typeof window === 'undefined') {
    runAllTests();
}
