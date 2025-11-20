// Game State
export const gameState = {
    gold: 1100,
    currentPort: 'lisbon',
    inventory: {},
    ship: {
        name: 'カラベル船',
        capacity: 100,
        speed: 1,
        crew: 20
    },
    logs: [],
    gameTime: 0, // Game time in days
    isVoyaging: false, // Flag to track if currently on a voyage
    selectedDestination: null, // Selected destination port before voyage
    // Real-time voyage tracking
    voyageStartTime: null, // Real-time timestamp (milliseconds) when voyage started
    voyageStartPort: null, // Port where voyage started
    voyageDestinationPort: null, // Destination port
    voyageEstimatedDays: null, // Estimated days for voyage
    voyageActualDays: null, // Actual days needed (may change due to weather)
    voyageWeatherHistory: [], // Weather changes during voyage
    // Autopilot mode
    autopilotActive: false, // Is autopilot mode active
    autopilotStartTime: null, // Real-time timestamp when autopilot started
    autopilotDurationMinutes: 0, // Duration in minutes
    autopilotReport: {
        startGold: 0,
        startTime: 0,
        trades: [],
        voyages: [],
        totalProfit: 0
    },
    // Port investment system
    portInvestments: {
        lisbon: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
        seville: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
        venice: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
        alexandria: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
        calicut: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
        malacca: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 },
        nagasaki: { warehouse: 0, tradingPost: 0, shipyard: 0, market: 0 }
    },
    // Achievement system
    achievements: {
        // Wealth-based achievements
        apprentice: true,          // 見習い商人 (starting achievement)
        merchant: false,           // 商人 (10,000G)
        greatMerchant: false,      // 大商人 (50,000G)
        wealthyMerchant: false,    // 豪商 (100,000G)
        tradeKing: false,          // 貿易王 (500,000G)
        seaLord: false,            // 海洋覇者 (1,000,000G)
        // Action-based achievements
        worldTraveler: false,      // 世界一周 (全7港を訪問)
        spiceKing: false,          // 香辛料王 (香辛料を累計500個取引)
        tradeMaster: false,        // 貿易マスター (累計100回の航海)
        investor: false,           // 投資家 (全港に少なくとも1つの施設)
        portRuler: false           // 港の支配者 (1つの港で名声レベル最大)
    },
    // Statistics tracking
    statistics: {
        totalGoldEarned: 0,        // 累計獲得金額
        totalVoyages: 0,           // 累計航海数
        totalTrades: 0,            // 累計取引数
        goodsTraded: {             // 商品別の取引数
            wine: 0,
            cloth: 0,
            spices: 0,
            silk: 0,
            gold_ore: 0,
            porcelain: 0,
            tea: 0,
            silver: 0
        },
        portsVisited: {            // 訪問した港
            lisbon: true,          // Start at Lisbon
            seville: false,
            venice: false,
            alexandria: false,
            calicut: false,
            malacca: false,
            nagasaki: false
        },
        maxGold: 1100              // 最高所持金 (starts at initial gold)
    }
};

// Port inventory state (initialized on game start)
export const portInventory = {};

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameState, portInventory };
}
