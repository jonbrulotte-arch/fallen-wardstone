export type Vec2 = { x: number; y: number };

export type HeroRole = "defender" | "mage" | "scout";
export type EnemyRole = "attacker" | "caster" | "defender" | "boss";

export type ActorData = {
  id: string;
  name: string;
  role: HeroRole | EnemyRole;
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  skills: string[];
};

export type SkillData = {
  id: string;
  name: string;
  mpCost: number;
  power: number;
  target: "enemy" | "ally";
  effect: "damage" | "heal";
  unlockLevel: number;
};

export type ItemData = {
  id: string;
  name: string;
  kind: "consumable" | "weapon" | "armor" | "accessory" | "key";
  description: string;
  hp?: number;
  mp?: number;
  attack?: number;
  defense?: number;
  price?: number;
};

export type QuestData = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  rewardGold: number;
  rewardItems: string[];
};

export type DialogueData = {
  id: string;
  lines: string[];
  questId?: string;
  turnInItem?: string;
  turnInCount?: number;
  shop?: boolean;
};

export type MapData = {
  id: string;
  name: string;
  theme: "town" | "wilds" | "dungeon";
  bounds: { x: number; y: number; width: number; height: number };
  start: Vec2;
  exits: MapExit[];
  npcs: NpcData[];
  pickups: PickupData[];
  enemies: EncounterData[];
  chests: ChestData[];
};

export type MapExit = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  toMap: string;
  toX: number;
  toY: number;
  requiresQuestStep?: number;
};

export type NpcData = {
  id: string;
  name: string;
  x: number;
  y: number;
  dialogueId: string;
  shop?: string[];
};

export type PickupData = {
  id: string;
  itemId: string;
  x: number;
  y: number;
  advancesQuest?: string;
};

export type EncounterData = {
  id: string;
  actorIds: string[];
  x: number;
  y: number;
  rewardXp: number;
  rewardGold: number;
  boss?: boolean;
};

export type ChestData = {
  id: string;
  x: number;
  y: number;
  gold: number;
  items: string[];
};

export type HeroState = {
  id: string;
  level: number;
  xp: number;
  hp: number;
  mp: number;
  equipment: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
};

export type QuestState = {
  id: string;
  accepted: boolean;
  complete: boolean;
  step: number;
};

export type GameState = {
  mapId: string;
  player: Vec2;
  party: HeroState[];
  inventory: Record<string, number>;
  gold: number;
  quests: Record<string, QuestState>;
  defeated: Record<string, boolean>;
  collected: Record<string, boolean>;
  openedChests: Record<string, boolean>;
  storyComplete: boolean;
  settings: {
    music: number;
    sfx: number;
    textSpeed: number;
  };
};

export type Combatant = {
  uid: string;
  actorId: string;
  name: string;
  side: "party" | "enemy";
  level: number;
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  guarding: boolean;
  skills: string[];
};
