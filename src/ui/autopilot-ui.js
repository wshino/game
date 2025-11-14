import { gameState } from '../core/game-state.js';
import { ports } from '../core/constants.js';
import { addLog } from '../utils/logger.js';
import { startAutopilot, stopAutopilot } from '../services/autopilot-service.js';

// Show autopilot report modal
export function showAutopilotReport(report) {
    const modal = document.createElement('div');
    modal.className = 'voyage-modal';
    modal.style.zIndex = '1000';

    let tradesHtml = '<div class="autopilot-trades">';
    if (report.trades.length > 0) {
        tradesHtml += '<h4>取引記録:</h4><ul>';
        report.trades.forEach(trade => {
            const emoji = trade.action === 'buy' ? '📥' : '📤';
            const actionText = trade.action === 'buy' ? '購入' : '売却';
            tradesHtml += `<li>${emoji} ${ports[trade.port].name}: ${trade.good} ${trade.quantity}個 ${actionText} (${trade.total}G)</li>`;
        });
        tradesHtml += '</ul>';
    } else {
        tradesHtml += '<p>取引なし</p>';
    }
    tradesHtml += '</div>';

    let voyagesHtml = '<div class="autopilot-voyages">';
    if (report.voyages.length > 0) {
        voyagesHtml += '<h4>航海記録:</h4><ul>';
        report.voyages.forEach(voyage => {
            voyagesHtml += `<li>⛵ ${voyage.from} → ${voyage.to} (${voyage.days}日)</li>`;
        });
        voyagesHtml += '</ul>';
    } else {
        voyagesHtml += '<p>航海なし</p>';
    }
    voyagesHtml += '</div>';

    const profitColor = report.profit >= 0 ? '#4CAF50' : '#f44336';
    const profitSign = report.profit >= 0 ? '+' : '';

    modal.innerHTML = `
        <div class="voyage-content">
            <h2>🤖 オートパイロット作業報告書</h2>
            <div class="autopilot-summary">
                <div class="voyage-stat">
                    <span class="stat-label">⏱️ 実行時間:</span>
                    <span class="stat-value">${report.durationText}</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">📅 経過日数:</span>
                    <span class="stat-value">${report.daysElapsed}日</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">💰 開始資金:</span>
                    <span class="stat-value">${report.startGold}G</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">💰 終了資金:</span>
                    <span class="stat-value">${report.endGold}G</span>
                </div>
                <div class="voyage-stat">
                    <span class="stat-label">📊 純利益:</span>
                    <span class="stat-value" style="color: ${profitColor}; font-weight: bold;">${profitSign}${report.profit}G</span>
                </div>
            </div>
            ${tradesHtml}
            ${voyagesHtml}
            <button class="btn btn-primary" onclick="closeAutopilotReport()" style="margin-top: 20px; width: 100%;">
                閉じる
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    addLog(`📊 オートパイロット完了！利益: ${profitSign}${report.profit}G`);
}

// Close autopilot report
export function closeAutopilotReport() {
    const modal = document.querySelector('.voyage-modal');
    if (modal) {
        modal.remove();
    }
}

// Update autopilot UI
export function updateAutopilotUI() {
    const toggleBtn = document.getElementById('autopilot-toggle');
    const timerSpan = document.getElementById('autopilot-timer');
    const durationInput = document.getElementById('autopilot-duration');

    if (!toggleBtn || !timerSpan || !durationInput) return;

    if (gameState.autopilotActive) {
        toggleBtn.textContent = '⏹️ 停止';
        toggleBtn.className = 'btn btn-sell';
        durationInput.disabled = true;

        const elapsed = Date.now() - gameState.autopilotStartTime;
        const elapsedMinutes = elapsed / 60000;
        const remainingMinutes = gameState.autopilotDurationMinutes - elapsedMinutes;

        if (remainingMinutes > 0) {
            const displayMinutes = Math.floor(remainingMinutes);
            const hours = Math.floor(displayMinutes / 60);
            const minutes = displayMinutes % 60;
            const seconds = Math.floor((remainingMinutes - displayMinutes) * 60);

            if (hours > 0) {
                timerSpan.textContent = `⏱️ 残り: ${hours}時間${minutes}分${seconds}秒`;
            } else if (minutes > 0) {
                timerSpan.textContent = `⏱️ 残り: ${minutes}分${seconds}秒`;
            } else {
                timerSpan.textContent = `⏱️ 残り: ${seconds}秒`;
            }
        } else {
            // Time is up - this should trigger stopAutopilot very soon
            timerSpan.textContent = '⏱️ まもなく完了...';
        }
    } else {
        toggleBtn.textContent = '🤖 開始';
        toggleBtn.className = 'btn btn-primary';
        durationInput.disabled = false;
        timerSpan.textContent = '';
    }
}

// Toggle autopilot
export function toggleAutopilot() {
    if (gameState.autopilotActive) {
        stopAutopilot();
    } else {
        const durationInput = document.getElementById('autopilot-duration');
        const duration = parseInt(durationInput.value) || 60;
        startAutopilot(duration);
    }
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showAutopilotReport,
        closeAutopilotReport,
        updateAutopilotUI,
        toggleAutopilot
    };
}
