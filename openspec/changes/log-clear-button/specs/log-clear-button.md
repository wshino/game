# Spec: ログクリアボタンの追加

## UI設計

ゲームログエリア (`#game-log`) の右上にクリアボタンを配置する。

```html
<button id="clear-log-btn" title="ログをクリア">🗑️</button>
```

## 実装詳細

### HTML変更

`index.html` のログエリアにボタンを追加:

```html
<div class="log-container">
    <div class="log-header">
        <h3>📜 航海日誌</h3>
        <button id="clear-log-btn" title="ログをクリア">🗑️</button>
    </div>
    <div id="game-log"></div>
</div>
```

### JavaScript変更

`src/utils/logger.js` に `clearLog` 関数を追加:

```javascript
export function clearLog() {
    const logDiv = document.getElementById('game-log');
    logDiv.innerHTML = '';
    gameState.logs = [];
}
```

### イベント登録

`src/game.js` でボタンのクリックイベントを登録:

```javascript
document.getElementById('clear-log-btn').addEventListener('click', clearLog);
```

## 受け入れ条件

- [ ] ログエリアにクリアボタン (🗑️) が表示される
- [ ] ボタンをクリックするとログがすべて消去される
- [ ] gameState.logs も空になる
