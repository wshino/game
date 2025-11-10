# 実装タスク: オートパイロット最大利益機能

## タスクリスト

### Phase 1: 時間管理機能の追加

- [ ] **Task 1.1**: 残り時間を計算する関数を追加
  - ファイル: `src/services/autopilot-service.js`
  - 関数: `getRemainingAutopilotTime()`
  - 戻り値: `{ remainingMinutes, remainingGameDays }`

- [ ] **Task 1.2**: 時間効率を計算する関数を追加
  - ファイル: `src/services/autopilot-service.js`
  - 関数: `calculateTimeEfficiency(totalProfit, estimatedDays)`
  - 戻り値: 時間効率の数値

### Phase 2: 最適化アルゴリズムの改善

- [ ] **Task 2.1**: `calculateOptimalPurchaseForDestination()` を拡張
  - 時間効率を計算して返す
  - 戻り値に `timeEfficiency` と `estimatedDays` を追加

- [ ] **Task 2.2**: `findBestTrade()` を改善
  - 残り時間チェックを追加
  - 時間効率を考慮した最適なルート選択
  - 短期/長期で戦略を切り替え

### Phase 3: デバッグログの追加

- [ ] **Task 3.1**: 時間効率のログを追加
  - 選択されたルートの時間効率を表示
  - 残り時間の表示

### Phase 4: テストと調整

- [ ] **Task 4.1**: 短期オートパイロットのテスト（1時間）
  - 時間内に完了することを確認
  - 利益が改善されているか確認

- [ ] **Task 4.2**: 長期オートパイロットのテスト（4-8時間）
  - 複数サイクルが適切に動作することを確認
  - 総利益の改善を確認

## 実装の詳細

### Task 1.1: `getRemainingAutopilotTime()`

```javascript
export function getRemainingAutopilotTime() {
    if (!gameState.autopilotActive) {
        return { remainingMinutes: 0, remainingGameDays: 0 };
    }

    const elapsed = Date.now() - gameState.autopilotStartTime;
    const elapsedMinutes = elapsed / 60000;
    const remainingMinutes = gameState.autopilotDurationMinutes - elapsedMinutes;

    // リアル時間をゲーム日数に変換
    // 仮定: 1サイクル = 1-3秒、平均的な取引サイクル = 15秒/日
    const remainingGameDays = (remainingMinutes * 60) / 15; // 15秒 = 1ゲーム日

    return {
        remainingMinutes: Math.max(0, remainingMinutes),
        remainingGameDays: Math.max(0, remainingGameDays)
    };
}
```

### Task 1.2: `calculateTimeEfficiency()`

```javascript
const TRADE_TIME_OVERHEAD = 2; // 取引処理にかかる時間（ゲーム日数）

export function calculateTimeEfficiency(totalProfit, estimatedDays) {
    const totalTime = estimatedDays + TRADE_TIME_OVERHEAD;
    return totalProfit / totalTime;
}
```

### Task 2.1: `calculateOptimalPurchaseForDestination()` の拡張

戻り値に以下を追加：
```javascript
return {
    totalProfit,
    estimatedDays,
    timeEfficiency: calculateTimeEfficiency(totalProfit, estimatedDays),
    goodsToBuy,
    supplyCost,
    waterNeeded,
    foodNeeded
};
```

### Task 2.2: `findBestTrade()` の改善

```javascript
export function findBestTrade() {
    // ... 既存のコード ...

    // 残り時間を取得
    const { remainingGameDays } = getRemainingAutopilotTime();
    const BUFFER_DAYS = 5; // 安全マージン

    // 最適化戦略の選択
    const isShortTerm = gameState.autopilotDurationMinutes < 120; // 2時間未満

    let bestScore = 0;
    let bestDestPort = null;
    let bestPurchasePlan = null;

    for (const destPortId in ports) {
        if (destPortId === currentPortId) continue;

        const plan = calculateOptimalPurchaseForDestination(destPortId);

        if (!plan) continue;

        // 残り時間チェック
        if (plan.estimatedDays + BUFFER_DAYS > remainingGameDays) {
            continue; // 時間内に完了できない
        }

        // スコア計算
        let score;
        if (isShortTerm) {
            // 短期: 時間効率を優先
            score = plan.timeEfficiency;
        } else {
            // 長期: 総利益と時間効率のバランス
            score = plan.totalProfit * 0.7 + plan.timeEfficiency * 100;
        }

        if (score > bestScore) {
            bestScore = score;
            bestDestPort = destPortId;
            bestPurchasePlan = plan;
        }
    }

    // ... 残りのコード ...
}
```

## 成功基準

1. **機能性**: 指定時間内にオートパイロットが完了する
2. **利益向上**: 従来比で15%以上の利益向上（短期オートパイロット）
3. **安定性**: エラーや無限ループが発生しない
4. **互換性**: 既存の動作を破壊しない

## 備考

- 実装は段階的に行い、各Phaseでテストする
- デバッグログは実装中は有効にし、完成後は削減可能
