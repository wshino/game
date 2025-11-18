# 港への投資システム仕様

## 概要

プレイヤーが各港に施設を建設し、長期的な恩恵を得るシステム。

## 目的

1. お金の使い道を提供する
2. 港ごとの戦略性を高める
3. 長期的な目標を提供する
4. ゲームの深みを増す

## 施設の種類

### 1. 倉庫（Warehouse）🏪

**概要**: 港に商品を保管できるスペースを提供

**レベルとコスト**:
- レベル1: 5,000G → 保管スペース50個
- レベル2: 10,000G → 保管スペース100個
- レベル3: 20,000G → 保管スペース150個

**効果**:
- その港で商品を保管可能
- 港在庫が不足している時の補完
- 価格が良い時まで保管して待つことができる

**使用例**:
1. カリカットで香辛料を買い占める
2. 在庫が不足したら倉庫から取り出す
3. リスボンへ輸送して高値で売却

**実装の詳細**:
```javascript
// gameState に追加
portWarehouses: {
    lisbon: {
        capacity: 0,        // 保管可能数
        goods: {}           // { goodId: quantity }
    }
    // ... 他の港
}

// 倉庫への預け入れ
function depositToWarehouse(portId, goodId, quantity) {
    // プレイヤーの在庫から倉庫へ移動
    gameState.inventory[goodId] -= quantity;
    gameState.portWarehouses[portId].goods[goodId] += quantity;
}

// 倉庫からの引き出し
function withdrawFromWarehouse(portId, goodId, quantity) {
    // 倉庫からプレイヤーの在庫へ移動
    gameState.portWarehouses[portId].goods[goodId] -= quantity;
    gameState.inventory[goodId] += quantity;
}
```

**UI**:
- 港画面に「倉庫」タブを追加
- 預け入れ/引き出しボタン
- 保管中の商品一覧

### 2. 商館（Trading Post）🏛️

**概要**: 取引価格を優遇する施設

**レベルとコスト**:
- レベル1: 10,000G → 取引価格5%優遇
- レベル2: 20,000G → 取引価格10%優遇

**効果**:
- 購入時: 価格が5%/10% 割引
- 売却時: 価格が5%/10% 増加

**投資回収期間（ROI）**:

**例1: レベル1（10,000G）をカリカットに建設**
- 香辛料の通常購入価格: 90G
- 割引後: 85.5G（-4.5G）
- 往復利益の増加: 約9G/個
- 100個取引で900G増加
- **ROI: 約11回の取引（1,100個）で回収**

**例2: レベル2（20,000G）をリスボンに建設**
- 全商品の取引で10%ボーナス
- 頻繁に訪れる港ほど効果大
- **ROI: 約15-20回の大規模取引で回収**

**実装の詳細**:
```javascript
// 価格計算時にボーナスを適用
function calculateFinalPrice(basePrice, portId, isBuying) {
    const bonus = getFacilityBonus(portId, 'tradingPost', 'priceBonus');

    if (isBuying) {
        return Math.round(basePrice * (1 - bonus));  // 購入時は割引
    } else {
        return Math.round(basePrice * (1 + bonus));  // 売却時はボーナス
    }
}
```

### 3. 造船所（Shipyard）⚓

**概要**: 船の修理・メンテナンスを可能にする（将来の拡張用）

**レベルとコスト**:
- レベル1: 15,000G → 修理機能解放

**効果**:
- 現在の実装では効果なし（将来の拡張用）
- 将来的な船のダメージシステムに対応

**将来の拡張案**:
- 航海中に船がダメージを受ける
- 造船所がある港でのみ修理可能
- 修理費用が割引される

**実装の詳細**:
```javascript
// 将来の実装用（現在は効果なし）
function canRepairShip(portId) {
    return getFacilityLevel(portId, 'shipyard') > 0;
}
```

### 4. 市場拡張（Market Expansion）🏬

**概要**: 港の在庫上限と回復速度を向上させる

**レベルとコスト**:
- レベル1: 8,000G → 在庫+25%
- レベル2: 16,000G → 在庫+50%

**効果**:
- 港の最大在庫が増加
- 在庫回復速度が増加
- より多くの商品を購入可能

**具体例**:
```
カリカット（中規模港）:
- 通常: 最大60個、回復5個/日
- レベル1: 最大75個、回復6個/日
- レベル2: 最大90個、回復7個/日

ヴェネツィア（最大規模港）:
- 通常: 最大150個、回復12個/日
- レベル1: 最大187個、回復15個/日
- レベル2: 最大225個、回復18個/日
```

