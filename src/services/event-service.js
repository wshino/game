import { gameState } from '../core/game-state.js';
import { RANDOM_EVENTS, TREASURES, RARITY_CONFIG, goods, GAME_BALANCE } from '../core/constants.js';
import { addLog } from '../utils/logger.js';

// UI callback functions
let updateAll;
let saveGame;

// Set UI callback functions (call this from main game initialization)
export function setEventUICallbacks(updateAllFn, saveGameFn) {
    updateAll = updateAllFn;
    saveGame = saveGameFn;
}

// Check if a random event should occur during voyage
export function checkForRandomEvent(daysElapsed) {
    // Validate input
    if (typeof daysElapsed !== 'number' || daysElapsed < 0) {
        return null;
    }

    // Only trigger event once per voyage day, with some randomness
    if (Math.random() > GAME_BALANCE.EVENT_BASE_PROBABILITY) return null;

    // Calculate luck modifier from treasures
    const luckMod = gameState.activeEffects.luckBonus || 0;

    // Select a random event based on probabilities
    const events = Object.values(RANDOM_EVENTS);
    let rand = Math.random();

    for (const event of events) {
        let probability = event.probability;

        // Modify probability based on active effects
        if (event.id === 'pirate') {
            probability *= (1 - (gameState.activeEffects.pirateProtection || 0));
        }

        if (rand < probability) {
            return { ...event };
        }
        rand -= probability;
    }

    return null;
}

// Process player's choice for an event
export function processEventChoice(eventId, choiceId) {
    const event = RANDOM_EVENTS[eventId];
    if (!event) return { success: false, message: 'Unknown event' };

    const result = {
        success: true,
        messages: [],
        goldChange: 0,
        durabilityChange: 0,
        treasureGained: null,
        cargoLost: {}
    };

    // Update statistics
    gameState.statistics.eventsEncountered++;

    switch (eventId) {
        case 'pirate':
            return processPirateEvent(choiceId, result);
        case 'castaway':
            return processCastawayEvent(choiceId, result);
        case 'shipwreck':
            return processShipwreckEvent(choiceId, result);
        case 'mysteriousMerchant':
            return processMysteriousMerchantEvent(choiceId, result);
        case 'cargoLoss':
            return processCargoLossEvent(choiceId, result);
        case 'mermaidBlessing':
            return processMermaidEvent(choiceId, result);
        case 'ghostShip':
            return processGhostShipEvent(choiceId, result);
        case 'festival':
            return processFestivalEvent(choiceId, result);
        default:
            return result;
    }
}

