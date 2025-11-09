// Autopilot configuration constants
export const AUTOPILOT_CONFIG = {
    SAFETY_RESERVE: 50,            // Reserve gold for emergencies (reduced for more aggressive trading)
    CARGO_UTILIZATION_RATIO: 0.98, // Use 98% of available cargo/money for trading (increased from 90% to maximize profit)
    MINIMUM_PROFIT_THRESHOLD: 50,  // Minimum expected profit to execute trade (reduced from 100 to catch more opportunities)
    PROFIT_IMPROVEMENT_RATIO: 0.05,// Require 5% better profit to travel for selling (reduced from 10% for more aggressive movement)
    MINIMUM_PURCHASE_MULTIPLIER: 5,// Must afford at least 5 units to buy
    MINIMUM_CARGO_SPACE: 10,       // Minimum cargo space needed to buy
    MAX_ESTIMATED_QUANTITY: 100,   // Maximum quantity to estimate for profitability calculation (increased from 50)
    STOCK_WAIT_THRESHOLD: 0.90     // Wait for inventory if stock is less than 90% of desired purchase quantity
};

// Port Definitions (based on historical 15-16th century city sizes)
export const ports = {
    lisbon: {
        name: 'リスボン',
        emoji: '🇵🇹',
        description: 'ポルトガルの首都。冒険の始まりの地。',
        size: 'large', // 大規模港 (人口10万人以上、大航海時代の中心地)
        historicalNote: '15世紀末から16世紀にかけて、大航海時代の中心として急成長。人口10万人超。',
        x: 39,  // Map coordinates (38.74°N, -9.14°W)
        y: 135
    },
    seville: {
        name: 'セビリア',
        emoji: '🇪🇸',
        description: 'スペインの港町。新大陸への玄関口。',
        size: 'large', // 大規模港 (新大陸貿易独占港、人口10万人規模)
        historicalNote: '16世紀、新大陸との貿易を独占し、スペイン随一の商業都市に成長。',
        x: 60,  // 37.38°N, -5.97°W
        y: 151
    },
    venice: {
        name: 'ヴェネツィア',
        emoji: '🇮🇹',
        description: '水の都。東方貿易の中心地。',
        size: 'very_large', // 最大規模港 (人口15-18万人、当時のヨーロッパ最大級都市)
        historicalNote: '15世紀、人口15-18万人を擁し、地中海貿易を支配する最大級の商業共和国。',
        x: 182,  // 45.44°N, 12.33°E
        y: 55
    },
    alexandria: {
        name: 'アレクサンドリア',
        emoji: '🇪🇬',
        description: 'エジプトの古都。香辛料の集積地。',
        size: 'medium', // 中規模港 (マムルーク朝/オスマン朝下で往時より衰退)
        historicalNote: '15世紀マムルーク朝下で往時の栄華からは衰退も、依然として香辛料貿易の要衝。',
        x: 300,  // 31.21°N, 29.92°E
        y: 226
    },
    calicut: {
        name: 'カリカット',
        emoji: '🇮🇳',
        description: 'インドの港町。胡椒の産地。',
        size: 'medium', // 中規模港 (インド西海岸の重要な香辛料貿易港)
        historicalNote: '15-16世紀、インド西海岸最大の香辛料貿易港。ヴァスコ・ダ・ガマが到達。',
        x: 605,  // 11.26°N, 75.78°E
        y: 465
    },
    malacca: {
        name: 'マラッカ',
        emoji: '🇲🇾',
        description: '東南アジアの交易拠点。',
        size: 'medium', // 中規模港 (マラッカ王国の首都、東南アジア貿易の中心)
        historicalNote: '15世紀、マラッカ王国の首都として東西貿易の要衝。1511年ポルトガルに征服。',
        x: 782,  // 2.20°N, 102.24°E
        y: 574
    },
    nagasaki: {
        name: '長崎',
        emoji: '🇯🇵',
        description: '日本の港町。銀と絹の取引が盛ん。',
        size: 'small', // 小規模港 (16世紀半ばまで小さな漁村、1570年代に貿易港化)
        historicalNote: '1570年代、ポルトガル貿易の拠点として開港。それまでは小さな漁村。',
        x: 966,  // 32.75°N, 129.88°E
        y: 207
    }
};

