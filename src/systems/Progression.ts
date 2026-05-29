import { actors, items, quests } from "../data/content";
import { xpForNext } from "./GameState";
import type { GameState, HeroState, QuestState } from "./types";

export function itemCount(state: GameState, itemId: string): number {
  return state.inventory[itemId] ?? 0;
}

export function addItem(state: GameState, itemId: string, count = 1): void {
  state.inventory[itemId] = itemCount(state, itemId) + count;
}

export function removeItem(state: GameState, itemId: string, count = 1): boolean {
  if (itemCount(state, itemId) < count) return false;
  state.inventory[itemId] -= count;
  if (state.inventory[itemId] <= 0) delete state.inventory[itemId];
  return true;
}

export function acceptQuest(state: GameState, questId: string): QuestState {
  if (!state.quests[questId]) {
    state.quests[questId] = { id: questId, accepted: true, complete: false, step: 0 };
  }
  return state.quests[questId];
}

export function advanceQuest(state: GameState, questId: string): void {
  const quest = acceptQuest(state, questId);
  const maxStep = quests[questId].steps.length - 1;
  quest.step = Math.min(maxStep, quest.step + 1);
}

export function completeQuest(state: GameState, questId: string): string[] {
  const quest = acceptQuest(state, questId);
  if (quest.complete) return [];
  quest.complete = true;
  quest.step = quests[questId].steps.length - 1;
  state.gold += quests[questId].rewardGold;
  quests[questId].rewardItems.forEach((itemId) => addItem(state, itemId));
  return [`Quest complete: ${quests[questId].title}`, `Gained ${quests[questId].rewardGold} gold.`];
}

export function grantBattleRewards(state: GameState, xp: number, gold: number, loot: string[] = []): string[] {
  const log = [`Victory! Gained ${xp} XP and ${gold} gold.`];
  state.gold += gold;
  loot.forEach((itemId) => {
    addItem(state, itemId);
    log.push(`Found ${items[itemId].name}.`);
  });
  state.party.forEach((hero) => {
    hero.xp += xp;
    while (hero.xp >= xpForNext(hero.level)) {
      hero.xp -= xpForNext(hero.level);
      levelUp(hero);
      log.push(`${actors[hero.id].name} reached level ${hero.level}.`);
    }
  });
  return log;
}

function levelUp(hero: HeroState): void {
  hero.level += 1;
  hero.hp = maxHp(hero);
  hero.mp = maxMp(hero);
}

export function maxHp(hero: HeroState): number {
  const actor = actors[hero.id];
  return actor.maxHp + (hero.level - 1) * 10 + itemBonus(hero, "hp");
}

export function maxMp(hero: HeroState): number {
  const actor = actors[hero.id];
  return actor.maxMp + (hero.level - 1) * 4 + itemBonus(hero, "mp");
}

export function attack(hero: HeroState): number {
  const actor = actors[hero.id];
  return actor.attack + (hero.level - 1) * 3 + itemBonus(hero, "attack");
}

export function defense(hero: HeroState): number {
  const actor = actors[hero.id];
  return actor.defense + (hero.level - 1) * 2 + itemBonus(hero, "defense");
}

function itemBonus(hero: HeroState, stat: "hp" | "mp" | "attack" | "defense"): number {
  return Object.values(hero.equipment).reduce((total, itemId) => {
    if (!itemId) return total;
    return total + (items[itemId][stat] ?? 0);
  }, 0);
}

export function equipItem(hero: HeroState, itemId: string): string | undefined {
  const item = items[itemId];
  if (item.kind !== "weapon" && item.kind !== "armor" && item.kind !== "accessory") return undefined;
  const slot = item.kind;
  const previous = hero.equipment[slot];
  hero.equipment[slot] = itemId;
  hero.hp = Math.min(hero.hp, maxHp(hero));
  hero.mp = Math.min(hero.mp, maxMp(hero));
  return previous;
}

export function useConsumable(state: GameState, itemId: string, heroId: string): string {
  const item = items[itemId];
  const hero = state.party.find((entry) => entry.id === heroId);
  if (!hero || item.kind !== "consumable") return "Nothing happens.";
  if (!removeItem(state, itemId)) return `No ${item.name} left.`;
  hero.hp = Math.min(maxHp(hero), hero.hp + (item.hp ?? 0));
  hero.mp = Math.min(maxMp(hero), hero.mp + (item.mp ?? 0));
  return `${actors[hero.id].name} used ${item.name}.`;
}