// Pirate encounter processing
function processPirateEvent(choiceId, result) {
    switch (choiceId) {
        case 'fight': {
            // Check for phoenix feather
            const hasPhoenixFeather = (gameState.treasures.phoenixFeather || 0) > 0;

            // Combat calculation using balanced constants
            const playerPower = gameState.ship.combatPower + (Math.random() * GAME_BALANCE.COMBAT_PLAYER_RANDOM_FACTOR);
            const piratePower = GAME_BALANCE.COMBAT_PIRATE_BASE_POWER + (Math.random() * GAME_BALANCE.COMBAT_PIRATE_RANDOM_FACTOR);
            const luckMod = gameState.activeEffects.luckBonus || 0;

            const win = hasPhoenixFeather || (playerPower + luckMod * 10) > piratePower;

            if (hasPhoenixFeather && !((playerPower + luckMod * 10) > piratePower)) {
                gameState.treasures.phoenixFeather--;
                result.messages.push('🪶 不死鳥の羽が輝き、勝利を確定させた！');
            }

            if (win) {
                // Victory - gain gold and maybe treasure
                const goldReward = Math.floor(500 + Math.random() * 1500);
                result.goldChange = goldReward;
                gameState.gold += goldReward;
                gameState.statistics.piratesDefeated++;
                result.messages.push(`⚔️ 海賊を撃退した！${goldReward}Gを獲得！`);

                // 30% chance to get a treasure
                if (Math.random() < 0.3) {
                    const treasure = getRandomTreasure();
                    if (treasure) {
                        addTreasure(treasure.id);
                        result.treasureGained = treasure;
                        result.messages.push(`✨ ${treasure.emoji} ${treasure.name}を発見！`);
                    }
                }

                // Take some damage
                const damage = Math.floor(10 + Math.random() * 20);
                applyDurabilityDamage(damage);
                result.durabilityChange = -damage;
                result.messages.push(`🔧 船の耐久度が${damage}低下`);
            } else {
                // Defeat - lose gold and cargo
                const goldLoss = Math.floor(gameState.gold * (0.2 + Math.random() * 0.2));
                result.goldChange = -goldLoss;
                gameState.gold -= goldLoss;
                result.messages.push(`😱 海賊に敗北...${goldLoss}Gを奪われた！`);

                // Lose some cargo
                result.cargoLost = loseRandomCargo(0.3);
                if (Object.keys(result.cargoLost).length > 0) {
                    result.messages.push('📦 一部の積荷を奪われた...');
                }

                // Take heavy damage
                const damage = Math.floor(30 + Math.random() * 30);
                applyDurabilityDamage(damage);
                result.durabilityChange = -damage;
                result.messages.push(`🔧 船の耐久度が${damage}低下`);
            }
            break;
        }
        case 'flee': {
            // Escape chance based on ship speed
            const escapeChance = 0.3 + (gameState.ship.speed * 0.2) + (gameState.ship.speedBonus * 0.5);

            if (Math.random() < escapeChance) {
                result.messages.push('🏃 逃走に成功！');
            } else {
                // Failed to escape - forced to pay more
                const goldLoss = Math.floor(gameState.gold * (0.15 + Math.random() * 0.15));
                result.goldChange = -goldLoss;
                gameState.gold = Math.max(0, gameState.gold - goldLoss);
                result.messages.push(`❌ 逃げられなかった...${goldLoss}Gを奪われた！`);

                const damage = Math.floor(10 + Math.random() * 15);
                applyDurabilityDamage(damage);
                result.durabilityChange = -damage;
            }
            break;
        }
        case 'pay': {
            const payment = Math.floor(gameState.gold * (0.1 + Math.random() * 0.1));
            result.goldChange = -payment;
            gameState.gold = Math.max(0, gameState.gold - payment);
            result.messages.push(`💰 ${payment}Gを支払って見逃してもらった`);
            break;
        }
    }
    return result;
}

// Castaway event processing
function processCastawayEvent(choiceId, result) {
    if (choiceId === 'rescue') {
        gameState.statistics.castawaysRescued++;
        const rand = Math.random();

        if (rand < 0.5) {
            // Gold reward
            const reward = Math.floor(200 + Math.random() * 800);
            result.goldChange = reward;
            gameState.gold += reward;
            result.messages.push(`🙏 漂流者を救助した！感謝として${reward}Gを受け取った`);
        } else if (rand < 0.8) {
            // Treasure reward
            const treasure = getRandomTreasure('uncommon');
            if (treasure) {
                addTreasure(treasure.id);
                result.treasureGained = treasure;
                result.messages.push(`🙏 漂流者は実は商人だった！`);
                result.messages.push(`✨ ${treasure.emoji} ${treasure.name}をもらった！`);
            }
        } else {
            // Information about treasure
            result.messages.push('🙏 漂流者を救助した！');
            result.messages.push('💡 「お礼に秘密を教えよう...次の沈没船には宝があるぞ」');
            gameState.activeEffects.luckBonus = Math.min(0.3, (gameState.activeEffects.luckBonus || 0) + 0.1);
        }
    } else {
        result.messages.push('👀 漂流者を見て見ぬふりをした...');
        // Small luck penalty
        gameState.activeEffects.luckBonus = Math.max(-0.1, (gameState.activeEffects.luckBonus || 0) - 0.05);
    }
    return result;
}

// Shipwreck event processing
function processShipwreckEvent(choiceId, result) {
    if (choiceId === 'explore') {
        const rand = Math.random() + (gameState.activeEffects.luckBonus || 0);

        if (rand < 0.2) {
            // Danger! Ship damage
            const damage = Math.floor(20 + Math.random() * 30);
            applyDurabilityDamage(damage);
            result.durabilityChange = -damage;
            result.messages.push('💥 探索中に船体が損傷した！');
            result.messages.push(`🔧 耐久度が${damage}低下`);
        } else if (rand < 0.5) {
            // Found gold
            const goldFound = Math.floor(500 + Math.random() * 2000);
            result.goldChange = goldFound;
            gameState.gold += goldFound;
            result.messages.push(`💰 沈没船から${goldFound}Gを発見！`);
        } else {
            // Found treasure!
            const treasure = getRandomTreasure();
            gameState.statistics.treasuresFound++;
            if (treasure) {
                addTreasure(treasure.id);
                result.treasureGained = treasure;
                result.messages.push('🎉 沈没船からお宝を発見！');
                result.messages.push(`✨ ${treasure.emoji} ${treasure.name}を入手！`);
            }
        }
    } else {
        result.messages.push('➡️ 安全を優先して通り過ぎた');
    }
    return result;
}

