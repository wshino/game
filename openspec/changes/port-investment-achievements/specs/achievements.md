# 実績・称号システム仕様

## 概要

プレイヤーの進捗と達成を追跡し、称号とボーナスを付与するシステム。

## 目的

1. 長期的な目標を提供する
2. プレイヤーの進捗を可視化する
3. 達成感を提供する
4. やり込み要素を追加する

## 実績の種類

### 1. 財産ベースの称号

プレイヤーの最高所持金に基づいて自動的に解除される。

#### 見習い商人（Apprentice Merchant）

- **条件**: ゲーム開始時（0G）
- **アイコン**: 🌱
- **説明**: 冒険の始まり
- **ボーナス**: なし

#### 商人（Merchant）

- **条件**: 10,000G達成
- **アイコン**: 💰
- **説明**: まともな資産を持つ商人
- **ボーナス**: なし

#### 大商人（Great Merchant）

- **条件**: 50,000G達成
- **アイコン**: 💎
- **説明**: 船のアップグレードを完了した商人
- **ボーナス**: なし

#### 豪商（Wealthy Merchant）

- **条件**: 100,000G達成
- **アイコン**: 👑
- **説明**: 大きな富を築いた商人
- **ボーナス**: 全港での取引+2%

#### 貿易王（Trade King）

- **条件**: 500,000G達成
- **アイコン**: 🏆
- **説明**: 膨大な富を築いた伝説の商人
- **ボーナス**: 全港での取引+5%

#### 海洋覇者（Sea Lord）

- **条件**: 1,000,000G達成
- **アイコン**: ⚜️
- **説明**: 海を支配する究極の商人
- **ボーナス**: 全港での取引+10%

### 2. 行動ベースの実績

プレイヤーの行動に基づいて解除される。

#### 世界一周（World Traveler）

- **条件**: 全7港を訪問
- **アイコン**: 🌍
- **説明**: 世界中の港を訪れた冒険家
- **ボーナス**: 初回達成時に1,000G獲得

#### 香辛料王（Spice King）

- **条件**: 香辛料を累計500個取引
- **アイコン**: 🌶️
- **説明**: 香辛料貿易のエキスパート
- **ボーナス**: 香辛料の取引価格+3%

#### 貿易マスター（Trade Master）

- **条件**: 累計100回の航海
- **アイコン**: ⛵
- **説明**: 海を知り尽くした航海士
- **ボーナス**: 補給費用-10%

#### 投資家（Investor）

- **条件**: 全7港に少なくとも1つの施設を建設
- **アイコン**: 🏛️
- **説明**: 世界中に影響力を持つ投資家
- **ボーナス**: 全港での取引+2%

#### 港の支配者（Port Ruler）

- **条件**: 1つの港で名声レベル最大（100,000G投資）
- **アイコン**: 👑
- **説明**: ある港を完全に支配する商人
- **ボーナス**: その港での取引+5%（追加ボーナス）

#### 絹の道（Silk Road）

- **条件**: 絹を累計300個取引
- **アイコン**: 🎀
- **説明**: 絹貿易のエキスパート
- **ボーナス**: 絹の取引価格+3%

#### 黄金の船団（Golden Fleet）

- **条件**: 東インド会社船（最高級の船）を所有
- **アイコン**: 🚢
- **説明**: 最高級の船を手に入れた商人
- **ボーナス**: 全航海の速度+5%

#### 億万長者（Billionaire）

- **条件**: 累計で1,000,000G以上獲得
- **アイコン**: 💵
- **説明**: 生涯で膨大な富を築いた
- **ボーナス**: 全取引+3%

## 実績解除のフロー

```
プレイヤーの行動
  ↓
統計情報の更新（updateStatistics）
  ↓
実績チェック（checkAchievements）
  ↓
条件を満たす実績を検出
  ↓
実績を解除（unlockAchievement）
  ↓
UI更新 + アニメーション
  ↓
ボーナスを適用
```

## データ構造

### gameState への追加

