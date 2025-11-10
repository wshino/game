# オートパイロット仕様 - 最大利益モード

## 概要

指定された時間内で最大の利益を生み出すオートパイロット機能。

## 設計原則

1. **時間厳守**: 指定時間内に確実に完了するルートのみを選択
2. **利益最大化**: 時間内での総利益を最大化
3. **適応的戦略**: 短期/長期で最適な戦略を切り替え

## アルゴリズム仕様

### 1. 時間管理

#### 1.1 残り時間の計算

```javascript
remainingMinutes = autopilotDurationMinutes - (Date.now() - autopilotStartTime) / 60000
remainingGameDays = (remainingMinutes × 60) / REAL_TIME_PER_GAME_DAY
```

**定数:**
- `REAL_TIME_PER_GAME_DAY = 15` (秒) - リアル15秒 = ゲーム1日

**安全マージン:**
- `BUFFER_DAYS = 5` (ゲーム日) - 予期しない遅延に備えた余裕

#### 1.2 完了可能性チェック

```javascript
isCompletable = (estimatedDays + BUFFER_DAYS) <= remainingGameDays
```

### 2. 時間効率計算

#### 2.1 時間効率の定義

```javascript
timeEfficiency = totalProfit / (estimatedDays + TRADE_TIME_OVERHEAD)
```

**定数:**
- `TRADE_TIME_OVERHEAD = 2` (ゲーム日) - 購入・売却の処理時間

#### 2.2 時間効率の意味

- 単位: ゴールド/日
- 高いほど、短時間で多くの利益を得られる
- 例: 600G / (10日 + 2日) = 50 G/日

### 3. 最適化戦略

#### 3.1 戦略の切り替え条件

```javascript
isShortTerm = autopilotDurationMinutes < 120  // 2時間未満
```

#### 3.2 短期戦略（< 2時間）

**目標**: 時間効率を最大化

```javascript
score = timeEfficiency
```

**特徴:**
- 短距離・高回転率のルート優先
- 例: リスボン ⇄ セビリア（2日）
- 複数サイクルで利益を積み重ねる

#### 3.3 長期戦略（≥ 2時間）

**目標**: 総利益と時間効率のバランス

```javascript
score = totalProfit × 0.7 + timeEfficiency × 100
```

**重み付け:**
- 総利益: 70%
- 時間効率: 30%

**特徴:**
- 中長距離の高利益ルートも考慮
- 例: カリカット → リスボン（香辛料、30日）
- 単発の大きな利益を狙う

### 4. ルート選択フロー

```
開始
  ↓
商品を持っているか？
  ├─ Yes → 最高値で売れる港を探す
  │         └─ 現在地で売る or 移動して売る
  │
  └─ No → 全ての目的地を評価
            ↓
        各目的地について:
          1. 購入プランを計算
          2. 時間効率を計算
          3. 残り時間で完了できるか確認
            ↓
        スコア計算（短期/長期戦略）
            ↓
        最高スコアのルートを選択
            ↓
        購入プランを実行
            ↓
        出港
```

### 5. 購入プラン計算

#### 5.1 入力
- `destPortId`: 目的地の港ID
- 現在の状態（位置、資金、船、在庫）

#### 5.2 計算手順

1. **航海コスト計算**
   ```javascript
   estimatedDays = Math.round(portDistances[current][dest] / shipSpeed)
   supplyCost = calculateSupplyCost(estimatedDays)
   ```

2. **利用可能な資金とスペース**
   ```javascript
   availableMoney = gold - supplyCost - SAFETY_RESERVE
   availableSpace = cargoSpace - suppliesSpace
   ```

3. **商品の利益率計算**
   ```javascript
   profitPerUnit = sellPrice[dest] - buyPrice[current]
   ```

4. **グリーディナップサック**
   - 利益率の高い順に商品を選択
   - 資金・スペース・在庫の制約を考慮
   ```javascript
   quantity = min(
       floor(availableMoney / buyPrice),
       availableSpace,
       portStock
   )
   ```

5. **総利益と時間効率**
   ```javascript
   totalProfit = totalRevenue - totalPurchaseCost - supplyCost
   timeEfficiency = totalProfit / (estimatedDays + TRADE_TIME_OVERHEAD)
   ```

#### 5.3 出力

```javascript
{
    totalProfit: number,
    estimatedDays: number,
    timeEfficiency: number,
    goodsToBuy: [
        { goodId, maxQuantity, buyPrice, sellPrice, purchased: 0 }
    ],
    supplyCost: number,
    waterNeeded: number,
    foodNeeded: number
}
```

### 6. 定数

```javascript
// 時間管理
REAL_TIME_PER_GAME_DAY = 15        // 秒
BUFFER_DAYS = 5                     // ゲーム日
TRADE_TIME_OVERHEAD = 2             // ゲーム日

// 戦略切り替え
SHORT_TERM_THRESHOLD = 120          // 分（2時間）

// スコア重み付け（長期戦略）
LONG_TERM_PROFIT_WEIGHT = 0.7
LONG_TERM_EFFICIENCY_WEIGHT = 0.3
EFFICIENCY_MULTIPLIER = 100

// 既存の定数（変更なし）
AUTOPILOT_CONFIG.SAFETY_RESERVE = 50
AUTOPILOT_CONFIG.CARGO_UTILIZATION_RATIO = 0.98
AUTOPILOT_CONFIG.MINIMUM_PROFIT_THRESHOLD = 50
```

## 期待される動作

### シナリオ1: 短期オートパイロット（1時間）

**条件:**
- 実行時間: 1時間（60分）
- 換算: 60分 × 60秒/分 / 15秒/日 = 240ゲーム日

**動作:**
1. 短距離ルートを優先（2-5日の航海）
2. 20-40サイクルの取引を実行
3. 時間効率50-100 G/日のルートを選択

**例:**
- リスボン → セビリア（2日、金鉱石）
- セビリア → リスボン（2日、売却）
- 繰り返し

### シナリオ2: 長期オートパイロット（8時間）

**条件:**
- 実行時間: 8時間（480分）
- 換算: 480分 × 60秒/分 / 15秒/日 = 1920ゲーム日

**動作:**
1. 中長距離の高利益ルートも考慮
2. 10-30サイクルの取引を実行
3. 総利益500-2000Gのルートを選択

**例:**
- リスボン → カリカット（30日、ワイン）
- カリカット → リスボン（30日、香辛料）
- 総利益: 1500G/サイクル

## 後方互換性

- 既存の `findBestTrade()` の動作を保持
- 時間制約がない場合（autopilotActive=false）は従来通りの動作
- UI変更は不要（透過的に動作）

## パフォーマンス

- 計算量: O(n²)（nは港の数、現在7港）
- 各サイクルの計算時間: < 10ms（推定）
- オーバーヘッド: 無視できるレベル

## テストケース

### Test 1: 残り時間チェック
- 残り時間: 60ゲーム日
- 航海日数: 50日 → 選択可能
- 航海日数: 60日 → 選択不可（バッファ考慮）

### Test 2: 短期戦略
- 時間: 1時間
- 期待: 短距離ルート（2-5日）が選ばれる

### Test 3: 長期戦略
- 時間: 8時間
- 期待: 高利益ルート（15-30日）も選ばれる

### Test 4: タイムアウト
- 残り時間が少ない場合、完了可能なルートのみ選択
- タイムアウト時に中途半端な状態にならない