// Mysterious merchant event processing
function processMysteriousMerchantEvent(choiceId, result) {
    if (choiceId === 'trade') {
        const cost = Math.floor(500 + Math.random() * 500);

        if (gameState.gold >= cost) {
            gameState.gold -= cost;
            result.goldChange = -cost;

            const rand = Math.random() + (gameState.activeEffects.luckBonus || 0);

            if (rand < 0.2) {
                // Bad deal - cursed item
                addTreasure('cursedIdol');
                result.treasureGained = TREASURES.cursedIdol;
                result.messages.push(`💀 ${cost}Gで謎のアイテムを購入...`);
                result.messages.push('⚠️ これは呪いの偶像だ！');
            } else {
                // Good deal - random treasure
                const treasure = getRandomTreasure('rare');
                if (treasure) {
                    addTreasure(treasure.id);
                    result.treasureGained = treasure;
                    result.messages.push(`🤝 ${cost}Gで取引成立！`);
                    result.messages.push(`✨ ${treasure.emoji} ${treasure.name}を入手！`);
                }
            }
        } else {
            result.messages.push('💸 資金が足りない...');
        }
    } else {
        result.messages.push('✋ 怪しいので取引を断った');
    }
    return result;
}

// Cargo loss event processing
function processCargoLossEvent(choiceId, result) {
    result.cargoLost = loseRandomCargo(0.2);

    if (Object.keys(result.cargoLost).length > 0) {
        result.messages.push('🌊 激しい嵐で積荷が海に流された！');
        for (const [goodId, qty] of Object.entries(result.cargoLost)) {
            const good = goods[goodId];
            if (good) {
                result.messages.push(`📦 ${good.emoji} ${good.name} ${qty}個を失った`);
            }
        }
    } else {
        result.messages.push('🌊 激しい嵐だったが、積荷は無事だった');
    }

    // Ship damage from storm
    const damage = Math.floor(5 + Math.random() * 15);
    applyDurabilityDamage(damage);
    result.durabilityChange = -damage;
    result.messages.push(`🔧 嵐で船の耐久度が${damage}低下`);

    return result;
}

// Mermaid blessing event processing
function processMermaidEvent(choiceId, result) {
    if (choiceId === 'listen') {
        const rand = Math.random() + (gameState.activeEffects.luckBonus || 0);

        if (rand < 0.2) {
            // Trap! (very rare)
            result.messages.push('🧜‍♀️ 人魚の歌に魅了されて時を忘れてしまった...');
            result.messages.push('⏰ 航海が1日遅れた');
            // This would need to be handled in voyage-service
        } else if (rand < 0.6) {
            // Minor blessing
            const goldBonus = Math.floor(100 + Math.random() * 400);
            result.goldChange = goldBonus;
            gameState.gold += goldBonus;
            result.messages.push('🧜‍♀️ 人魚が海の宝を贈ってくれた！');
            result.messages.push(`💰 ${goldBonus}Gを獲得`);
        } else {
            // Major blessing - heal ship or give treasure
            if (gameState.ship.durability < gameState.ship.maxDurability * 0.8) {
                const heal = Math.floor(gameState.ship.maxDurability * 0.3);
                gameState.ship.durability = Math.min(
                    gameState.ship.maxDurability,
                    gameState.ship.durability + heal
                );
                result.durabilityChange = heal;
                result.messages.push('🧜‍♀️ 人魚の魔法で船が修復された！');
                result.messages.push(`🔧 耐久度が${heal}回復`);
            } else {
                const treasure = getRandomTreasure('rare');
                if (treasure) {
                    addTreasure(treasure.id);
                    result.treasureGained = treasure;
                    result.messages.push('🧜‍♀️ 人魚が特別な贈り物をくれた！');
                    result.messages.push(`✨ ${treasure.emoji} ${treasure.name}を入手！`);
                }
            }
        }
    } else {
        result.messages.push('🙈 人魚の歌を無視して航海を続けた');
        result.messages.push('💡 賢明な判断だったかもしれない...');
    }
    return result;
}