```javascript
gameState = {
    // ... 既存のプロパティ

    // 実績の達成状況
    achievements: {
        apprentice: true,       // 初期状態で解除済み
        merchant: false,
        greatMerchant: false,
        wealthyMerchant: false,
        tradeKing: false,
        seaLord: false,
        worldTraveler: false,
        spiceKing: false,
        tradeMaster: false,
        investor: false,
        portRuler: false,
        silkRoad: false,
        goldenFleet: false,
        billionaire: false
    },

    // 統計情報
    statistics: {
        maxGold: 0,                // 最高所持金
        totalGoldEarned: 0,        // 累計獲得金額
        totalVoyages: 0,           // 累計航海数
        totalTrades: 0,            // 累計取引数
        goodsTraded: {             // 商品別の累計取引数
            wine: 0,
            textile: 0,
            spice: 0,
            silk: 0,
            gold: 0,
            porcelain: 0,
            tea: 0,
            silver: 0
        },
        portsVisited: {            // 訪問済みの港
            lisbon: true,          // 初期位置
            seville: false,
            venice: false,
            alexandria: false,
            calicut: false,
            malacca: false,
            nagasaki: false
        }
    }
};
```

### constants.js への追加

```javascript
// 実績の定義
export const ACHIEVEMENTS = {
    // 財産ベース
    apprentice: {
        id: 'apprentice',
        name: '見習い商人',
        icon: '🌱',
        description: '冒険の始まり',
        condition: { type: 'maxGold', value: 0 },
        bonus: null
    },
    merchant: {
        id: 'merchant',
        name: '商人',
        icon: '💰',
        description: '10,000Gを達成',
        condition: { type: 'maxGold', value: 10000 },
        bonus: null
    },
    greatMerchant: {
        id: 'greatMerchant',
        name: '大商人',
        icon: '💎',
        description: '50,000Gを達成',
        condition: { type: 'maxGold', value: 50000 },
        bonus: null
    },
    wealthyMerchant: {
        id: 'wealthyMerchant',
        name: '豪商',
        icon: '👑',
        description: '100,000Gを達成',
        condition: { type: 'maxGold', value: 100000 },
        bonus: { type: 'allPrices', value: 0.02 }
    },
    tradeKing: {
        id: 'tradeKing',
        name: '貿易王',
        icon: '🏆',
        description: '500,000Gを達成',
        condition: { type: 'maxGold', value: 500000 },
        bonus: { type: 'allPrices', value: 0.05 }
    },
    seaLord: {
        id: 'seaLord',
        name: '海洋覇者',
        icon: '⚜️',
        description: '1,000,000Gを達成',
        condition: { type: 'maxGold', value: 1000000 },
        bonus: { type: 'allPrices', value: 0.10 }
    },

    // 行動ベース
    worldTraveler: {
        id: 'worldTraveler',
        name: '世界一周',
        icon: '🌍',
        description: '全7港を訪問',
        condition: { type: 'portsVisited', value: 7 },
        bonus: { type: 'goldReward', value: 1000 }
    },
    spiceKing: {
        id: 'spiceKing',
        name: '香辛料王',
        icon: '🌶️',
        description: '香辛料を累計500個取引',
        condition: { type: 'goodTraded', good: 'spice', value: 500 },
        bonus: { type: 'goodPrice', good: 'spice', value: 0.03 }
    },
    tradeMaster: {
        id: 'tradeMaster',
        name: '貿易マスター',
        icon: '⛵',
        description: '累計100回の航海',
        condition: { type: 'totalVoyages', value: 100 },
        bonus: { type: 'supplyCost', value: -0.10 }
    },
    investor: {
        id: 'investor',
        name: '投資家',
        icon: '🏛️',
        description: '全港に少なくとも1つの施設を建設',
        condition: { type: 'facilitiesInAllPorts', value: 1 },
        bonus: { type: 'allPrices', value: 0.02 }
    },
    portRuler: {
        id: 'portRuler',
        name: '港の支配者',
        icon: '👑',
        description: '1つの港で名声レベル最大',
        condition: { type: 'maxReputationInOnePort', value: 4 },
        bonus: { type: 'portPriceBonus', value: 0.05 }
    },
    silkRoad: {
        id: 'silkRoad',
        name: '絹の道',
        icon: '🎀',
        description: '絹を累計300個取引',
        condition: { type: 'goodTraded', good: 'silk', value: 300 },
        bonus: { type: 'goodPrice', good: 'silk', value: 0.03 }
    },
    goldenFleet: {
        id: 'goldenFleet',
        name: '黄金の船団',
        icon: '🚢',
        description: '東インド会社船を所有',
        condition: { type: 'shipType', value: 'east_india' },
        bonus: { type: 'shipSpeed', value: 0.05 }
    },
    billionaire: {
        id: 'billionaire',
        name: '億万長者',
        icon: '💵',
        description: '累計で1,000,000G以上獲得',
        condition: { type: 'totalGoldEarned', value: 1000000 },
        bonus: { type: 'allPrices', value: 0.03 }
    }
};
```

