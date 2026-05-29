import { actors, skills } from "../data/content";
import { attack, defense, maxHp, maxMp, removeItem } from "./Progression";
import type { Combatant, EncounterData, GameState, HeroState } from "./types";

export type BattleState = {
  encounter: EncounterData;
  party: Combatant[];
  enemies: Combatant[];
  activeHeroIndex: number;
  log: string[];
  phase: "player" | "enemy" | "won" | "lost" | "fled";
};

export function startBattle(state: GameState, encounter: EncounterData): BattleState {
  return {
    encounter,
    party: state.party.map(heroToCombatant),
    enemies: encounter.actorIds.map((actorId, index) => enemyToCombatant(actorId, index)),
    activeHeroIndex: 0,
    log: [`${encounter.actorIds.map((id) => actors[id].name).join(" and ")} appeared!`],
    phase: "player"
  };
}

function heroToCombatant(hero: HeroState): Combatant {
  const actor = actors[hero.id];
  return {
    uid: hero.id,
    actorId: hero.id,
    name: actor.name,
    side: "party",
    level: hero.level,
    hp: hero.hp,
    mp: hero.mp,
    maxHp: maxHp(hero),
    maxMp: maxMp(hero),
    attack: attack(hero),
    defense: defense(hero),
    speed: actor.speed,
    guarding: false,
    skills: actor.skills.filter((skillId) => skills[skillId].unlockLevel <= hero.level)
  };
}

function enemyToCombatant(actorId: string, index: number): Combatant {
  const actor = actors[actorId];
  return {
    uid: `${actorId}-${index}`,
    actorId,
    name: actor.name,
    side: "enemy",
    level: 1,
    hp: actor.maxHp,
    mp: actor.maxMp,
    maxHp: actor.maxHp,
    maxMp: actor.maxMp,
    attack: actor.attack,
    defense: actor.defense,
    speed: actor.speed,
    guarding: false,
    skills: actor.skills
  };
}

export function applyBattleToGame(battle: BattleState, state: GameState): void {
  state.party.forEach((hero) => {
    const combatant = battle.party.find((entry) => entry.actorId === hero.id);
    if (!combatant) return;
    hero.hp = Math.max(1, combatant.hp);
    hero.mp = combatant.mp;
  });
}

export function basicAttack(battle: BattleState, attacker: Combatant, target: Combatant): void {
  const damage = Math.max(1, attacker.attack + random(2, 7) - target.defense - (target.guarding ? 4 : 0));
  target.hp = Math.max(0, target.hp - damage);
  battle.log.push(`${attacker.name} attacks ${target.name} for ${damage}.`);
}

export function castSkill(battle: BattleState, caster: Combatant, skillId: string, target: Combatant): boolean {
  const skill = skills[skillId];
  if (!skill || caster.mp < skill.mpCost) {
    battle.log.push(`${caster.name} lacks MP.`);
    return false;
  }
  caster.mp -= skill.mpCost;
  if (skill.effect === "heal") {
    target.hp = Math.min(target.maxHp, target.hp + skill.power + Math.floor(caster.attack / 2));
    battle.log.push(`${caster.name} uses ${skill.name}. ${target.name} recovers.`);
  } else {
    const damage = Math.max(2, skill.power + caster.attack - Math.floor(target.defense / 2));
    target.hp = Math.max(0, target.hp - damage);
    battle.log.push(`${caster.name} casts ${skill.name} for ${damage}.`);
  }
  return true;
}

export function useBattleItem(battle: BattleState, state: GameState, itemId: string, target: Combatant): boolean {
  if (!removeItem(state, itemId)) {
    battle.log.push(`No ${itemId} left.`);
    return false;
  }
  if (itemId === "herb") {
    target.hp = Math.min(target.maxHp, target.hp + 30);
    battle.log.push(`${target.name} recovers 30 HP.`);
    return true;
  }
  if (itemId === "ether") {
    target.mp = Math.min(target.maxMp, target.mp + 12);
    battle.log.push(`${target.name} recovers 12 MP.`);
    return true;
  }
  return false;
}

export function defend(battle: BattleState, actor: Combatant): void {
  actor.guarding = true;
  battle.log.push(`${actor.name} braces for impact.`);
}

export function advanceTurn(battle: BattleState, state: GameState): void {
  battle.party.forEach((entry) => {
    if (entry.hp > 0) entry.guarding = false;
  });
  removeDefeated(battle);
  if (battle.enemies.length === 0) {
    battle.phase = "won";
    return;
  }

  let next = battle.activeHeroIndex + 1;
  while (next < battle.party.length && battle.party[next].hp <= 0) next += 1;
  if (next < battle.party.length) {
    battle.activeHeroIndex = next;
    return;
  }

  battle.phase = "enemy";
  runEnemyRound(battle);
  if (battle.party.every((entry) => entry.hp <= 0)) {
    battle.phase = "lost";
    return;
  }
  applyBattleToGame(battle, state);
  battle.activeHeroIndex = battle.party.findIndex((entry) => entry.hp > 0);
  battle.phase = "player";
}

function runEnemyRound(battle: BattleState): void {
  battle.enemies.forEach((enemy) => {
    if (enemy.hp <= 0) return;
    const livingParty = battle.party.filter((entry) => entry.hp > 0);
    const target = livingParty[random(0, livingParty.length - 1)];
    const role = actors[enemy.actorId].role;
    const canCast = enemy.skills.length > 0 && enemy.mp >= skills[enemy.skills[0]].mpCost;
    if ((role === "caster" || role === "boss") && canCast && Math.random() > 0.35) {
      castSkill(battle, enemy, enemy.skills[role === "boss" && enemy.hp < enemy.maxHp / 2 ? 1 : 0] ?? enemy.skills[0], target);
    } else {
      basicAttack(battle, enemy, target);
    }
  });
}

function removeDefeated(battle: BattleState): void {
  const defeated = battle.enemies.filter((enemy) => enemy.hp <= 0);
  defeated.forEach((enemy) => battle.log.push(`${enemy.name} falls.`));
  battle.enemies = battle.enemies.filter((enemy) => enemy.hp > 0);
}

export function activeHero(battle: BattleState): Combatant {
  return battle.party[battle.activeHeroIndex];
}

export function firstLivingEnemy(battle: BattleState): Combatant {
  return battle.enemies[0];
}

function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
