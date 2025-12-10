import { gameState } from '../core/game-state.js';

// Add log message to game log
export function addLog(message) {
    // タイムスタンプを生成
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `[${hours}:${minutes}]`;
    
    // タイムスタンプをメッセージに追加
    const timestampedMessage = `${timestamp} ${message}`;

    const logDiv = document.getElementById('game-log');
    const p = document.createElement('p');
    p.textContent = timestampedMessage;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;

    // Save log to gameState with timestamp
    gameState.logs.push(timestampedMessage);
    // Keep only last 50 logs to prevent excessive storage
    if (gameState.logs.length > 50) {
        gameState.logs.shift();
    }
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addLog };
}