## API 仕様

### achievement-service.js

```javascript
/**
 * 統計情報を更新する
 * @param {string} action - アクション種類（'trade', 'voyage', 'arrival'）
 * @param {object} data - アクションのデータ
 */
export function updateStatistics(action, data) {
    switch (action) {
        case 'trade':
            gameState.statistics.totalTrades++;
            if (data.goodId) {
                gameState.statistics.goodsTraded[data.goodId] += data.quantity;
            }
            break;

        case 'voyage':
            gameState.statistics.totalVoyages++;
            break;

        case 'arrival':
            gameState.statistics.portsVisited[data.portId] = true;
            break;

        case 'goldChange':
            if (data.newGold > gameState.statistics.maxGold) {
                gameState.statistics.maxGold = data.newGold;
            }
            if (data.profit > 0) {
                gameState.statistics.totalGoldEarned += data.profit;
            }
            break;
    }
}

/**
 * 実績をチェックして解除する
 */
export function checkAchievements() {
    for (const achievementId in ACHIEVEMENTS) {
        // すでに解除済みの場合はスキップ
        if (gameState.achievements[achievementId]) {
            continue;
        }

        const achievement = ACHIEVEMENTS[achievementId];

        // 条件をチェック
        if (checkCondition(achievement.condition)) {
            unlockAchievement(achievementId);
        }
    }
}

/**
 * 条件をチェックする
 */
function checkCondition(condition) {
    switch (condition.type) {
        case 'maxGold':
            return gameState.statistics.maxGold >= condition.value;

        case 'totalGoldEarned':
            return gameState.statistics.totalGoldEarned >= condition.value;

        case 'totalVoyages':
            return gameState.statistics.totalVoyages >= condition.value;

        case 'portsVisited':
            const visitedCount = Object.values(gameState.statistics.portsVisited)
                .filter(v => v === true).length;
            return visitedCount >= condition.value;

        case 'goodTraded':
            return gameState.statistics.goodsTraded[condition.good] >= condition.value;

        case 'facilitiesInAllPorts':
            // 全港に少なくとも1つの施設があるか
            for (const portId in gameState.portInvestments) {
                const facilities = gameState.portInvestments[portId];
                const totalFacilities = Object.values(facilities).reduce((a, b) => a + b, 0);
                if (totalFacilities < condition.value) {
                    return false;
                }
            }
            return true;

        case 'maxReputationInOnePort':
            // 1つの港で最大名声レベルに達しているか
            for (const portId in gameState.portInvestments) {
                const reputation = getPortReputation(portId);
                if (reputation.level >= condition.value) {
                    return true;
                }
            }
            return false;

        case 'shipType':
            return gameState.ship.type === condition.value;

        default:
            return false;
    }
}

/**
 * 実績を解除する
 */
export function unlockAchievement(achievementId) {
    gameState.achievements[achievementId] = true;

    const achievement = ACHIEVEMENTS[achievementId];

    // ログ
    addLog(`🏆 実績解除: ${achievement.name} - ${achievement.description}`);

    // ボーナスの適用
    if (achievement.bonus) {
        applyBonus(achievement.bonus);
    }

    // UIアニメーション
    showAchievementUnlocked(achievement);
}

/**
 * ボーナスを適用する
 */
function applyBonus(bonus) {
    switch (bonus.type) {
        case 'goldReward':
            gameState.gold += bonus.value;
            addLog(`ボーナス: ${bonus.value}Gを獲得！`);
            break;

        // 価格ボーナスは計算時に自動的に適用される
        case 'allPrices':
        case 'goodPrice':
        case 'portPriceBonus':
        case 'supplyCost':
        case 'shipSpeed':
            // これらは価格計算や航海計算時に参照される
            break;
    }
}

/**
 * 現在の称号を取得する
 */
export function getCurrentTitle() {
    // 財産ベースの称号を逆順でチェック（高い方から）
    const titles = ['seaLord', 'tradeKing', 'wealthyMerchant', 'greatMerchant', 'merchant', 'apprentice'];

    for (const titleId of titles) {
        if (gameState.achievements[titleId]) {
            return ACHIEVEMENTS[titleId];
        }
    }

    return ACHIEVEMENTS.apprentice;
}

/**
 * 全ての実績ボーナスを合計する
 */
export function getTotalBonuses() {
    const bonuses = {
        allPrices: 0,
        goodPrices: {},
        supplyCost: 0,
        shipSpeed: 0
    };

    for (const achievementId in gameState.achievements) {
        if (!gameState.achievements[achievementId]) continue;

        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement.bonus) continue;

        switch (achievement.bonus.type) {
            case 'allPrices':
                bonuses.allPrices += achievement.bonus.value;
                break;

            case 'goodPrice':
                const good = achievement.bonus.good;
                bonuses.goodPrices[good] = (bonuses.goodPrices[good] || 0) + achievement.bonus.value;
                break;

            case 'supplyCost':
                bonuses.supplyCost += achievement.bonus.value;
                break;

            case 'shipSpeed':
                bonuses.shipSpeed += achievement.bonus.value;
                break;
        }
    }

    return bonuses;
}
```

