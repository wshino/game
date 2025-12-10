# Spec: ログに現在地の港絵文字を追加

## 表示形式

現在のタイムスタンプ形式:
```
[HH:MM] メッセージ
```

変更後:
```
[HH:MM] 🇵🇹 メッセージ
```

## 実装詳細

### 港絵文字の取得

`gameState.currentPort` から現在地を取得し、`ports` 定数から絵文字を取得する。

```javascript
import { ports } from '../core/constants.js';
import { gameState } from '../core/game-state.js';

// 現在地の港絵文字を取得
const portEmoji = ports[gameState.currentPort]?.emoji || '';
```

### ログ形式

```javascript
const logMessage = `${timestamp} ${portEmoji} ${message}`;
```

## 港の絵文字一覧 (参考)

| 港ID | 港名 | 絵文字 |
|------|------|--------|
| lisbon | リスボン | 🇵🇹 |
| seville | セビリア | 🇪🇸 |
| venice | ヴェネツィア | 🇮🇹 |
| alexandria | アレクサンドリア | 🇪🇬 |
| calicut | カリカット | 🇮🇳 |
| malacca | マラッカ | 🇲🇾 |
| nagasaki | 長崎 | 🇯🇵 |

## テスト観点

1. 各港でログを追加した際に正しい絵文字が表示されること
2. 航海中（currentPortがない場合）は絵文字なしで表示されること
3. 既存のタイムスタンプ機能が引き続き動作すること

## 受け入れ条件

- [ ] リスボンでログ: `[14:30] 🇵🇹 Arrived at Lisbon port`
- [ ] 長崎でログ: `[14:30] 🇯🇵 Arrived at Nagasaki port`
- [ ] 航海中: `[14:30] Storm encountered!` (絵文字なし)