**実装の詳細**:
```javascript
// 港の最大在庫を動的に計算
function getMaxStock(portId) {
    const port = ports[portId];
    const baseMax = portSizeConfig[port.size].maxStock;
    const bonus = getFacilityBonus(portId, 'market', 'stockBonus');

    return Math.floor(baseMax * (1 + bonus));
}

// 在庫回復速度を動的に計算
function getRefreshRate(portId) {
    const port = ports[portId];
    const baseRate = portSizeConfig[port.size].refreshRate;
    const bonus = getFacilityBonus(portId, 'market', 'stockBonus');

    return Math.floor(baseRate * (1 + bonus));
}
```

## 名声システム

### 名声レベルの定義

港への総投資額に応じて名声レベルが上がる。

| レベル | 名称 | 必要投資額 | 説明 |
|--------|------|-----------|------|
| 0 | 無名 | 0G | 普通の商人 |
| 1 | 知人 | 10,000G | 港で顔を知られる |
| 2 | 友人 | 30,000G | 港から信頼される |
| 3 | 名士 | 60,000G | 港の重要人物 |
| 4 | 支配者 | 100,000G | 港を実質的に支配 |

### 名声による効果

**現在の実装**:
- 称号の表示のみ（ステータス効果）

**将来の拡張案**:
- 高い名声レベルで特別な商品が購入可能
- 高い名声レベルで融資が受けられる
- 港の政治に影響を与える

### 実装の詳細

```javascript
export function getPortReputation(portId) {
    const totalInvestment = getTotalInvestment(portId);

    // 名声レベルを逆順で探索（高い方から）
    for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
        if (totalInvestment >= REPUTATION_LEVELS[i].minInvestment) {
            return REPUTATION_LEVELS[i];
        }
    }

    return REPUTATION_LEVELS[0];
}
```

## データ構造

### gameState への追加

```javascript
gameState = {
    // ... 既存のプロパティ

    // 投資情報（各港の施設レベル）
    portInvestments: {
        lisbon: {
            warehouse: 0,      // 0-3
            tradingPost: 0,    // 0-2
            shipyard: 0,       // 0-1
            market: 0          // 0-2
        },
        seville: { /* ... */ },
        venice: { /* ... */ },
        alexandria: { /* ... */ },
        calicut: { /* ... */ },
        malacca: { /* ... */ },
        nagasaki: { /* ... */ }
    },

    // 倉庫の内容
    portWarehouses: {
        lisbon: {
            capacity: 0,       // 保管可能数
            goods: {}          // { goodId: quantity }
        },
        // ... 他の港
    }
};
```

### constants.js への追加

```javascript
// 施設の定義
export const FACILITIES = {
    warehouse: {
        name: '倉庫',
        icon: '🏪',
        maxLevel: 3,
        costs: [5000, 10000, 20000],
        effects: [
            { storage: 50 },
            { storage: 100 },
            { storage: 150 }
        ],
        description: '商品を保管できるスペースが増える'
    },
    // ... 他の施設
};

// 名声レベル
export const REPUTATION_LEVELS = [
    { level: 0, name: '無名', minInvestment: 0 },
    { level: 1, name: '知人', minInvestment: 10000 },
    { level: 2, name: '友人', minInvestment: 30000 },
    { level: 3, name: '名士', minInvestment: 60000 },
    { level: 4, name: '支配者', minInvestment: 100000 }
];
```

## UI 仕様

### 港投資パネル

**位置**: アクションパネルの新しいタブ「🏛️ 港投資」

**表示内容**:

1. **現在の港情報**
   - 港名
   - 名声レベル（アイコン+名称）
   - 総投資額

2. **建設可能な施設一覧**
   - 各施設ごとにカード形式で表示
   - 施設名とアイコン
   - 現在のレベル / 最大レベル
   - 次のレベルのコスト
   - 効果の説明
   - 建設ボタン（資金不足時はグレーアウト）

3. **既存施設の一覧**
   - 建設済み施設のリスト
   - レベルと効果の表示

**HTMLの例**:
```html
<div id="port-investment-panel" class="panel">
    <h3>🏛️ 港投資 - <span id="current-port-name"></span></h3>

    <div class="port-reputation">
        <p>名声レベル: <span id="reputation-level"></span></p>
        <p>総投資額: <span id="total-investment"></span>G</p>
    </div>

    <h4>建設可能な施設</h4>
    <div id="facilities-list"></div>

    <h4>既存施設</h4>
    <div id="existing-facilities-list"></div>
</div>
```

**CSSの例**:
```css
.facility-card {
    border: 2px solid #8B4513;
    border-radius: 8px;
    padding: 10px;
    margin: 10px 0;
    background: linear-gradient(135deg, #f5f5dc 0%, #d2b48c 100%);
}

.facility-card.max-level {
    opacity: 0.6;
}

.facility-icon {
    font-size: 2em;
}

.build-button {
    background: linear-gradient(135deg, #228B22 0%, #32CD32 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
}

.build-button:disabled {
    background: #999;
    cursor: not-allowed;
}
```

