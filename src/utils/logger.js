import { gameState } from '../core/game-state.js';

// Add log message to game log
export function addLog(message) {
    const logDiv = document.getElementById('game-log');
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;

    // Save log to gameState
    gameState.logs.push(message);
    // Keep only last 50 logs to prevent excessive storage
    if (gameState.logs.length > 50) {
        gameState.logs.shift();
    }
}
