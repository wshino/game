# 実装タスク: 港への投資システムと実績システム

## タスクリスト

### Phase 1: データモデルと定数の定義

- [ ] **Task 1.1**: 投資・実績データ構造を定義
  - ファイル: `src/core/game-state.js`
  - 追加内容:
    - `portInvestments`: 各港の投資情報
    - `achievements`: 実績の達成状況
    - `statistics`: 統計情報（累計取引数、航海数など）

- [ ] **Task 1.2**: 施設と実績の定数を定義
  - ファイル: `src/core/constants.js`
  - 追加内容:
    - `FACILITIES`: 施設の種類と効果
    - `ACHIEVEMENTS`: 実績の定義
    - `TITLES`: 称号の定義

### Phase 2: 投資システムの実装

- [ ] **Task 2.1**: 投資サービスの作成
  - ファイル: `src/services/investment-service.js`（新規）
  - 関数:
    - `buildFacility(portId, facilityType)`: 施設を建設
    - `getFacilityLevel(portId, facilityType)`: 施設レベルを取得
    - `getPortReputation(portId)`: 港の名声レベルを取得
    - `canBuildFacility(portId, facilityType)`: 建設可能かチェック
    - `getFacilityBonus(portId, facilityType)`: 施設のボーナスを計算

- [ ] **Task 2.2**: 価格計算に投資ボーナスを適用
  - ファイル: `src/services/trade-service.js`
  - 変更箇所: `buyGood()`, `sellGood()` 関数
  - 追加内容: 商館のボーナスを価格に反映

- [ ] **Task 2.3**: 港在庫に投資ボーナスを適用
  - ファイル: `src/services/port-service.js`
  - 変更箇所: `getMaxStock()`, `getRefreshRate()` 関数
  - 追加内容: 市場拡張のボーナスを在庫に反映

### Phase 3: 実績システムの実装

- [ ] **Task 3.1**: 実績サービスの作成
  - ファイル: `src/services/achievement-service.js`（新規）
  - 関数:
    - `checkAchievements()`: 実績の達成状況をチェック
    - `unlockAchievement(achievementId)`: 実績を解除
    - `getCurrentTitle()`: 現在の称号を取得
    - `getTitleBonus()`: 称号ボーナスを取得
    - `updateStatistics(action, data)`: 統計情報を更新

- [ ] **Task 3.2**: 統計情報の収集
  - ファイル: `src/services/trade-service.js`, `src/services/voyage-service.js`
  - 変更箇所: 取引・航海の実行時
  - 追加内容: `updateStatistics()` の呼び出し

- [ ] **Task 3.3**: 実績チェックの統合
  - ファイル: `src/ui/ui-updater.js`
  - 変更箇所: `updateAll()` 関数
  - 追加内容: `checkAchievements()` の呼び出し

### Phase 4: UI の実装

- [ ] **Task 4.1**: 投資UIの作成
  - ファイル: `src/ui/investment-ui.js`（新規）
  - 関数:
    - `updatePortInvestmentPanel()`: 港情報パネルの更新
    - `showFacilityList()`: 建設可能施設の表示
    - `showBuildConfirmation()`: 建設確認ダイアログ

- [ ] **Task 4.2**: 実績UIの作成
  - ファイル: `src/ui/achievement-ui.js`（新規）
  - 関数:
    - `updateAchievementPanel()`: 実績パネルの更新
    - `showAchievementUnlocked()`: 実績解除アニメーション
    - `updateTitleDisplay()`: 称号の表示更新

- [ ] **Task 4.3**: HTMLの更新
  - ファイル: `index.html`
  - 追加内容:
    - 港投資パネル（施設一覧、建設ボタン）
    - 実績パネル（実績一覧、称号表示）
    - ステータスバーに称号表示

- [ ] **Task 4.4**: CSSの更新
  - ファイル: `style.css`
  - 追加内容:
    - 投資パネルのスタイル
    - 実績パネルのスタイル
    - 実績解除アニメーション

### Phase 5: セーブ/ロードの対応

- [ ] **Task 5.1**: セーブデータに投資・実績を追加
  - ファイル: `src/services/save-service.js`
  - 変更箇所: `save()`, `load()` 関数
  - 追加内容: `portInvestments`, `achievements`, `statistics` の保存・読み込み

- [ ] **Task 5.2**: 後方互換性の確保
  - ファイル: `src/services/save-service.js`
  - 変更箇所: `load()` 関数
  - 追加内容: 古いセーブデータに投資・実績情報を初期化

### Phase 6: オートパイロットとの統合

- [ ] **Task 6.1**: オートパイロットに投資効果を反映
  - ファイル: `src/services/autopilot-service.js`
  - 変更箇所: `calculateOptimalPurchaseForDestination()` 関数
  - 追加内容: 投資ボーナスを価格計算に含める（自動的に反映されるはず）

### Phase 7: テストと調整

- [ ] **Task 7.1**: 投資システムのテスト
  - 施設建設が正しく動作するか
  - ボーナスが正しく適用されるか
  - 名声レベルが正しく計算されるか

