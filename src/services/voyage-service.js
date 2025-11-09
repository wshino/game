import { gameState } from '../core/game-state.js';
import { ports, portDistances, weatherTypes, seaRoutes } from '../core/constants.js';
import { addLog } from '../utils/logger.js';
import { refreshPortInventory } from './port-service.js';
import { calculateRequiredSupplies, hasEnoughSupplies, consumeSupplies, autoSupplyForVoyage } from './supply-service.js';

// UI callback functions
let updateAll;
let saveGame;

// Set UI callback functions (call this from main game initialization)
export function setUICallbacks(updateAllFn, saveGameFn) {
    updateAll = updateAllFn;
    saveGame = saveGameFn;
}

// Get sea route with waypoints between two ports
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

// Get random weather based on probabilities
export function getRandomWeather() {
    const rand = Math.random();
    let cumulative = 0;

    for (const [key, weather] of Object.entries(weatherTypes)) {
        cumulative += weather.probability;
        if (rand <= cumulative) {
            return { id: key, ...weather };
        }
    }
    return { id: 'sunny', ...weatherTypes.sunny };
}

// Start a voyage to a destination port
export function startVoyage(destinationPortId) {
    // No gold cost for travel - supplies are the travel cost
    const travelCost = 0;

    // Calculate base travel time
    const baseDays = portDistances[gameState.currentPort][destinationPortId];
    const estimatedDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));

    // Check supplies
    const suppliesCheck = hasEnoughSupplies(estimatedDays);
    if (!suppliesCheck.hasEnough) {
        addLog(`❌ 物資が不足しています！`);
        addLog(`必要: 食糧${suppliesCheck.required.food}個、水${suppliesCheck.required.water}個`);
        addLog(`現在: 食糧${suppliesCheck.current.food}個、水${suppliesCheck.current.water}個`);
        return;
    }

    // Set voyage state with real-time tracking
    gameState.isVoyaging = true;
    gameState.voyageStartTime = Date.now();
    gameState.voyageStartPort = gameState.currentPort;
    gameState.voyageDestinationPort = destinationPortId;
    gameState.voyageEstimatedDays = estimatedDays;
    gameState.voyageActualDays = estimatedDays; // Will be updated by weather
    gameState.voyageWeatherHistory = [];

    const oldPort = ports[gameState.currentPort].name;
    const newPort = ports[destinationPortId].name;

    addLog(`⛵ ${newPort}に向けて出港します！`);

    // Save immediately to persist voyage state
    saveGame();

    // Show voyage modal
    showVoyageModal(oldPort, newPort, destinationPortId, estimatedDays);
}