// Ghost ship event processing
function processGhostShipEvent(choiceId, result) {
    if (choiceId === 'board') {
        const rand = Math.random() + (gameState.activeEffects.luckBonus || 0);

        if (rand < 0.3) {
            // Cursed!
            const damage = Math.floor(20 + Math.random() * 20);
            applyDurabilityDamage(damage);
            result.durabilityChange = -damage;
            result.messages.push('👻 幽霊の呪いを受けた！');
            result.messages.push(`🔧 船の耐久度が${damage}低下`);

            // Small chance to get cursed idol
            if (Math.random() < 0.3) {
                addTreasure('cursedIdol');
                result.treasureGained = TREASURES.cursedIdol;
                result.messages.push('🗿 呪いの偶像を見つけてしまった...');
            }
        } else {
            // Found treasure!
            const treasure = getRandomTreasure('legendary');
            gameState.statistics.treasuresFound++;
            if (treasure) {
                addTreasure(treasure.id);
                result.treasureGained = treasure;
                result.messages.push('👻 幽霊船には古代の財宝があった！');
                result.messages.push(`✨ ${treasure.emoji} ${treasure.name}を発見！`);
            }

            // Also find gold
            const goldFound = Math.floor(1000 + Math.random() * 3000);
            result.goldChange = goldFound;
            gameState.gold += goldFound;
            result.messages.push(`💰 さらに${goldFound}Gも発見！`);
        }
    } else {
        result.messages.push('🏃 幽霊船から逃げ出した');
        result.messages.push('💨 賢明な判断だったかもしれない...');
    }
    return result;
}

// Festival event processing (at port arrival)
function processFestivalEvent(choiceId, result) {
    if (choiceId === 'join') {
        const rand = Math.random();

        if (rand < 0.4) {
            // Trading bonus for this port
            gameState.activeEffects.bonusGoldNextTrade = 0.15;
            result.messages.push('🎉 祭りに参加した！');
            result.messages.push('💰 商人たちと仲良くなり、次の取引が15%お得に！');
        } else if (rand < 0.7) {
            // Find gold
            const goldBonus = Math.floor(200 + Math.random() * 500);
            result.goldChange = goldBonus;
            gameState.gold += goldBonus;
            result.messages.push('🎉 祭りの賞金を獲得！');
            result.messages.push(`💰 ${goldBonus}Gを獲得！`);
        } else {
            // Win a prize
            const treasure = getRandomTreasure('uncommon');
            if (treasure) {
                addTreasure(treasure.id);
                result.treasureGained = treasure;
                result.messages.push('🎉 祭りの大会で優勝！');
                result.messages.push(`✨ ${treasure.emoji} ${treasure.name}を賞品として獲得！`);
            }
        }
    } else {
        result.messages.push('⏭️ 祭りを素通りして通常の取引に向かった');
    }
    return result;
}

// Get a random treasure based on rarity
export function getRandomTreasure(minRarity = null) {
    const treasures = Object.values(TREASURES);
    const rarityOrder = ['common', 'uncommon', 'rare', 'legendary'];
    const minRarityIndex = minRarity ? rarityOrder.indexOf(minRarity) : 0;

    // Calculate total weight for valid treasures
    let totalWeight = 0;
    const validTreasures = treasures.filter(t => {
        const rarityIndex = rarityOrder.indexOf(t.rarity);
        return rarityIndex >= minRarityIndex;
    });

    for (const treasure of validTreasures) {
        totalWeight += RARITY_CONFIG[treasure.rarity].dropWeight;
    }

    // Select random treasure
    let rand = Math.random() * totalWeight;
    for (const treasure of validTreasures) {
        rand -= RARITY_CONFIG[treasure.rarity].dropWeight;
        if (rand <= 0) {
            return treasure;
        }
    }

    return validTreasures[0];
}

// Add treasure to inventory
export function addTreasure(treasureId) {
    if (!gameState.treasures[treasureId]) {
        gameState.treasures[treasureId] = 0;
    }
    gameState.treasures[treasureId]++;
    gameState.statistics.treasuresFound++;

    // Apply passive effects
    const treasure = TREASURES[treasureId];
    if (treasure && !treasure.usable) {
        applyPassiveTreasureEffect(treasure);
    }

    addLog(`✨ ${treasure.emoji} ${treasure.name}を入手！`);
}