- [ ] **Task 7.2**: 実績システムのテスト
  - 実績が正しく解除されるか
  - 称号が正しく表示されるか
  - ボーナスが正しく適用されるか

- [ ] **Task 7.3**: バランス調整
  - 施設のコストとROIを確認
  - 実績の達成難易度を確認
  - 必要に応じて定数を調整

- [ ] **Task 7.4**: UIのテスト
  - パネルが正しく表示されるか
  - ボタンが正しく動作するか
  - アニメーションが適切か

## 実装の詳細

### Task 1.1: データ構造の定義

`src/core/game-state.js` に以下を追加：

```javascript
// 投資情報
portInvestments: {
    lisbon: {
        warehouse: 0,      // 倉庫レベル（0-3）
        tradingPost: 0,    // 商館レベル（0-2）
        shipyard: 0,       // 造船所（0-1）
        market: 0          // 市場拡張（0-2）
    },
    // ... 他の港も同様
},

// 実績
achievements: {
    worldTraveler: false,      // 世界一周
    spiceKing: false,          // 香辛料王
    tradeMaster: false,        // 貿易マスター
    investor: false,           // 投資家
    portRuler: false,          // 港の支配者
    // ... 他の実績
},

// 統計情報
statistics: {
    totalGoldEarned: 0,        // 累計獲得金額
    totalVoyages: 0,           // 累計航海数
    totalTrades: 0,            // 累計取引数
    goodsTraded: {             // 商品別の取引数
        spice: 0,
        wine: 0,
        // ... 他の商品
    },
    portsVisited: {            // 訪問した港
        lisbon: false,
        seville: false,
        // ... 他の港
    },
    maxGold: 0                 // 最高所持金
}
```

### Task 1.2: 定数の定義

`src/core/constants.js` に以下を追加：

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
    tradingPost: {
        name: '商館',
        icon: '🏛️',
        maxLevel: 2,
        costs: [10000, 20000],
        effects: [
            { priceBonus: 0.05 },  // 5%
            { priceBonus: 0.10 }   // 10%
        ],
        description: '取引価格が優遇される'
    },
    shipyard: {
        name: '造船所',
        icon: '⚓',
        maxLevel: 1,
        costs: [15000],
        effects: [
            { repairAvailable: true }
        ],
        description: '船の修理が可能（将来の拡張用）'
    },
    market: {
        name: '市場拡張',
        icon: '🏬',
        maxLevel: 2,
        costs: [8000, 16000],
        effects: [
            { stockBonus: 0.25 },  // 25%
            { stockBonus: 0.50 }   // 50%
        ],
        description: '港の在庫上限と回復速度が向上'
    }
};

// 名声レベル
export const REPUTATION_LEVELS = [
    { level: 0, name: '無名', minInvestment: 0 },
    { level: 1, name: '知人', minInvestment: 10000 },
    { level: 2, name: '友人', minInvestment: 30000 },
    { level: 3, name: '名士', minInvestment: 60000 },
    { level: 4, name: '支配者', minInvestment: 100000 }
];

// 実績の定義
export const ACHIEVEMENTS = {
    // 財産ベース
    apprentice: {
        id: 'apprentice',
        name: '見習い商人',
        description: '冒険の始まり',
        condition: { type: 'gold', value: 0 },
        bonus: null
    },
    merchant: {
        id: 'merchant',
        name: '商人',
        description: '10,000Gを達成',
        condition: { type: 'gold', value: 10000 },
        bonus: null
    },
    greatMerchant: {
        id: 'greatMerchant',
        name: '大商人',
        description: '50,000Gを達成',
        condition: { type: 'gold', value: 50000 },
        bonus: null
    },
    wealthyMerchant: {
        id: 'wealthyMerchant',
        name: '豪商',
        description: '100,000Gを達成',
        condition: { type: 'gold', value: 100000 },
        bonus: { type: 'allPrices', value: 0.02 }  // 全取引+2%
    },
    tradeKing: {
        id: 'tradeKing',
        name: '貿易王',
        description: '500,000Gを達成',
        condition: { type: 'gold', value: 500000 },
        bonus: { type: 'allPrices', value: 0.05 }  // 全取引+5%
    },
    seaLord: {
        id: 'seaLord',
        name: '海洋覇者',
        description: '1,000,000Gを達成',
        condition: { type: 'gold', value: 1000000 },
        bonus: { type: 'allPrices', value: 0.10 }  // 全取引+10%
    },

    // 行動ベース
    worldTraveler: {
        id: 'worldTraveler',
        name: '世界一周',
        description: '全7港を訪問',
        condition: { type: 'portsVisited', value: 7 },
        bonus: { type: 'goldReward', value: 1000 }
    },
    spiceKing: {
        id: 'spiceKing',
        name: '香辛料王',
        description: '香辛料を累計500個取引',
        condition: { type: 'goodTraded', good: 'spice', value: 500 },
        bonus: { type: 'goodPrice', good: 'spice', value: 0.03 }  // 香辛料+3%
    },
    tradeMaster: {
        id: 'tradeMaster',
        name: '貿易マスター',
        description: '累計100回の航海',
        condition: { type: 'voyages', value: 100 },
        bonus: { type: 'supplyCost', value: -0.10 }  // 補給費用-10%
    },
    investor: {
        id: 'investor',
        name: '投資家',
        description: '全港に少なくとも1つの施設を建設',
        condition: { type: 'facilitiesInAllPorts', value: 1 },
        bonus: { type: 'allPrices', value: 0.02 }  // 全港+2%
    },
    portRuler: {
        id: 'portRuler',
        name: '港の支配者',
        description: '1つの港で名声レベル最大',
        condition: { type: 'maxReputationInOnePort', value: 4 },
        bonus: { type: 'specialBonus', description: 'その港で特別ボーナス' }
    }
};
```

### Task 2.1: 投資サービスの実装

`src/services/investment-service.js`:

```javascript
import { gameState } from '../core/game-state.js';
import { FACILITIES, REPUTATION_LEVELS, ports } from '../core/constants.js';
import { addLog } from '../utils/logger.js';