// Port distances (in days of travel at speed 1.0)
export const portDistances = {
    lisbon: { lisbon: 0, seville: 2, venice: 5, alexandria: 7, calicut: 15, malacca: 20, nagasaki: 30 },
    seville: { lisbon: 2, seville: 0, venice: 5, alexandria: 6, calicut: 14, malacca: 19, nagasaki: 29 },
    venice: { lisbon: 5, seville: 5, venice: 0, alexandria: 3, calicut: 12, malacca: 17, nagasaki: 27 },
    alexandria: { lisbon: 7, seville: 6, venice: 3, alexandria: 0, calicut: 10, malacca: 15, nagasaki: 25 },
    calicut: { lisbon: 15, seville: 14, venice: 12, alexandria: 10, calicut: 0, malacca: 5, nagasaki: 15 },
    malacca: { lisbon: 20, seville: 19, venice: 17, alexandria: 15, calicut: 5, malacca: 0, nagasaki: 10 },
    nagasaki: { lisbon: 30, seville: 29, venice: 27, alexandria: 25, calicut: 15, malacca: 10, nagasaki: 0 }
};

// Sea routes with waypoints to avoid land
// Each route is defined as an array of waypoints [x, y]
// Ports: Lisbon(39,135), Seville(60,151), Venice(182,55), Alexandria(300,226), Calicut(605,465), Malacca(782,574), Nagasaki(966,207)
export const seaRoutes = {
    // From Lisbon
    'lisbon-seville': [[39, 135], [50, 143], [60, 151]],
    'lisbon-venice': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55]],
    'lisbon-alexandria': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55], [250, 150], [300, 226]],
    'lisbon-calicut': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 465]],
    'lisbon-malacca': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [782, 574]],
    'lisbon-nagasaki': [[39, 135], [39, 80], [100, 60], [140, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Seville
    'seville-venice': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55]],
    'seville-alexandria': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55], [250, 150], [300, 226]],
    'seville-calicut': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 465]],
    'seville-malacca': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [782, 574]],
    'seville-nagasaki': [[60, 151], [60, 80], [120, 60], [160, 50], [182, 55], [250, 150], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Venice
    'venice-alexandria': [[182, 55], [220, 140], [260, 200], [300, 226]],
    'venice-calicut': [[182, 55], [220, 140], [260, 200], [300, 226], [350, 330], [420, 420], [520, 480], [605, 465]],
    'venice-malacca': [[182, 55], [220, 140], [260, 200], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [782, 574]],
    'venice-nagasaki': [[182, 55], [220, 140], [260, 200], [300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Alexandria
    'alexandria-calicut': [[300, 226], [350, 330], [420, 420], [520, 480], [605, 465]],
    'alexandria-malacca': [[300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [782, 574]],
    'alexandria-nagasaki': [[300, 226], [350, 330], [420, 420], [520, 480], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Calicut
    'calicut-malacca': [[605, 465], [605, 540], [695, 590], [782, 574]],
    'calicut-nagasaki': [[605, 465], [605, 540], [695, 590], [850, 520], [930, 350], [966, 207]],

    // From Malacca
    'malacca-nagasaki': [[782, 574], [850, 520], [930, 350], [966, 207]]
};

// Inventory settings by port size (based on historical trade volume)
export const inventorySettings = {
    small: { maxStock: 30, refreshRate: 3 },      // 小規模港: 最大30個、1日3個回復 (長崎)
    medium: { maxStock: 60, refreshRate: 5 },     // 中規模港: 最大60個、1日5個回復 (アレクサンドリア、カリカット、マラッカ)
    large: { maxStock: 100, refreshRate: 8 },     // 大規模港: 最大100個、1日8個回復 (リスボン、セビリア)
    very_large: { maxStock: 150, refreshRate: 12 } // 最大規模港: 最大150個、1日12個回復 (ヴェネツィア)
};

// Goods Definitions with base prices
export const goods = {
    wine: { name: 'ワイン', emoji: '🍷', basePrice: 50 },
    cloth: { name: '織物', emoji: '🧵', basePrice: 80 },
    spices: { name: '香辛料', emoji: '🌶️', basePrice: 150 },
    silk: { name: '絹', emoji: '🎀', basePrice: 200 },
    gold_ore: { name: '金鉱石', emoji: '🏆', basePrice: 300 },
    porcelain: { name: '陶器', emoji: '🏺', basePrice: 120 },
    tea: { name: '茶', emoji: '🍵', basePrice: 100 },
    silver: { name: '銀', emoji: '💍', basePrice: 250 },
    // Essential supplies (reduced prices for better game balance)
    food: { name: '食糧', emoji: '🍖', basePrice: 2 },
    water: { name: '水', emoji: '💧', basePrice: 1 }
};

// Weather system
export const weatherTypes = {
    sunny: {
        name: '晴天',
        emoji: '☀️',
        speedMultiplier: 1.0,
        description: '穏やかな航海日和',
        probability: 0.4
    },
    favorable: {
        name: '順風',
        emoji: '🌬️',
        speedMultiplier: 1.2,
        description: '追い風を受けて快調',
        probability: 0.2
    },
    westerlies: {
        name: '偏西風',
        emoji: '🍃',
        speedMultiplier: 0.9, // Will vary by direction
        description: '強い西風が吹いている',
        probability: 0.15
    },
    rain: {
        name: '雨',
        emoji: '🌧️',
        speedMultiplier: 0.8,
        description: '視界が悪く速度が落ちる',
        probability: 0.15
    },
    storm: {
        name: '嵐',
        emoji: '⛈️',
        speedMultiplier: 0.6,
        description: '激しい嵐で大幅に遅延',
        probability: 0.1
    }
};

// Port-specific price modifiers (multipliers)
export const portPrices = {
    lisbon: { wine: 0.8, cloth: 1.0, spices: 2.1, silk: 1.9, gold_ore: 1.5, porcelain: 1.5, tea: 1.6, silver: 1.4, food: 1.0, water: 1.0 },
    seville: { wine: 0.9, cloth: 0.9, spices: 1.9, silk: 1.8, gold_ore: 0.7, porcelain: 1.6, tea: 1.5, silver: 1.3, food: 0.9, water: 0.9 },
    venice: { wine: 1.1, cloth: 0.7, spices: 1.6, silk: 1.4, gold_ore: 1.6, porcelain: 1.4, tea: 1.4, silver: 1.5, food: 1.1, water: 1.0 },
    alexandria: { wine: 1.2, cloth: 1.1, spices: 0.9, silk: 1.2, gold_ore: 1.4, porcelain: 1.3, tea: 1.2, silver: 1.4, food: 1.2, water: 1.3 },
    calicut: { wine: 1.5, cloth: 1.3, spices: 0.6, silk: 1.0, gold_ore: 1.3, porcelain: 1.2, tea: 0.9, silver: 1.2, food: 1.0, water: 1.1 },
    malacca: { wine: 1.6, cloth: 1.4, spices: 0.8, silk: 0.9, gold_ore: 1.2, porcelain: 1.0, tea: 0.8, silver: 1.1, food: 1.1, water: 1.2 },
    nagasaki: { wine: 1.8, cloth: 1.5, spices: 1.3, silk: 0.7, gold_ore: 1.5, porcelain: 0.8, tea: 0.7, silver: 0.6, food: 1.3, water: 1.2 }
};

// Ship upgrades
export const shipUpgrades = [
    {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        cost: 0,
        crew: 20,
        description: '小型で機動性の高い船'
    },
    {
        name: 'キャラック船',
        capacity: 200,
        speed: 1.2,
        cost: 5000,
        crew: 40,
        description: '大型で積載量が多い船'
    },
    {
        name: 'ガレオン船',
        capacity: 300,
        speed: 1.5,
        cost: 15000,
        crew: 60,
        description: '最大級の貿易船'
    },
    {
        name: '東インド会社船',
        capacity: 500,
        speed: 2,
        cost: 50000,
        crew: 100,
        description: '伝説の大型貿易船'
    }
];

// Get sea route between two ports (with waypoints to avoid land)
export function getSeaRoute(fromPortId, toPortId) {
    // Direct route key
    const routeKey = `${fromPortId}-${toPortId}`;
    if (seaRoutes[routeKey]) {
        return seaRoutes[routeKey];
    }

    // Reverse route key
    const reverseRouteKey = `${toPortId}-${fromPortId}`;
    if (seaRoutes[reverseRouteKey]) {
        return [...seaRoutes[reverseRouteKey]].reverse();
    }

    // No predefined route, return direct line
    const fromPort = ports[fromPortId];
    const toPort = ports[toPortId];
    return [[fromPort.x, fromPort.y], [toPort.x, toPort.y]];
}