// Apply passive treasure effects
function applyPassiveTreasureEffect(treasure) {
    switch (treasure.effect.type) {
        case 'luck_bonus':
            gameState.activeEffects.luckBonus = Math.min(GAME_BALANCE.EVENT_LUCK_MAX_BONUS,
                (gameState.activeEffects.luckBonus || 0) + treasure.effect.value);
            break;
        case 'pirate_protection':
            gameState.activeEffects.pirateProtection = Math.min(0.8,
                (gameState.activeEffects.pirateProtection || 0) + treasure.effect.value);
            break;
        case 'trade_bonus':
            gameState.activeEffects.tradeBonus = Math.min(0.2,
                (gameState.activeEffects.tradeBonus || 0) + treasure.effect.value);
            break;
    }
}

// Use a treasure item
export function useTreasure(treasureId) {
    if (!gameState.treasures[treasureId] || gameState.treasures[treasureId] <= 0) {
        return { success: false, message: 'このアイテムを持っていない' };
    }

    const treasure = TREASURES[treasureId];
    if (!treasure.usable) {
        return { success: false, message: 'このアイテムは使用できない（パッシブ効果）' };
    }

    const result = { success: true, messages: [] };

    switch (treasure.effect.type) {
        case 'bonus_gold_next_trade':
            gameState.activeEffects.bonusGoldNextTrade = treasure.effect.value;
            result.messages.push(`📜 次の取引で${Math.round(treasure.effect.value * 100)}%ボーナス！`);
            break;
        case 'permanent_speed_bonus':
            gameState.ship.speedBonus += treasure.effect.value;
            result.messages.push(`🧭 航海速度が永続的に${Math.round(treasure.effect.value * 100)}%向上！`);
            break;
        case 'full_repair':
            gameState.ship.durability = gameState.ship.maxDurability;
            result.messages.push('💧 船の耐久度が完全に回復！');
            break;
        case 'guaranteed_victory':
            // This is handled in pirate combat
            result.messages.push('🪶 次の海賊戦で必ず勝利する効果を付与！');
            break;
        case 'sell_value':
            gameState.gold += treasure.effect.value;
            result.messages.push(`💰 ${treasure.effect.value}Gを獲得！`);
            break;
        case 'cursed':
            // Random bad effect
            const damage = Math.floor(30 + Math.random() * 30);
            applyDurabilityDamage(damage);
            const goldLoss = Math.floor(gameState.gold * 0.1);
            gameState.gold = Math.max(0, gameState.gold - goldLoss);
            result.messages.push('🗿 呪いが解放された！');
            result.messages.push(`💀 船の耐久度-${damage}、${goldLoss}Gを失った`);
            // But also chance for big reward
            if (Math.random() < 0.3) {
                const bonusGold = Math.floor(5000 + Math.random() * 10000);
                gameState.gold += bonusGold;
                result.messages.push(`✨ しかし呪いの中から${bonusGold}Gが現れた！`);
            }
            break;
        default:
            return { success: false, message: '不明な効果' };
    }

    gameState.treasures[treasureId]--;
    if (gameState.treasures[treasureId] <= 0) {
        delete gameState.treasures[treasureId];
    }

    if (saveGame) saveGame();
    return result;
}

// Apply durability damage to ship
export function applyDurabilityDamage(amount) {
    gameState.ship.durability = Math.max(0, gameState.ship.durability - amount);

    // Speed penalty when low durability
    if (gameState.ship.durability < gameState.ship.maxDurability * 0.3) {
        addLog('⚠️ 船の耐久度が危険な状態！速度が低下しています');
    }
}

// Repair ship at port (requires shipyard)
export function repairShip(portId) {
    const investment = gameState.portInvestments[portId];
    if (!investment || investment.shipyard < 1) {
        return { success: false, message: 'この港に造船所がありません' };
    }

    const damageAmount = gameState.ship.maxDurability - gameState.ship.durability;
    if (damageAmount <= 0) {
        return { success: false, message: '船は既に完全な状態です' };
    }

    // Repair cost: 5G per durability point
    const repairCost = damageAmount * 5;
    if (gameState.gold < repairCost) {
        return { success: false, message: `修理費用が足りません（必要: ${repairCost}G）` };
    }

    gameState.gold -= repairCost;
    gameState.ship.durability = gameState.ship.maxDurability;

    addLog(`🔧 船を修理しました（${repairCost}G）`);
    if (saveGame) saveGame();
    if (updateAll) updateAll();

    return { success: true, message: `船を修理しました（${repairCost}G）` };
}

