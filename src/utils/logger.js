import { ports } from '../core/constants.js';
import { gameState } from '../core/game-state.js';

// Add log message to game log
export function addLog(message) {
    // タイムスタンプを生成
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `[${hours}:${minutes}]`;
    
    // 現在地の港絵文字を取得
    const portEmoji = ports[gameState.currentPort]?.emoji || '';
    
    // タイムスタンプと港絵文字をメッセージに追加
    const timestampedMessage = `${timestamp} ${portEmoji} ${message}`;

    const logDiv = document.getElementById('game-log');
    const p = document.createElement('p');
    // WARNING: innerHTML は XSS 脆弱性の原因になる可能性があります
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

// ログをクリアする
export function clearLog() {
    const logDiv = document.getElementById('game-log');
    logDiv.innerHTML = '';
    gameState.logs = [];
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addLog, clearLog };
}