## 統計情報の収集

### trade-service.js での統計更新

```javascript
// buyGood() 内
export function buyGood(goodId, quantity = 1) {
    // ... 既存のコード

    // 統計更新
    updateStatistics('trade', { goodId, quantity });
    updateStatistics('goldChange', { newGold: gameState.gold, profit: 0 });

    // ... 既存のコード
}

// sellGood() 内
export function sellGood(goodId, quantity = 1) {
    // ... 既存のコード

    const profit = sellPrice * quantity;
    updateStatistics('trade', { goodId, quantity });
    updateStatistics('goldChange', { newGold: gameState.gold, profit });

    // ... 既存のコード
}
```

### voyage-service.js での統計更新

```javascript
// startVoyage() 内
export function startVoyage(destinationPortId) {
    // ... 既存のコード

    updateStatistics('voyage', {});

    // ... 既存のコード
}

// completeVoyage() 内
export function completeVoyage() {
    // ... 既存のコード

    updateStatistics('arrival', { portId: gameState.currentPort });

    // 実績チェック
    checkAchievements();

    // ... 既存のコード
}
```

## UI 仕様

### 実績パネル

**位置**: アクションパネルの新しいタブ「🏆 実績」

**表示内容**:

1. **現在の称号**
   - 大きく表示（アイコン + 名前）
   - 称号の説明
   - 獲得しているボーナスの一覧

2. **達成済み実績**
   - 実績カード（アイコン + 名前 + 説明）
   - ボーナスの表示
   - 達成日時（オプション）

3. **未達成実績**
   - 進捗バー（例: 香辛料 250/500）
   - 達成に必要な条件
   - グレーアウト表示

**HTML の例**:
```html
<div id="achievement-panel" class="panel">
    <h3>🏆 実績</h3>

    <div class="current-title">
        <h2 id="title-display"></h2>
        <p id="title-description"></p>
        <div id="title-bonuses"></div>
    </div>

    <h4>達成済み実績</h4>
    <div id="unlocked-achievements"></div>

    <h4>未達成実績</h4>
    <div id="locked-achievements"></div>
</div>
```

### 実績解除アニメーション

**デザイン**: 画面中央にポップアップ表示

**アニメーション**:
1. フェードイン
2. スケールアップ（0.8 → 1.0）
3. 2秒間表示
4. フェードアウト

**CSS の例**:
```css
@keyframes achievementUnlock {
    0% {
        opacity: 0;
        transform: scale(0.8);
    }
    10% {
        opacity: 1;
        transform: scale(1.05);
    }
    20% {
        transform: scale(1.0);
    }
    90% {
        opacity: 1;
        transform: scale(1.0);
    }
    100% {
        opacity: 0;
        transform: scale(0.8);
    }
}

.achievement-unlock-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    border: 4px solid #8B4513;
    border-radius: 16px;
    padding: 30px;
    text-align: center;
    animation: achievementUnlock 3s ease-out;
    z-index: 1000;
}

.achievement-icon {
    font-size: 4em;
}
```