// Get effective ship speed (considering durability)
export function getEffectiveSpeed() {
    let speed = gameState.ship.speed + gameState.ship.speedBonus;

    // Speed penalty for low durability using balanced constants
    const durabilityRatio = gameState.ship.durability / gameState.ship.maxDurability;
    if (durabilityRatio < GAME_BALANCE.DURABILITY_CRITICAL_THRESHOLD) {
        speed *= GAME_BALANCE.DURABILITY_SPEED_CRITICAL_MODIFIER; // 50% speed when critically damaged
    } else if (durabilityRatio < GAME_BALANCE.DURABILITY_DAMAGED_THRESHOLD) {
        speed *= GAME_BALANCE.DURABILITY_SPEED_DAMAGED_MODIFIER; // 75% speed when damaged
    }

    return speed;
}

// Lose random cargo
function loseRandomCargo(percentage) {
    const lost = {};

    for (const [goodId, qty] of Object.entries(gameState.inventory)) {
        if (qty > 0 && goodId !== 'food' && goodId !== 'water') {
            const lossAmount = Math.floor(qty * percentage * (0.5 + Math.random() * 0.5));
            if (lossAmount > 0) {
                lost[goodId] = lossAmount;
                gameState.inventory[goodId] -= lossAmount;
                if (gameState.inventory[goodId] <= 0) {
                    delete gameState.inventory[goodId];
                }
            }
        }
    }

    return lost;
}

// Show event modal
export function showEventModal(event, onChoice) {
    // Remove any existing modal
    const existingModal = document.getElementById('event-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'event-modal';
    modal.className = 'event-modal';

    const choicesHTML = event.choices.map(choice => `
        <button class="event-choice-btn" data-choice="${choice.id}">
            <span class="choice-text">${choice.text}</span>
            <span class="choice-desc">${choice.description}</span>
        </button>
    `).join('');

    modal.innerHTML = `
        <div class="event-content">
            <div class="event-header">
                <span class="event-emoji">${event.emoji}</span>
                <h2>${event.name}</h2>
            </div>
            <p class="event-description">${event.description}</p>
            <div class="event-choices">
                ${choicesHTML}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add click handlers
    modal.querySelectorAll('.event-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const choiceId = btn.dataset.choice;
            modal.remove();
            if (onChoice) onChoice(choiceId);
        });
    });
}

// Show event result modal
export function showEventResultModal(result, onClose) {
    const modal = document.createElement('div');
    modal.id = 'event-result-modal';
    modal.className = 'event-modal';

    const messagesHTML = result.messages.map(msg => `<p>${msg}</p>`).join('');

    let summaryHTML = '';
    if (result.goldChange !== 0) {
        const sign = result.goldChange > 0 ? '+' : '';
        const color = result.goldChange > 0 ? '#4caf50' : '#f44336';
        summaryHTML += `<div style="color: ${color}">💰 ${sign}${result.goldChange}G</div>`;
    }
    if (result.durabilityChange !== 0) {
        const sign = result.durabilityChange > 0 ? '+' : '';
        const color = result.durabilityChange > 0 ? '#4caf50' : '#f44336';
        summaryHTML += `<div style="color: ${color}">🔧 耐久度 ${sign}${result.durabilityChange}</div>`;
    }
    if (result.treasureGained) {
        summaryHTML += `<div style="color: #ff9800">✨ ${result.treasureGained.emoji} ${result.treasureGained.name}</div>`;
    }

    modal.innerHTML = `
        <div class="event-content">
            <div class="event-result-messages">
                ${messagesHTML}
            </div>
            ${summaryHTML ? `<div class="event-summary">${summaryHTML}</div>` : ''}
            <button class="event-close-btn" onclick="this.closest('.event-modal').remove()">
                続ける
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.event-close-btn').addEventListener('click', () => {
        modal.remove();
        if (onClose) onClose();
    });
}

// CommonJS support for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setEventUICallbacks,
        checkForRandomEvent,
        processEventChoice,
        getRandomTreasure,
        addTreasure,
        useTreasure,
        applyDurabilityDamage,
        repairShip,
        getEffectiveSpeed,
        showEventModal,
        showEventResultModal
    };
}