// Show voyage modal when starting a new voyage
export function showVoyageModal(fromPort, toPort, destinationPortId, estimatedDays) {
    // Remove any existing modal first (in case of reload)
    const existingModal = document.getElementById('voyage-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Get port IDs from names
    const fromPortId = gameState.voyageStartPort;
    const toPortId = destinationPortId;

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'voyage-modal';
    modal.className = 'voyage-modal';
    modal.innerHTML = `
        <div class="voyage-content">
            <h2>⛵ 航海中 ⛵</h2>
            <div class="voyage-route">
                <div>${fromPort}</div>
                <div class="voyage-arrow">→</div>
                <div>${toPort}</div>
            </div>
            <div class="voyage-info">
                <div class="voyage-stat">
                    <span class="stat-label">経過日数:</span>
                    <span id="voyage-days-elapsed" class="stat-value">0</span>
                    <span class="stat-unit">/ 予定 ${estimatedDays}日</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">現在の天候:</span>
                    <span id="voyage-weather" class="stat-value">☀️ 晴天</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">速度:</span>
                    <span id="voyage-speed" class="stat-value">100%</span>
                </div>
            </div>
            <div class="voyage-animation">
                <svg id="voyage-map" class="voyage-map" viewBox="0 0 1000 600">
                    <!-- Ocean background -->
                    <rect width="1000" height="600" fill="#1e3a5f"/>
                    <!-- High resolution realistic world map image -->
                    <!-- Using Natural Earth II with Shaded Relief from Wikimedia Commons -->
                    <image id="world-map-image" x="0" y="0" width="1000" height="600"
                           href="https://upload.wikimedia.org/wikipedia/commons/9/97/Natural_Earth_II_flat_world_map_with_shaded_relief.jpg"
                           preserveAspectRatio="none"
                           crossorigin="anonymous"
                           onload="console.log('World map loaded successfully')"
                           onerror="console.warn('Failed to load world map image, using fallback');this.style.display='none';document.getElementById('landmasses').style.display='block'"/>
                    <!-- Fallback: Low resolution landmasses (shown if image fails to load) -->
                    <g id="landmasses" style="display: none;">
                        <!-- Iberian Peninsula (Spain & Portugal) - リスボン(39,135)とセビリア(60,151) -->
                        <path d="M 20 120 L 30 100 L 45 95 L 60 100 L 75 115 L 85 135 L 90 155 L 85 175 L 70 190 L 50 195 L 30 185 L 20 165 L 15 145 L 18 125 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- France -->
                        <path d="M 75 90 L 95 75 L 115 70 L 135 75 L 150 90 L 155 110 L 150 130 L 140 150 L 125 165 L 110 170 L 95 165 L 85 150 L 80 130 L 75 110 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- Italy - ヴェネツィア(182,55) -->
                        <path d="M 155 35 L 165 25 L 175 20 L 185 22 L 195 30 L 200 45 L 202 65 L 200 85 L 195 105 L 188 120 L 180 130 L 172 135 L 165 130 L 160 115 L 157 95 L 155 75 L 155 55 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- Greece and Balkans -->
                        <path d="M 200 70 L 215 65 L 230 70 L 240 85 L 245 105 L 240 125 L 230 140 L 215 145 L 200 140 L 192 125 L 190 105 L 195 85 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- North Africa (Morocco to Libya) -->
                        <path d="M 0 180 L 40 190 L 80 200 L 120 210 L 160 220 L 200 230 L 240 235 L 280 240 L 320 245 L 340 265 L 350 290 L 345 320 L 335 350 L 320 375 L 300 395 L 275 410 L 240 420 L 200 425 L 160 420 L 120 405 L 85 385 L 55 360 L 30 330 L 15 300 L 5 270 L 0 240 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- Egypt and Red Sea coast - アレクサンドリア(300,226) -->
                        <path d="M 280 200 L 295 195 L 310 200 L 320 215 L 325 235 L 330 260 L 328 285 L 320 305 L 310 320 L 295 325 L 280 320 L 272 305 L 268 285 L 268 260 L 272 235 L 278 215 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- Arabian Peninsula -->
                        <path d="M 330 240 L 350 235 L 370 240 L 390 255 L 405 280 L 410 310 L 405 340 L 395 365 L 380 385 L 360 400 L 340 410 L 325 410 L 315 395 L 310 375 L 308 350 L 310 325 L 315 300 L 320 275 L 325 255 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- India - カリカット(605,465) -->
                        <path d="M 560 350 L 585 340 L 610 345 L 630 360 L 645 385 L 650 415 L 650 445 L 645 475 L 630 500 L 610 520 L 585 530 L 565 530 L 550 515 L 540 490 L 538 460 L 540 430 L 545 400 L 552 375 Z" fill="#c9a882" stroke="#a98862" stroke-width="1"/>

                        <!-- Sri Lanka -->
                        <ellipse cx="620" cy="535" rx="10" ry="15" fill="#c9a882" stroke="#a98862" stroke-width="1"/>

                        <!-- Southeast Asia (Indochina and Malay Peninsula) - マラッカ(782,574) -->
                        <path d="M 660 400 L 685 390 L 710 395 L 730 410 L 745 435 L 755 465 L 760 495 L 765 525 L 768 555 L 770 585 L 765 600 L 750 600 L 735 595 L 720 580 L 710 560 L 705 535 L 700 505 L 695 475 L 690 445 L 682 420 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- Sumatra and Java -->
                        <path d="M 700 560 L 725 565 L 750 570 L 775 580 L 795 590 L 810 600 L 820 600 L 825 590 L 820 575 L 810 565 L 795 560 L 775 558 L 750 557 L 725 558 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- Borneo -->
                        <path d="M 795 510 L 815 505 L 835 512 L 845 528 L 848 545 L 843 560 L 828 568 L 810 565 L 797 555 L 792 540 L 793 525 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- China mainland -->
                        <path d="M 700 140 L 740 120 L 780 110 L 820 115 L 860 130 L 890 155 L 910 185 L 920 220 L 925 260 L 920 295 L 905 325 L 880 348 L 845 365 L 805 375 L 765 378 L 730 370 L 700 355 L 678 335 L 665 310 L 658 280 L 656 245 L 660 210 L 670 175 Z" fill="#a89878" stroke="#887858" stroke-width="1"/>

                        <!-- Korea -->
                        <path d="M 900 170 L 915 160 L 930 165 L 940 180 L 945 200 L 940 220 L 930 235 L 915 240 L 900 235 L 892 220 L 890 200 L 895 185 Z" fill="#a89878" stroke="#887858" stroke-width="1"/>

                        <!-- Japan - 長崎(966,207) -->
                        <path d="M 930 180 L 950 170 L 970 175 L 985 190 L 995 210 L 998 230 L 995 250 L 985 270 L 970 285 L 950 290 L 935 285 L 925 270 L 922 250 L 925 230 L 928 210 L 930 195 Z" fill="#b8a888" stroke="#988868" stroke-width="1"/>
                        <ellipse cx="955" cy="235" rx="15" ry="20" fill="#b8a888" stroke="#988868" stroke-width="1"/>
                    </g>
                    <!-- Route line -->
                    <polyline id="voyage-route-line" stroke="#4a9eff" stroke-width="2" stroke-dasharray="5,5" opacity="0.6" fill="none"/>
                    <!-- Ports will be added here -->
                    <g id="voyage-ports"></g>
                    <!-- Ship icon -->
                    <text id="voyage-ship-icon" class="voyage-ship-icon" font-size="32" text-anchor="middle" dominant-baseline="middle">🚢</text>
                </svg>
                <div id="voyage-weather-effect" class="weather-effect"></div>
            </div>
            <div id="voyage-log" class="voyage-log"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // Initialize map with ports and route
    initializeVoyageMap(fromPortId, toPortId);

    // Start voyage simulation
    simulateVoyage(destinationPortId, estimatedDays);
}

// Show voyage modal for an in-progress voyage (when returning to game)
export function showVoyageModalInProgress(fromPort, toPort, currentDaysElapsed, totalDays) {
    // Remove any existing modal first (in case of reload)
    const existingModal = document.getElementById('voyage-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Get port IDs from game state
    const fromPortId = gameState.voyageStartPort;
    const toPortId = gameState.voyageDestinationPort;

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'voyage-modal';
    modal.className = 'voyage-modal';
    modal.innerHTML = `
        <div class="voyage-content">
            <h2>⛵ 航海中 ⛵</h2>
            <div class="voyage-route">
                <div>${fromPort}</div>
                <div class="voyage-arrow">→</div>
                <div>${toPort}</div>
            </div>
            <div class="voyage-info">
                <div class="voyage-stat">
                    <span class="stat-label">経過日数:</span>
                    <span id="voyage-days-elapsed" class="stat-value">${currentDaysElapsed}</span>
                    <span class="stat-unit">/ 予定 ${totalDays}日</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">現在の天候:</span>
                    <span id="voyage-weather" class="stat-value">☀️ 晴天</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">速度:</span>
                    <span id="voyage-speed" class="stat-value">100%</span>
                </div>
            </div>
            <div class="voyage-animation">
                <svg id="voyage-map" class="voyage-map" viewBox="0 0 1000 600">
                    <!-- Ocean background -->
                    <rect width="1000" height="600" fill="#1e3a5f"/>
                    <!-- High resolution realistic world map image -->
                    <!-- Using Natural Earth II with Shaded Relief from Wikimedia Commons -->
                    <image id="world-map-image" x="0" y="0" width="1000" height="600"
                           href="https://upload.wikimedia.org/wikipedia/commons/9/97/Natural_Earth_II_flat_world_map_with_shaded_relief.jpg"
                           preserveAspectRatio="none"
                           crossorigin="anonymous"
                           onload="console.log('World map loaded successfully')"
                           onerror="console.warn('Failed to load world map image, using fallback');this.style.display='none';document.getElementById('landmasses').style.display='block'"/>
                    <!-- Fallback: Low resolution landmasses (shown if image fails to load) -->
                    <g id="landmasses" style="display: none;">
                        <!-- Iberian Peninsula (Spain & Portugal) - リスボン(39,135)とセビリア(60,151) -->
                        <path d="M 20 120 L 30 100 L 45 95 L 60 100 L 75 115 L 85 135 L 90 155 L 85 175 L 70 190 L 50 195 L 30 185 L 20 165 L 15 145 L 18 125 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- France -->
                        <path d="M 75 90 L 95 75 L 115 70 L 135 75 L 150 90 L 155 110 L 150 130 L 140 150 L 125 165 L 110 170 L 95 165 L 85 150 L 80 130 L 75 110 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- Italy - ヴェネツィア(182,55) -->
                        <path d="M 155 35 L 165 25 L 175 20 L 185 22 L 195 30 L 200 45 L 202 65 L 200 85 L 195 105 L 188 120 L 180 130 L 172 135 L 165 130 L 160 115 L 157 95 L 155 75 L 155 55 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- Greece and Balkans -->
                        <path d="M 200 70 L 215 65 L 230 70 L 240 85 L 245 105 L 240 125 L 230 140 L 215 145 L 200 140 L 192 125 L 190 105 L 195 85 Z" fill="#8b7355" stroke="#6b5335" stroke-width="1"/>

                        <!-- North Africa (Morocco to Libya) -->
                        <path d="M 0 180 L 40 190 L 80 200 L 120 210 L 160 220 L 200 230 L 240 235 L 280 240 L 320 245 L 340 265 L 350 290 L 345 320 L 335 350 L 320 375 L 300 395 L 275 410 L 240 420 L 200 425 L 160 420 L 120 405 L 85 385 L 55 360 L 30 330 L 15 300 L 5 270 L 0 240 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- Egypt and Red Sea coast - アレクサンドリア(300,226) -->
                        <path d="M 280 200 L 295 195 L 310 200 L 320 215 L 325 235 L 330 260 L 328 285 L 320 305 L 310 320 L 295 325 L 280 320 L 272 305 L 268 285 L 268 260 L 272 235 L 278 215 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- Arabian Peninsula -->
                        <path d="M 330 240 L 350 235 L 370 240 L 390 255 L 405 280 L 410 310 L 405 340 L 395 365 L 380 385 L 360 400 L 340 410 L 325 410 L 315 395 L 310 375 L 308 350 L 310 325 L 315 300 L 320 275 L 325 255 Z" fill="#d4a574" stroke="#b48554" stroke-width="1"/>

                        <!-- India - カリカット(605,465) -->
                        <path d="M 560 350 L 585 340 L 610 345 L 630 360 L 645 385 L 650 415 L 650 445 L 645 475 L 630 500 L 610 520 L 585 530 L 565 530 L 550 515 L 540 490 L 538 460 L 540 430 L 545 400 L 552 375 Z" fill="#c9a882" stroke="#a98862" stroke-width="1"/>

                        <!-- Sri Lanka -->
                        <ellipse cx="620" cy="535" rx="10" ry="15" fill="#c9a882" stroke="#a98862" stroke-width="1"/>

                        <!-- Southeast Asia (Indochina and Malay Peninsula) - マラッカ(782,574) -->
                        <path d="M 660 400 L 685 390 L 710 395 L 730 410 L 745 435 L 755 465 L 760 495 L 765 525 L 768 555 L 770 585 L 765 600 L 750 600 L 735 595 L 720 580 L 710 560 L 705 535 L 700 505 L 695 475 L 690 445 L 682 420 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- Sumatra and Java -->
                        <path d="M 700 560 L 725 565 L 750 570 L 775 580 L 795 590 L 810 600 L 820 600 L 825 590 L 820 575 L 810 565 L 795 560 L 775 558 L 750 557 L 725 558 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- Borneo -->
                        <path d="M 795 510 L 815 505 L 835 512 L 845 528 L 848 545 L 843 560 L 828 568 L 810 565 L 797 555 L 792 540 L 793 525 Z" fill="#9b8b6f" stroke="#7b6b4f" stroke-width="1"/>

                        <!-- China mainland -->
                        <path d="M 700 140 L 740 120 L 780 110 L 820 115 L 860 130 L 890 155 L 910 185 L 920 220 L 925 260 L 920 295 L 905 325 L 880 348 L 845 365 L 805 375 L 765 378 L 730 370 L 700 355 L 678 335 L 665 310 L 658 280 L 656 245 L 660 210 L 670 175 Z" fill="#a89878" stroke="#887858" stroke-width="1"/>

                        <!-- Korea -->
                        <path d="M 900 170 L 915 160 L 930 165 L 940 180 L 945 200 L 940 220 L 930 235 L 915 240 L 900 235 L 892 220 L 890 200 L 895 185 Z" fill="#a89878" stroke="#887858" stroke-width="1"/>

                        <!-- Japan - 長崎(966,207) -->
                        <path d="M 930 180 L 950 170 L 970 175 L 985 190 L 995 210 L 998 230 L 995 250 L 985 270 L 970 285 L 950 290 L 935 285 L 925 270 L 922 250 L 925 230 L 928 210 L 930 195 Z" fill="#b8a888" stroke="#988868" stroke-width="1"/>
                        <ellipse cx="955" cy="235" rx="15" ry="20" fill="#b8a888" stroke="#988868" stroke-width="1"/>
                    </g>
                    <!-- Route line -->
                    <polyline id="voyage-route-line" stroke="#4a9eff" stroke-width="2" stroke-dasharray="5,5" opacity="0.6" fill="none"/>
                    <!-- Ports will be added here -->
                    <g id="voyage-ports"></g>
                    <!-- Ship icon -->
                    <text id="voyage-ship-icon" class="voyage-ship-icon" font-size="32" text-anchor="middle" dominant-baseline="middle">🚢</text>
                </svg>
                <div id="voyage-weather-effect" class="weather-effect"></div>
            </div>
            <div id="voyage-log" class="voyage-log"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // Initialize map with ports and route
    initializeVoyageMap(fromPortId, toPortId);

    const voyageLog = document.getElementById('voyage-log');
    const addVoyageLog = (message) => {
        const p = document.createElement('p');
        p.textContent = message;
        voyageLog.appendChild(p);
        voyageLog.scrollTop = voyageLog.scrollHeight;
    };

    // Show resume message
    addVoyageLog(`🌊 航海を再開しました（${currentDaysElapsed}日経過）`);

    // Replay weather history
    for (const weatherEvent of gameState.voyageWeatherHistory) {
        if (weatherEvent.day <= currentDaysElapsed) {
            addVoyageLog(`${weatherEvent.emoji} ${weatherEvent.name}`);
        }
    }

    // Continue voyage simulation
    simulateVoyage(gameState.voyageDestinationPort, gameState.voyageEstimatedDays);
}

// Initialize the voyage map with ports, route, and viewport
export function initializeVoyageMap(fromPortId, toPortId) {
    const fromPort = ports[fromPortId];
    const toPort = ports[toPortId];

    // Get the sea route with waypoints
    const route = getSeaRoute(fromPortId, toPortId);

    // Calculate viewport bounds with padding (considering all waypoints)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of route) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    const padding = 100;
    const viewBoxX = Math.max(0, minX - padding);
    const viewBoxY = Math.max(0, minY - padding);
    const viewBoxWidth = Math.min(1000, (maxX - minX) + padding * 2);
    const viewBoxHeight = Math.min(600, (maxY - minY) + padding * 2);

    // Update SVG viewBox to focus on the route
    const svg = document.getElementById('voyage-map');
    svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);

    // Draw route line as a polyline through waypoints
    const routeLine = document.getElementById('voyage-route-line');
    const pointsString = route.map(([x, y]) => `${x},${y}`).join(' ');
    routeLine.setAttribute('points', pointsString);

    // Add port markers
    const portsGroup = document.getElementById('voyage-ports');

    // Start port (green)
    const startPortGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startCircle.setAttribute('cx', fromPort.x);
    startCircle.setAttribute('cy', fromPort.y);
    startCircle.setAttribute('r', '8');
    startCircle.setAttribute('fill', '#4ade80');
    startCircle.setAttribute('stroke', '#fff');
    startCircle.setAttribute('stroke-width', '2');
    const startLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    startLabel.setAttribute('x', fromPort.x);
    startLabel.setAttribute('y', fromPort.y - 15);
    startLabel.setAttribute('text-anchor', 'middle');
    startLabel.setAttribute('fill', '#fff');
    startLabel.setAttribute('font-size', '14');
    startLabel.setAttribute('font-weight', 'bold');
    startLabel.textContent = fromPort.name;
    startPortGroup.appendChild(startCircle);
    startPortGroup.appendChild(startLabel);

    // Destination port (red)
    const destPortGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const destCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    destCircle.setAttribute('cx', toPort.x);
    destCircle.setAttribute('cy', toPort.y);
    destCircle.setAttribute('r', '8');
    destCircle.setAttribute('fill', '#f87171');
    destCircle.setAttribute('stroke', '#fff');
    destCircle.setAttribute('stroke-width', '2');
    const destLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    destLabel.setAttribute('x', toPort.x);
    destLabel.setAttribute('y', toPort.y - 15);
    destLabel.setAttribute('text-anchor', 'middle');
    destLabel.setAttribute('fill', '#fff');
    destLabel.setAttribute('font-size', '14');
    destLabel.setAttribute('font-weight', 'bold');
    destLabel.textContent = toPort.name;
    destPortGroup.appendChild(destCircle);
    destPortGroup.appendChild(destLabel);

    portsGroup.appendChild(startPortGroup);
    portsGroup.appendChild(destPortGroup);

    // Initialize ship at start position
    const shipIcon = document.getElementById('voyage-ship-icon');
    shipIcon.setAttribute('x', route[0][0]);
    shipIcon.setAttribute('y', route[0][1]);
}

