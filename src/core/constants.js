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
        maxDurability: 100,
        combatPower: 10,
        description: '小型で機動性の高い船'
    },
    {
        name: 'キャラック船',
        capacity: 200,
        speed: 1.2,
        cost: 5000,
        crew: 40,
        maxDurability: 150,
        combatPower: 25,
        description: '大型で積載量が多い船'
    },
    {
        name: 'ガレオン船',
        capacity: 300,
        speed: 1.5,
        cost: 15000,
        crew: 60,
        maxDurability: 200,
        combatPower: 50,
        description: '最大級の貿易船'
    },
    {
        name: '東インド会社船',
        capacity: 500,
        speed: 2,
        cost: 50000,
        crew: 100,
        maxDurability: 300,
        combatPower: 80,
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

// Facility definitions for port investment system
export const FACILITIES = {
    warehouse: {
        name: '倉庫',
        icon: '🏪',
        maxLevel: 3,
        costs: [5000, 10000, 20000],
        effects: [
            { storage: 50 },
            { storage: 100 },
            { storage: 150 }
        ],
        description: '商品を保管できるスペースが増える'
    },
    tradingPost: {
        name: '商館',
        icon: '🏛️',
        maxLevel: 2,
        costs: [10000, 20000],
        effects: [
            { priceBonus: 0.05 },  // 5%
            { priceBonus: 0.10 }   // 10%
        ],
        description: '取引価格が優遇される'
    },
    shipyard: {
        name: '造船所',
        icon: '⚓',
        maxLevel: 1,
        costs: [15000],
        effects: [
            { repairAvailable: true }
        ],
        description: '船の修理が可能（将来の拡張用）'
    },
    market: {
        name: '市場拡張',
        icon: '🏬',
        maxLevel: 2,
        costs: [8000, 16000],
        effects: [
            { stockBonus: 0.25 },  // 25%
            { stockBonus: 0.50 }   // 50%
        ],
        description: '港の在庫上限と回復速度が向上'
    }
};

// Reputation levels based on total investment in a port
export const REPUTATION_LEVELS = [
    { level: 0, name: '無名', minInvestment: 0 },
    { level: 1, name: '知人', minInvestment: 10000 },
    { level: 2, name: '友人', minInvestment: 30000 },
    { level: 3, name: '名士', minInvestment: 60000 },
    { level: 4, name: '支配者', minInvestment: 100000 }
];

// Random Events during voyage
export const RANDOM_EVENTS = {
    // 海賊遭遇
    pirate: {
        id: 'pirate',
        name: '海賊遭遇',
        emoji: '🏴‍☠️',
        probability: 0.15,
        description: '海賊船が接近してきた！',
        choices: [
            {
                id: 'fight',
                text: '⚔️ 戦う',
                description: '勝利すれば報酬、敗北すれば損害'
            },
            {
                id: 'flee',
                text: '🏃 逃げる',
                description: '速度が高いほど成功しやすい'
            },
            {
                id: 'pay',
                text: '💰 身代金を払う',
                description: '所持金の10-20%を支払う'
            }
        ]
    },
    // 漂流者発見
    castaway: {
        id: 'castaway',
        name: '漂流者発見',
        emoji: '🆘',
        probability: 0.10,
        description: '海に漂流者を発見した！',
        choices: [
            {
                id: 'rescue',
                text: '🤝 救助する',
                description: '感謝の報酬を得られるかも'
            },
            {
                id: 'ignore',
                text: '👀 無視する',
                description: '何も起こらない'
            }
        ]
    },
    // 沈没船発見
    shipwreck: {
        id: 'shipwreck',
        name: '沈没船発見',
        emoji: '🚢',
        probability: 0.08,
        description: '沈没した船を発見した！',
        choices: [
            {
                id: 'explore',
                text: '🔍 探索する',
                description: 'お宝を見つけるチャンス、ただしリスクも'
            },
            {
                id: 'leave',
                text: '➡️ 通り過ぎる',
                description: '安全に航海を続ける'
            }
        ]
    },
    // 謎の商人
    mysteriousMerchant: {
        id: 'mysteriousMerchant',
        name: '謎の商人',
        emoji: '🎭',
        probability: 0.10,
        description: '謎めいた商人の船と遭遇した！',
        choices: [
            {
                id: 'trade',
                text: '🤝 取引する',
                description: 'レアなアイテムを入手できるかも'
            },
            {
                id: 'decline',
                text: '✋ 断る',
                description: '怪しいので取引しない'
            }
        ]
    },
    // 嵐による積荷損失
    cargoLoss: {
        id: 'cargoLoss',
        name: '激しい嵐',
        emoji: '🌊',
        probability: 0.12,
        description: '激しい嵐で積荷が流された！',
        choices: [
            {
                id: 'accept',
                text: '😢 受け入れる',
                description: '一部の積荷を失う'
            }
        ]
    },
    // 人魚の加護
    mermaidBlessing: {
        id: 'mermaidBlessing',
        name: '人魚の歌',
        emoji: '🧜‍♀️',
        probability: 0.05,
        description: '美しい人魚の歌が聞こえてきた...',
        choices: [
            {
                id: 'listen',
                text: '👂 耳を傾ける',
                description: '幸運を授かるかも'
            },
            {
                id: 'ignore',
                text: '🙈 無視する',
                description: '罠かもしれない'
            }
        ]
    },
    // 幽霊船
    ghostShip: {
        id: 'ghostShip',
        name: '幽霊船',
        emoji: '👻',
        probability: 0.05,
        description: '霧の中に古びた船が現れた...',
        choices: [
            {
                id: 'board',
                text: '⚓ 乗り込む',
                description: '勇気があれば宝が見つかるかも'
            },
            {
                id: 'flee',
                text: '🏃 逃げる',
                description: '呪いを受ける可能性を避ける'
            }
        ]
    },
    // 港の祭り（到着時）
    festival: {
        id: 'festival',
        name: '港の祭り',
        emoji: '🎉',
        probability: 0.10,
        description: '港で盛大な祭りが開催されている！',
        choices: [
            {
                id: 'join',
                text: '🎊 参加する',
                description: '特別な取引機会があるかも'
            },
            {
                id: 'skip',
                text: '⏭️ 通常通り',
                description: '通常の取引を行う'
            }
        ]
    }
};

// Treasure/Rare Item definitions
export const TREASURES = {
    ancientMap: {
        id: 'ancientMap',
        name: '古代の地図',
        emoji: '🗺️',
        rarity: 'rare',
        description: '謎めいた場所を示す古い地図',
        effect: { type: 'bonus_gold_next_trade', value: 0.20 },
        usable: true
    },
    goldenCompass: {
        id: 'goldenCompass',
        name: '黄金の羅針盤',
        emoji: '🧭',
        rarity: 'legendary',
        description: '航海速度を永続的に向上させる',
        effect: { type: 'permanent_speed_bonus', value: 0.10 },
        usable: true
    },
    luckyCharm: {
        id: 'luckyCharm',
        name: '幸運のお守り',
        emoji: '🍀',
        rarity: 'uncommon',
        description: 'イベントで良い結果が出やすくなる',
        effect: { type: 'luck_bonus', value: 0.15 },
        usable: false
    },
    pirateFlag: {
        id: 'pirateFlag',
        name: '海賊旗',
        emoji: '🏴‍☠️',
        rarity: 'uncommon',
        description: '海賊に遭遇しにくくなる',
        effect: { type: 'pirate_protection', value: 0.50 },
        usable: false
    },
    merchantSeal: {
        id: 'merchantSeal',
        name: '商人ギルドの印章',
        emoji: '📜',
        rarity: 'rare',
        description: '取引時に有利な価格で交渉できる',
        effect: { type: 'trade_bonus', value: 0.05 },
        usable: false
    },
    mermaidTear: {
        id: 'mermaidTear',
        name: '人魚の涙',
        emoji: '💧',
        rarity: 'legendary',
        description: '使用すると船の耐久度を完全回復',
        effect: { type: 'full_repair', value: 1 },
        usable: true
    },
    phoenixFeather: {
        id: 'phoenixFeather',
        name: '不死鳥の羽',
        emoji: '🪶',
        rarity: 'legendary',
        description: '一度だけ海賊との戦闘で必ず勝利',
        effect: { type: 'guaranteed_victory', value: 1 },
        usable: true
    },
    royalCrown: {
        id: 'royalCrown',
        name: '王家の冠',
        emoji: '👑',
        rarity: 'legendary',
        description: '売却すると大金が手に入る',
        effect: { type: 'sell_value', value: 50000 },
        usable: true
    },
    ancientCoin: {
        id: 'ancientCoin',
        name: '古代のコイン',
        emoji: '🪙',
        rarity: 'uncommon',
        description: '売却するとそこそこの金が手に入る',
        effect: { type: 'sell_value', value: 500 },
        usable: true
    },
    cursedIdol: {
        id: 'cursedIdol',
        name: '呪いの偶像',
        emoji: '🗿',
        rarity: 'rare',
        description: '強力だが代償を伴う...',
        effect: { type: 'cursed', value: 0 },
        usable: true
    }
};

// Rarity colors and probabilities
export const RARITY_CONFIG = {
    common: { color: '#9e9e9e', name: 'コモン', dropWeight: 50 },
    uncommon: { color: '#4caf50', name: 'アンコモン', dropWeight: 30 },
    rare: { color: '#2196f3', name: 'レア', dropWeight: 15 },
    legendary: { color: '#ff9800', name: 'レジェンダリー', dropWeight: 5 }
};

// Achievement definitions
export const ACHIEVEMENTS = {
    // Wealth-based achievements
    apprentice: {
        id: 'apprentice',
        name: '見習い商人',
        description: '冒険の始まり',
        condition: { type: 'gold', value: 0 },
        bonus: null
    },
    merchant: {
        id: 'merchant',
        name: '商人',
        description: '10,000Gを達成',
        condition: { type: 'gold', value: 10000 },
        bonus: null
    },
    greatMerchant: {
        id: 'greatMerchant',
        name: '大商人',
        description: '50,000Gを達成',
        condition: { type: 'gold', value: 50000 },
        bonus: null
    },
    wealthyMerchant: {
        id: 'wealthyMerchant',
        name: '豪商',
        description: '100,000Gを達成',
        condition: { type: 'gold', value: 100000 },
        bonus: { type: 'allPrices', value: 0.02 }  // 全取引+2%
    },
    tradeKing: {
        id: 'tradeKing',
        name: '貿易王',
        description: '500,000Gを達成',
        condition: { type: 'gold', value: 500000 },
        bonus: { type: 'allPrices', value: 0.05 }  // 全取引+5%
    },
    seaLord: {
        id: 'seaLord',
        name: '海洋覇者',
        description: '1,000,000Gを達成',
        condition: { type: 'gold', value: 1000000 },
        bonus: { type: 'allPrices', value: 0.10 }  // 全取引+10%
    },

    // Action-based achievements
    worldTraveler: {
        id: 'worldTraveler',
        name: '世界一周',
        description: '全7港を訪問',
        condition: { type: 'portsVisited', value: 7 },
        bonus: { type: 'goldReward', value: 1000 }
    },
    spiceKing: {
        id: 'spiceKing',
        name: '香辛料王',
        description: '香辛料を累計500個取引',
        condition: { type: 'goodTraded', good: 'spices', value: 500 },
        bonus: { type: 'goodPrice', good: 'spices', value: 0.03 }  // 香辛料+3%
    },
    tradeMaster: {
        id: 'tradeMaster',
        name: '貿易マスター',
        description: '累計100回の航海',
        condition: { type: 'voyages', value: 100 },
        bonus: { type: 'supplyCost', value: -0.10 }  // 補給費用-10%
    },
    investor: {
        id: 'investor',
        name: '投資家',
        description: '全港に少なくとも1つの施設を建設',
        condition: { type: 'facilitiesInAllPorts', value: 1 },
        bonus: { type: 'allPrices', value: 0.02 }  // 全港+2%
    },
    portRuler: {
        id: 'portRuler',
        name: '港の支配者',
        description: '1つの港で名声レベル最大',
        condition: { type: 'maxReputationInOnePort', value: 4 },
        bonus: { type: 'specialBonus', description: 'その港で特別ボーナス' }
    }
};

// Natural Disaster definitions
export const DISASTERS = {
    earthquake: {
        id: 'earthquake',
        name: '大地震',
        emoji: '🌋',
        probability: 0.02, // 2% chance per day per port
        duration: 10, // days to fully recover
        effects: {
            priceMultiplier: 1.5, // prices increase 50%
            stockReduction: 0.5 // stocks reduced by 50%
        },
        description: '大地震が発生し、港が混乱している'
    },
    fire: {
        id: 'fire',
        name: '大火災',
        emoji: '🔥',
        probability: 0.03, // 3% chance per day per port
        duration: 7,
        effects: {
            priceMultiplier: 1.3,
            stockReduction: 0.3
        },
        description: '大火災が発生し、倉庫が焼失した'
    },
    tsunami: {
        id: 'tsunami',
        name: '津波',
        emoji: '🌊',
        probability: 0.015, // 1.5% chance per day per port
        duration: 14,
        effects: {
            priceMultiplier: 1.8,
            stockReduction: 0.7
        },
        description: '大津波が港を襲い、甚大な被害が出た'
    },
    plague: {
        id: 'plague',
        name: '疫病',
        emoji: '☠️',
        probability: 0.02,
        duration: 21,
        effects: {
            priceMultiplier: 1.4,
            stockReduction: 0.4
        },
        description: '疫病が蔓延し、商業活動が停滞している'
    }
};

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AUTOPILOT_CONFIG,
        ports,
        portDistances,
        seaRoutes,
        inventorySettings,
        goods,
        weatherTypes,
        portPrices,
        shipUpgrades,
        getSeaRoute,
        FACILITIES,
        REPUTATION_LEVELS,
        RANDOM_EVENTS,
        TREASURES,
        RARITY_CONFIG,
        ACHIEVEMENTS,
        DISASTERS
    };
}
