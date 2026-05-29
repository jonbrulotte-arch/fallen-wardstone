import type { ActorData, DialogueData, ItemData, MapData, QuestData, SkillData } from "../systems/types";

export const skills: Record<string, SkillData> = {
  shieldBash: { id: "shieldBash", name: "Shield Bash", mpCost: 3, power: 14, target: "enemy", effect: "damage", unlockLevel: 1 },
  guardVow: { id: "guardVow", name: "Guard Vow", mpCost: 4, power: 10, target: "ally", effect: "heal", unlockLevel: 2 },
  spark: { id: "spark", name: "Spark", mpCost: 4, power: 20, target: "enemy", effect: "damage", unlockLevel: 1 },
  wardFlame: { id: "wardFlame", name: "Ward Flame", mpCost: 7, power: 34, target: "enemy", effect: "damage", unlockLevel: 3 },
  quickShot: { id: "quickShot", name: "Quick Shot", mpCost: 3, power: 16, target: "enemy", effect: "damage", unlockLevel: 1 },
  poultice: { id: "poultice", name: "Field Poultice", mpCost: 5, power: 22, target: "ally", effect: "heal", unlockLevel: 2 }
};

export const actors: Record<string, ActorData> = {
  brann: { id: "brann", name: "Brann", role: "defender", maxHp: 64, maxMp: 16, attack: 11, defense: 8, speed: 5, skills: ["shieldBash", "guardVow"] },
  elia: { id: "elia", name: "Elia", role: "mage", maxHp: 42, maxMp: 28, attack: 8, defense: 4, speed: 7, skills: ["spark", "wardFlame"] },
  nyx: { id: "nyx", name: "Nyx", role: "scout", maxHp: 48, maxMp: 20, attack: 10, defense: 5, speed: 9, skills: ["quickShot", "poultice"] },
  slime: { id: "slime", name: "Mire Slime", role: "attacker", maxHp: 28, maxMp: 0, attack: 8, defense: 2, speed: 3, skills: [] },
  wisp: { id: "wisp", name: "Ash Wisp", role: "caster", maxHp: 24, maxMp: 12, attack: 9, defense: 1, speed: 8, skills: ["spark"] },
  sentry: { id: "sentry", name: "Ruin Sentry", role: "defender", maxHp: 52, maxMp: 0, attack: 12, defense: 7, speed: 4, skills: [] },
  boss: { id: "boss", name: "The Hollow Warden", role: "boss", maxHp: 142, maxMp: 30, attack: 16, defense: 7, speed: 6, skills: ["spark", "wardFlame"] }
};

export const items: Record<string, ItemData> = {
  herb: { id: "herb", name: "Sunleaf Herb", kind: "consumable", description: "Restores 30 HP.", hp: 30, price: 12 },
  ether: { id: "ether", name: "Moonwell Tonic", kind: "consumable", description: "Restores 12 MP.", mp: 12, price: 18 },
  ironSword: { id: "ironSword", name: "Iron Sword", kind: "weapon", description: "A sturdy village blade.", attack: 4, price: 45 },
  emberStaff: { id: "emberStaff", name: "Ember Staff", kind: "weapon", description: "Focuses wardfire.", attack: 3, mp: 5, price: 55 },
  scoutCloak: { id: "scoutCloak", name: "Scout Cloak", kind: "armor", description: "Light armor for quick feet.", defense: 3, price: 40 },
  wardShard: { id: "wardShard", name: "Wardstone Shard", kind: "key", description: "A warm fragment from the broken village relic." }
};

export const quests: Record<string, QuestData> = {
  main: {
    id: "main",
    title: "Restore the Wardstone",
    description: "Find the shard, reach the old shrine, and rekindle the village ward.",
    steps: ["Speak with Elder Rowan", "Recover the shard from the wilds", "Open the ruin gate", "Defeat the Hollow Warden"],
    rewardGold: 120,
    rewardItems: ["emberStaff"]
  },
  herbs: {
    id: "herbs",
    title: "Mara's Medicine",
    description: "Gather two Sunleaf Herbs for the village healer.",
    steps: ["Find two herbs", "Return to Mara"],
    rewardGold: 35,
    rewardItems: ["ether"]
  }
};