// Update ship position based on voyage progress
export function updateShipPosition(progress) {
    const fromPortId = gameState.voyageStartPort;
    const toPortId = gameState.voyageDestinationPort;

    // Get the sea route with waypoints
    const route = getSeaRoute(fromPortId, toPortId);

    // Calculate total route length
    let totalLength = 0;
    const segmentLengths = [];
    for (let i = 0; i < route.length - 1; i++) {
        const [x1, y1] = route[i];
        const [x2, y2] = route[i + 1];
        const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        segmentLengths.push(segmentLength);
        totalLength += segmentLength;
    }

    // Find the current position along the route based on progress
    const targetDistance = progress * totalLength;
    let accumulatedDistance = 0;
    let x = route[0][0];
    let y = route[0][1];

    for (let i = 0; i < route.length - 1; i++) {
        const segmentLength = segmentLengths[i];
        if (accumulatedDistance + segmentLength >= targetDistance) {
            // The ship is in this segment
            const segmentProgress = (targetDistance - accumulatedDistance) / segmentLength;
            const [x1, y1] = route[i];
            const [x2, y2] = route[i + 1];
            x = x1 + (x2 - x1) * segmentProgress;
            y = y1 + (y2 - y1) * segmentProgress;
            break;
        }
        accumulatedDistance += segmentLength;
    }

    const shipIcon = document.getElementById('voyage-ship-icon');
    if (shipIcon) {
        shipIcon.setAttribute('x', x);
        shipIcon.setAttribute('y', y);
    }
}