### ステータスバーへの称号表示

**位置**: ステータスバーの右側

**表示内容**: `🏆 [称号名]`

**クリックアクション**: 実績パネルを開く

## ボーナスの適用

### 価格計算への適用

```javascript
// trade-service.js
function calculateFinalPrice(basePrice, portId, goodId, isBuying) {
    let finalPrice = basePrice;

    // 商館のボーナス
    const tradingPostBonus = getFacilityBonus(portId, 'tradingPost', 'priceBonus');

    // 実績のボーナス
    const achievementBonuses = getTotalBonuses();
    const allPricesBonus = achievementBonuses.allPrices;
    const goodPriceBonus = achievementBonuses.goodPrices[goodId] || 0;

    // 合計ボーナス
    const totalBonus = tradingPostBonus + allPricesBonus + goodPriceBonus;

    if (isBuying) {
        finalPrice = Math.round(basePrice * (1 - totalBonus));  // 購入時は割引
    } else {
        finalPrice = Math.round(basePrice * (1 + totalBonus));  // 売却時はボーナス
    }

    return finalPrice;
}
```

### 補給費用への適用

```javascript
// supply-service.js
function calculateSupplyCost(days) {
    const baseCost = /* ... 基本コスト計算 ... */;

    // 実績ボーナス（貿易マスター）
    const achievementBonuses = getTotalBonuses();
    const supplyCostBonus = achievementBonuses.supplyCost;

    return Math.round(baseCost * (1 + supplyCostBonus));  // マイナスボーナスで安くなる
}
```

### 船速度への適用

```javascript
// voyage-service.js
function calculateVoyageTime(distance, shipSpeed) {
    // 実績ボーナス（黄金の船団）
    const achievementBonuses = getTotalBonuses();
    const speedBonus = achievementBonuses.shipSpeed;

    const effectiveSpeed = shipSpeed * (1 + speedBonus);

    return Math.round(distance / effectiveSpeed);
}
```

## テストケース

### Test 1: 財産ベースの称号

**手順**:
1. 開始時に「見習い商人」であることを確認
2. 10,000G達成
3. 「商人」に昇格することを確認

**期待結果**: 称号が正しく更新される

### Test 2: 行動ベースの実績

**手順**:
1. 香辛料を500個取引
2. 「香辛料王」が解除されることを確認
3. 香辛料の価格に+3%ボーナスが適用されることを確認

**期待結果**: 実績解除とボーナス適用が正しく動作する

### Test 3: 世界一周

**手順**:
1. 全7港を訪問
2. 「世界一周」が解除されることを確認
3. 1,000Gボーナスを獲得することを確認

**期待結果**: 報酬が正しく付与される

### Test 4: 統計情報の収集

**手順**:
1. 取引を10回実行
2. statistics.totalTrades が 10 になることを確認
3. 航海を5回実行
4. statistics.totalVoyages が 5 になることを確認

**期待結果**: 統計が正しく記録される

### Test 5: 複数ボーナスの累積

**手順**:
1. 「豪商」（全取引+2%）を達成
2. 「投資家」（全取引+2%）を達成
3. 合計+4%のボーナスが適用されることを確認

**期待結果**: ボーナスが累積される

## パフォーマンス

### 実績チェックの頻度

実績チェックは以下のタイミングで実行：
- 取引実行時
- 航海完了時
- 施設建設時
- UI更新時（頻度を抑える）

### 最適化

```javascript
// キャッシュを使った最適化
let cachedBonuses = null;
let lastCheckTime = 0;

export function getTotalBonuses() {
    const now = Date.now();

    // 1秒以内のキャッシュは再利用
    if (cachedBonuses && (now - lastCheckTime) < 1000) {
        return cachedBonuses;
    }

    // ボーナスを再計算
    cachedBonuses = calculateTotalBonuses();
    lastCheckTime = now;

    return cachedBonuses;
}
```

## まとめ

実績・称号システムは、プレイヤーに長期的な目標と達成感を提供する重要な機能です。財産ベースと行動ベースの実績をバランス良く配置することで、様々なプレイスタイルに対応し、ゲームの深みを増すことが期待されます。