### 倉庫管理パネル

**位置**: 港投資パネルのサブパネル

**表示内容**:
- 倉庫の容量（使用中/最大）
- 保管中の商品一覧
- 預け入れ/引き出しボタン

**操作フロー**:
1. 倉庫がある港で「倉庫」タブをクリック
2. 保管中の商品一覧が表示される
3. プレイヤーの在庫から預け入れ、または倉庫から引き出し

## ゲームバランス

### 施設のコストとROI

| 施設 | レベル | コスト | ROI（回収までの取引回数） |
|------|--------|--------|--------------------------|
| 倉庫 | 1 | 5,000G | -（間接的な効果） |
| 商館 | 1 | 10,000G | 約11回（香辛料100個/回） |
| 商館 | 2 | 20,000G | 約18回（香辛料100個/回） |
| 市場 | 1 | 8,000G | - （購入量増加による間接効果） |
| 造船所 | 1 | 15,000G | - （将来の実装用） |

### 投資の優先順位（推奨）

**序盤（資金 < 50,000G）**:
1. 最もよく使う港に商館レベル1
2. 香辛料を扱う港（カリカット、マラッカ）を優先

**中盤（資金 50,000G - 200,000G）**:
1. 主要港に商館レベル2
2. 在庫不足が問題になる港に市場拡張
3. 長距離ルートの港に倉庫

**終盤（資金 > 200,000G）**:
1. 全港に施設を建設
2. 名声レベル最大を目指す
3. 倉庫を活用した高度な戦略

## オートパイロットとの統合

### 自動的な反映

投資ボーナスは価格計算に自動的に反映されるため、オートパイロットも自動的に恩恵を受ける。

```javascript
// オートパイロットの購入プラン計算
function calculateOptimalPurchaseForDestination(destPortId) {
    // 価格計算時に投資ボーナスが自動的に適用される
    const buyPrice = calculatePrice(goodId, currentPort);  // 商館ボーナス適用済み
    const sellPrice = calculateSellPrice(goodId, destPortId);  // 商館ボーナス適用済み

    // ... 以降の計算は変更なし
}
```

### 倉庫の扱い

オートパイロットは倉庫を使用しない（手動プレイ専用機能）。

## テストケース

### Test 1: 施設建設

**手順**:
1. 資金10,000Gを用意
2. リスボンで商館レベル1を建設
3. 資金が0Gになることを確認
4. 施設レベルが1になることを確認

**期待結果**: 正しく建設される

### Test 2: 価格ボーナス

**手順**:
1. カリカットに商館レベル1を建設
2. 香辛料の購入価格を確認
3. ボーナス前と比較して5%安くなっていることを確認

**期待結果**: 価格が5%割引される

### Test 3: 名声レベル

**手順**:
1. リスボンに合計30,000G投資
2. 名声レベルが「友人」になることを確認

**期待結果**: 名声レベルが正しく計算される

### Test 4: 倉庫機能

**手順**:
1. リスボンに倉庫レベル1を建設
2. 香辛料50個を倉庫に預ける
3. プレイヤーの在庫から減ることを確認
4. 倉庫から引き出す
5. プレイヤーの在庫に戻ることを確認

**期待結果**: 倉庫への預け入れ/引き出しが正しく動作する

### Test 5: セーブ/ロード

**手順**:
1. 複数の港に施設を建設
2. ページをリロード
3. 投資データが正しく復元されることを確認

**期待結果**: データが永続化される

## 後方互換性

### 古いセーブデータへの対応

```javascript
function loadGame() {
    const saved = JSON.parse(localStorage.getItem('gameState'));

    // 投資データがない場合は初期化
    if (!saved.portInvestments) {
        saved.portInvestments = {};
        for (const portId in ports) {
            saved.portInvestments[portId] = {
                warehouse: 0,
                tradingPost: 0,
                shipyard: 0,
                market: 0
            };
        }
    }

    // 倉庫データがない場合は初期化
    if (!saved.portWarehouses) {
        saved.portWarehouses = {};
        for (const portId in ports) {
            saved.portWarehouses[portId] = {
                capacity: 0,
                goods: {}
            };
        }
    }

    return saved;
}
```

## パフォーマンス

### 計算量

- 施設建設: O(1)
- ボーナス計算: O(1)
- 名声レベル計算: O(n)（nは名声レベルの種類、最大5）

### メモリ使用量

- 各港の投資データ: 約100バイト
- 倉庫データ: 商品数に依存（最大数百バイト）
- **総計**: 数KB程度（無視できるレベル）

## まとめ

港への投資システムは、ゲームに長期的な目標とお金の使い道を提供する重要な機能です。段階的な実装とバランス調整により、プレイヤーに戦略的な選択肢を提供し、ゲームの深みを増すことが期待されます。