// Simulate voyage with real-time updates
export function simulateVoyage(destinationPortId, estimatedDays) {
    const TIME_PER_DAY = 15000; // 15 seconds per game day
    let currentWeather = getRandomWeather();
    let lastWeatherChangeDay = 0;

    const voyageLog = document.getElementById('voyage-log');
    const addVoyageLog = (message) => {
        const p = document.createElement('p');
        p.textContent = message;
        voyageLog.appendChild(p);
        voyageLog.scrollTop = voyageLog.scrollHeight;
    };

    addVoyageLog(`🌊 ${ports[gameState.voyageStartPort].name}を出港しました`);
    addVoyageLog(`${currentWeather.emoji} ${currentWeather.name}: ${currentWeather.description}`);

    // Store initial weather
    gameState.voyageWeatherHistory.push({
        day: 0,
        weather: currentWeather.id,
        emoji: currentWeather.emoji,
        name: currentWeather.name
    });

    // Update UI based on real-time elapsed
    const updateVoyageUI = () => {
        const now = Date.now();
        const elapsedRealTime = now - gameState.voyageStartTime;
        const daysElapsedExact = elapsedRealTime / TIME_PER_DAY; // Exact days with decimals for smooth animation
        const daysElapsed = Math.floor(daysElapsedExact); // Integer days for display and weather changes
        const actualDaysNeeded = gameState.voyageActualDays;

        // Random weather change (20% chance per day)
        if (daysElapsed > lastWeatherChangeDay && Math.random() < 0.2) {
            lastWeatherChangeDay = daysElapsed;
            currentWeather = getRandomWeather();
            addVoyageLog(`${currentWeather.emoji} 天候が変化: ${currentWeather.name}`);

            // Store weather change
            gameState.voyageWeatherHistory.push({
                day: daysElapsed,
                weather: currentWeather.id,
                emoji: currentWeather.emoji,
                name: currentWeather.name
            });

            // Adjust estimated arrival based on weather
            if (currentWeather.speedMultiplier < 1.0) {
                const delay = Math.random() < 0.3 ? 1 : 0;
                if (delay > 0) {
                    gameState.voyageActualDays += delay;
                    addVoyageLog(`⚠️ ${currentWeather.name}の影響で到着が遅れています`);
                    saveGame(); // Save updated voyage state
                }
            }
        }

        // Update UI
        document.getElementById('voyage-days-elapsed').textContent = daysElapsed;
        document.getElementById('voyage-weather').textContent = `${currentWeather.emoji} ${currentWeather.name}`;
        document.getElementById('voyage-speed').textContent = `${Math.round(currentWeather.speedMultiplier * 100)}%`;

        // Update weather effect
        const weatherEffect = document.getElementById('voyage-weather-effect');
        if (weatherEffect) {
            weatherEffect.className = 'weather-effect ' + currentWeather.id;
        }

        // Update ship position on map using exact days for smooth animation
        const progress = Math.min(1.0, daysElapsedExact / actualDaysNeeded);
        updateShipPosition(progress);

        // Check if voyage is complete
        if (daysElapsed >= actualDaysNeeded) {
            completeVoyage(destinationPortId, actualDaysNeeded);
            return; // Stop updating
        }

        // Continue updating
        requestAnimationFrame(updateVoyageUI);
    };

    // Start updating UI
    requestAnimationFrame(updateVoyageUI);
}

