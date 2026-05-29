import { actors } from "../data/content";
import type { GameState, HeroState } from "./types";

const SAVE_KEY = "fallen-wardstone-save-v1";

function makeHero(id: string): HeroState {
  const actor = actors[id];
  return {
    id,
    level: 1,
    xp: 0,
    hp: actor.maxHp,
    mp: actor.maxMp,
    equipment: {}
  };
}

export function createNewGame(): GameState {
  return {
    mapId: "town",
    player: { x: 480, y: 360 },
    party: [makeHero("brann"), makeHero("elia"), makeHero("nyx")],
    inventory: { herb: 2, ether: 1 },
    gold: 55,
    quests: {},
    defeated: {},
    collected: {},
    openedChests: {},
    storyComplete: false,
    settings: {
      music: 0.45,
      sfx: 0.7,
      textSpeed: 1
    }
  };
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function xpForNext(level: number): number {
  return 50 + (level - 1) * 45;
}