export const maps: Record<string, MapData> = {
  town: {
    id: "town",
    name: "Stonefall Village",
    theme: "town",
    bounds: { x: 0, y: 0, width: 960, height: 540 },
    start: { x: 480, y: 360 },
    exits: [{ id: "toWilds", label: "Wilds", x: 900, y: 250, w: 42, h: 120, toMap: "wilds", toX: 70, toY: 265 }],
    npcs: [
      { id: "elder", name: "Elder Rowan", x: 410, y: 160, dialogueId: "elder" },
      { id: "mara", name: "Mara", x: 210, y: 350, dialogueId: "mara" },
      { id: "shop", name: "Tovin", x: 705, y: 330, dialogueId: "shop", shop: ["herb", "ether", "ironSword", "scoutCloak"] }
    ],
    pickups: [],
    enemies: [],
    chests: []
  },
  wilds: {
    id: "wilds",
    name: "Briarwild Road",
    theme: "wilds",
    bounds: { x: 0, y: 0, width: 1200, height: 540 },
    start: { x: 70, y: 265 },
    exits: [
      { id: "toTown", label: "Town", x: 0, y: 210, w: 38, h: 125, toMap: "town", toX: 850, toY: 270 },
      { id: "toDungeon", label: "Ruins", x: 1148, y: 205, w: 44, h: 130, toMap: "dungeon", toX: 70, toY: 270, requiresQuestStep: 2 }
    ],
    npcs: [],
    pickups: [
      { id: "wildHerb1", itemId: "herb", x: 365, y: 150 },
      { id: "wildHerb2", itemId: "herb", x: 820, y: 385 },
      { id: "shard", itemId: "wardShard", x: 1010, y: 145, advancesQuest: "main" }
    ],
    enemies: [
      { id: "slimeA", actorIds: ["slime", "slime"], x: 340, y: 300, rewardXp: 20, rewardGold: 12 },
      { id: "wispA", actorIds: ["wisp"], x: 690, y: 180, rewardXp: 24, rewardGold: 16 }
    ],
    chests: [{ id: "wildChest", x: 560, y: 425, gold: 25, items: ["ether"] }]
  },
  dungeon: {
    id: "dungeon",
    name: "Wardroot Shrine",
    theme: "dungeon",
    bounds: { x: 0, y: 0, width: 1200, height: 540 },
    start: { x: 70, y: 270 },
    exits: [{ id: "toWilds", label: "Wilds", x: 0, y: 210, w: 38, h: 125, toMap: "wilds", toX: 1090, toY: 265 }],
    npcs: [],
    pickups: [],
    enemies: [
      { id: "sentryA", actorIds: ["sentry"], x: 380, y: 315, rewardXp: 38, rewardGold: 25 },
      { id: "wispB", actorIds: ["wisp", "sentry"], x: 710, y: 190, rewardXp: 54, rewardGold: 36 },
      { id: "boss", actorIds: ["boss"], x: 1050, y: 270, rewardXp: 120, rewardGold: 90, boss: true }
    ],
    chests: [{ id: "dungeonChest", x: 630, y: 410, gold: 45, items: ["ironSword", "herb"] }]
  }
};

export const dialogue: Record<string, DialogueData> = {
  elder: {
    id: "elder",
    lines: [
      "The wardstone has gone cold. Without it, the old road is waking up.",
      "Take this charge: find the missing shard, then carry it to the Wardroot Shrine."
    ],
    questId: "main"
  },
  mara: {
    id: "mara",
    lines: ["If you find Sunleaf in the wilds, bring me two. People are already hurt."],
    questId: "herbs",
    turnInItem: "herb",
    turnInCount: 2
  },
  shop: {
    id: "shop",
    lines: ["Keep your kit sharp. The road has teeth tonight."],
    shop: true
  }
};