// Complete voyage and update game state
export function completeVoyage(destinationPortId, actualDays) {
    // Advance time
    gameState.gameTime += actualDays;

    // Consume supplies
    consumeSupplies(actualDays);

    // Change port
    const oldPort = ports[gameState.voyageStartPort || gameState.currentPort].name;
    gameState.currentPort = destinationPortId;
    const newPort = ports[destinationPortId].name;

    // Refresh port inventories
    refreshPortInventory(actualDays);

    // Clear voyage state
    gameState.isVoyaging = false;
    gameState.voyageStartTime = null;
    gameState.voyageStartPort = null;
    gameState.voyageDestinationPort = null;
    gameState.voyageEstimatedDays = null;
    gameState.voyageActualDays = null;
    gameState.voyageWeatherHistory = [];

    // Add logs
    addLog(`⛵ ${oldPort}から${newPort}へ${actualDays}日間の航海を終えました`);
    addLog(`🏖️ ${ports[destinationPortId].emoji} ${newPort}に到着！`);
    addLog(`📅 現在の日数: ${gameState.gameTime}日目`);

    // Close modal
    setTimeout(() => {
        const modal = document.getElementById('voyage-modal');
        if (modal) {
            modal.remove();
        }
        if (updateAll) {
            updateAll();
        }
    }, 2000);
}

