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
    }
};

// Port inventory state (initialized on game start)
export const portInventory = {};

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameState, portInventory };
}
