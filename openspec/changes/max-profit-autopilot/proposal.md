# 提案: オートパイロット最大利益機能

## 概要

オートパイロットを改善し、指定された時間内で最大の利益を生み出すように動作させる。

## 現状の問題点

現在のオートパイロット実装（`autopilot-service.js`）には以下の問題がある：

1. **時間効率を考慮していない**
   - `findBestTrade()` は総利益（totalProfit）のみを最大化
   - 時間当たりの利益（利益/日数）を考慮していない
   - 結果として、長距離・低効率ルートが選ばれることがある

2. **残り時間を考慮していない**
   - 指定時間（durationMinutes）を使い切る前にタイムアウトする可能性
   - 最後のサイクルで中途半端なルートを開始し、完了できないことがある

3. **複数サイクルの最適化がない**
   - 1回の取引のみを最適化
   - 時間内に複数回の取引を行う場合の総利益を考慮していない

## 提案する解決策

### 1. 時間効率ベースの判断

以下の指標を導入：

```javascript
// 時間効率 = 総利益 / (航海日数 + 取引時間)
timeEfficiency = totalProfit / (estimatedDays + TRADE_TIME_OVERHEAD)
```

### 2. 残り時間チェック

```javascript
// 残り時間で完了できるルートのみを選択
const remainingMinutes = autopilotDurationMinutes - elapsedMinutes;
const remainingGameDays = remainingMinutes / REAL_TIME_TO_GAME_DAY_RATIO;

if (estimatedDays + bufferDays <= remainingGameDays) {
    // このルートは時間内に完了可能
}
```

### 3. 最適化戦略

**短期オートパイロット（< 2時間）:**
- 時間効率（利益/日）を最優先
- 短距離・高回転率のルート

**長期オートパイロット（≥ 2時間）:**
- 総利益を優先しつつ、時間効率も考慮
- バランス型の戦略

## 期待される効果

1. **利益向上**: 指定時間内での総利益が15-30%向上（推定）
2. **予測可能性**: 時間内に完了できるルートのみを選択
3. **柔軟性**: 短期・長期それぞれに最適な戦略

## 実装の影響範囲

### 変更が必要なファイル

- `src/services/autopilot-service.js`
  - `findBestTrade()`: 時間効率を考慮した選択
  - `calculateOptimalPurchaseForDestination()`: 時間効率の計算を追加
  - 新規関数: `calculateTimeEfficiency()`, `getRemainingTime()`

### 変更が不要なファイル

- UI関連（透過的に動作）
- 他のサービス（port, supply, voyage, tradeなど）

## リスクと対策

### リスク1: 計算オーバーヘッド
- **対策**: 効率計算は軽量（O(1)の追加計算のみ）

### リスク2: 既存の動作の変化
- **対策**: 既存の動作を保持しつつ、最適化を追加
- **対策**: 時間指定がない場合は従来通りの動作

## 参照

- [BALANCE_REPORT.md](../../../BALANCE_REPORT.md) - 貿易ルートの効率分析
- [autopilot-service.js](../../../src/services/autopilot-service.js) - 現在の実装