// Select destination and auto-supply, but don't start voyage yet
export function selectDestination(portId) {
    if (gameState.isVoyaging) {
        return; // Prevent selection during voyage
    }

    // Calculate required supplies
    const baseDays = portDistances[gameState.currentPort][portId];
    const estimatedDays = Math.max(1, Math.round(baseDays / gameState.ship.speed));
    const required = calculateRequiredSupplies(estimatedDays);

    // Calculate supply space requirements for warning
    const supplySpace = required.food + required.water;
    const supplyPercentage = (supplySpace / gameState.ship.capacity) * 100;

    // Auto-supply food and water
    const supplyResult = autoSupplyForVoyage(estimatedDays);

    // Set selected destination
    gameState.selectedDestination = portId;

    if (supplyResult.success && !supplyResult.alreadyEnough) {
        addLog(`⚓ ${ports[portId].name}への航海に必要な物資を補給しました`);
        if (supplyResult.boughtFood > 0) {
            addLog(`  食糧: ${supplyResult.boughtFood}個を補給`);
        }
        if (supplyResult.boughtWater > 0) {
            addLog(`  水: ${supplyResult.boughtWater}個を補給`);
        }

        // Warning for high supply percentage
        if (supplyPercentage > 75) {
            addLog(`⚠️ この航海は物資が積載量の${Math.round(supplyPercentage)}%を占めます`);
            addLog(`💡 より大きな船へのアップグレード、または中継港経由をお勧めします`);
        } else if (supplyPercentage > 55) {
            addLog(`📊 この航海の物資負担: ${Math.round(supplyPercentage)}%`);
        }

        addLog(`💼 商品を積んだら「航海を開始する」ボタンで出発してください`);
    } else if (supplyResult.success && supplyResult.alreadyEnough) {
        addLog(`⚓ ${ports[portId].name}を航海先に選択しました`);

        // Warning for high supply percentage
        if (supplyPercentage > 75) {
            addLog(`⚠️ この航海は物資が積載量の${Math.round(supplyPercentage)}%を占めます`);
            addLog(`💡 より大きな船へのアップグレード、または中継港経由をお勧めします`);
        } else if (supplyPercentage > 55) {
            addLog(`📊 この航海の物資負担: ${Math.round(supplyPercentage)}%`);
        }

        addLog(`💼 商品を積んだら「航海を開始する」ボタンで出発してください`);
    } else {
        // Could not supply enough
        addLog(`⚠️ ${ports[portId].name}への航海に必要な物資を十分に補給できませんでした`);
        if (supplyResult.boughtFood > 0 || supplyResult.boughtWater > 0) {
            addLog(`  補給した: 食糧${supplyResult.boughtFood}個、水${supplyResult.boughtWater}個`);
        }
        addLog(`  まだ不足: 食糧${supplyResult.required.food - supplyResult.current.food}個、水${supplyResult.required.water - supplyResult.current.water}個`);
        addLog(`💡 資金、積載量、または港の在庫を確認してください`);
    }

    if (updateAll) {
        updateAll();
    }
}

// Start voyage to selected destination
export function startSelectedVoyage() {
    if (!gameState.selectedDestination) {
        addLog('❌ 航海先が選択されていません');
        return;
    }

    const destinationPortId = gameState.selectedDestination;

    // Clear selection
    gameState.selectedDestination = null;

    // Start the voyage (this will check supplies again)
    startVoyage(destinationPortId);
}

// Cancel selected destination
export function cancelDestination() {
    if (gameState.selectedDestination) {
        addLog(`🚫 ${ports[gameState.selectedDestination].name}への航海を取り消しました`);
        gameState.selectedDestination = null;
        if (updateAll) {
            updateAll();
        }
    }
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getRandomWeather,
        startVoyage,
        simulateVoyage,
        completeVoyage,
        selectDestination,
        startSelectedVoyage,
        cancelDestination,
        initializeVoyageMap,
        updateShipPosition,
        showVoyageModal,
        showVoyageModalInProgress,
        setUICallbacks
    };
}