/**
 * 施設を建設する
 */
export function buildFacility(portId, facilityType) {
    const facility = FACILITIES[facilityType];
    const currentLevel = gameState.portInvestments[portId][facilityType];

    // 建設可能かチェック
    if (!canBuildFacility(portId, facilityType)) {
        return false;
    }

    const cost = facility.costs[currentLevel];

    // 資金を消費
    gameState.gold -= cost;

    // レベルアップ
    gameState.portInvestments[portId][facilityType] += 1;

    // ログ
    addLog(`${ports[portId].name}に${facility.name}レベル${currentLevel + 1}を建設しました（${cost}G）`);

    return true;
}

/**
 * 施設レベルを取得
 */
export function getFacilityLevel(portId, facilityType) {
    return gameState.portInvestments[portId][facilityType] || 0;
}

/**
 * 施設建設が可能かチェック
 */
export function canBuildFacility(portId, facilityType) {
    const facility = FACILITIES[facilityType];
    const currentLevel = getFacilityLevel(portId, facilityType);

    // 最大レベルに達している
    if (currentLevel >= facility.maxLevel) {
        return false;
    }

    const cost = facility.costs[currentLevel];

    // 資金が足りない
    if (gameState.gold < cost) {
        return false;
    }

    return true;
}

/**
 * 港の総投資額を計算
 */
export function getTotalInvestment(portId) {
    let total = 0;
    const investments = gameState.portInvestments[portId];

    for (const facilityType in investments) {
        const level = investments[facilityType];
        const facility = FACILITIES[facilityType];

        for (let i = 0; i < level; i++) {
            total += facility.costs[i];
        }
    }

    return total;
}

/**
 * 港の名声レベルを取得
 */
export function getPortReputation(portId) {
    const totalInvestment = getTotalInvestment(portId);

    for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
        if (totalInvestment >= REPUTATION_LEVELS[i].minInvestment) {
            return REPUTATION_LEVELS[i];
        }
    }

    return REPUTATION_LEVELS[0];
}

/**
 * 施設のボーナスを取得
 */
export function getFacilityBonus(portId, facilityType, bonusType) {
    const level = getFacilityLevel(portId, facilityType);

    if (level === 0) {
        return 0;
    }

    const facility = FACILITIES[facilityType];
    const effect = facility.effects[level - 1];

    return effect[bonusType] || 0;
}
```

### Task 2.2: 価格計算への適用

`src/services/trade-service.js` の `buyGood()` と `sellGood()` を修正：

```javascript
import { getFacilityBonus } from './investment-service.js';

// buyGood() 内で価格を計算する部分
const basePrice = calculatePrice(goodId, gameState.currentPort);
const tradingPostBonus = getFacilityBonus(gameState.currentPort, 'tradingPost', 'priceBonus');
const finalPrice = Math.round(basePrice * (1 - tradingPostBonus)); // 購入時は割引

// sellGood() 内で価格を計算する部分
const basePrice = calculateSellPrice(goodId, gameState.currentPort);
const tradingPostBonus = getFacilityBonus(gameState.currentPort, 'tradingPost', 'priceBonus');
const finalPrice = Math.round(basePrice * (1 + tradingPostBonus)); // 売却時はボーナス
```

## 成功基準

1. **データの整合性**: 投資・実績データが正しく保存・読み込みされる
2. **機能性**: 全ての施設と実績が正しく動作する
3. **UIの完成度**: パネルが見やすく、操作しやすい
4. **バランス**: 投資のROIが適切（10-20回の取引で回収可能）
5. **パフォーマンス**: 動作が重くならない
6. **後方互換性**: 既存のセーブデータが正しく動作する

## 備考

- 実装は段階的に行い、各Phaseでテストする
- バランス調整は実装後にプレイテストを通じて行う
- UIデザインはシンプルで分かりやすくする
