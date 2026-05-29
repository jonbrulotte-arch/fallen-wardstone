import { actors, items, quests, skills } from "../data/content";
import { clearSave, saveGame, xpForNext } from "../systems/GameState";
import { itemCount, maxHp, maxMp } from "../systems/Progression";
import type { BattleState } from "../systems/CombatSystem";
import type { Combatant, GameState, MapData } from "../systems/types";

type WorldHandlers = {
  onNewGame: () => void;
  onLoadGame: () => void;
  onSaveGame: () => void;
  onCloseMenu: () => void;
  onBuy: (itemId: string) => void;
  onUseItem: (itemId: string, heroId: string) => void;
  onEquip: (itemId: string, heroId: string) => void;
};

type BattleHandlers = {
  attack: () => void;
  defend: () => void;
  flee: () => void;
  skill: (skillId: string) => void;
  item: (itemId: string) => void;
};

export class UiBridge {
  private toastTimer?: number;

  constructor(private root: HTMLDivElement) {}

  renderTitle(hasSave: boolean, handlers: Pick<WorldHandlers, "onNewGame" | "onLoadGame">): void {
    this.root.innerHTML = `<div class="title-screen"><div class="title-copy"><span class="eyebrow">A compact fantasy RPG</span><h1>Fallen Wardstone</h1><p>Three village heroes cross wilds and ruins to rekindle the relic that keeps Stonefall safe.</p><div class="title-actions"><button data-action="new">New Game</button><button data-action="load" ${hasSave ? "" : "disabled"}>Load Game</button></div></div></div>`;
    this.bind("[data-action='new']", handlers.onNewGame);
    this.bind("[data-action='load']", handlers.onLoadGame);
  }

  renderWorld(state: GameState, map: MapData, prompt: string, handlers: WorldHandlers): void {
    const quest = state.quests.main;
    this.root.innerHTML = `<div class="hud hud-top"><div class="brand"><strong>Fallen Wardstone</strong><span>${map.name}</span></div><div class="objective">${state.storyComplete ? "The ward burns bright again." : quest ? quests.main.steps[quest.step] : "Speak with Elder Rowan"}</div><button class="icon-btn" data-action="menu">Menu</button></div><div class="party-strip">${state.party.map((hero) => this.heroChip(hero.id, hero.hp, maxHp(hero), hero.mp, maxMp(hero), hero.level, hero.xp)).join("")}</div><div class="prompt">${prompt}</div>`;
    this.bind("[data-action='menu']", () => this.renderMenu(state, handlers));
  }

  renderDialogue(name: string, lines: string[], onDone: () => void): void {
    this.root.insertAdjacentHTML("beforeend", `<div class="modal"><div class="dialogue"><h2>${name}</h2>${lines.map((line) => `<p>${line}</p>`).join("")}<button data-action="dialogue-done">Continue</button></div></div>`);
    this.bind("[data-action='dialogue-done']", () => { this.closeModal(); onDone(); });
  }

  renderShop(state: GameState, stock: string[], handlers: WorldHandlers): void {
    this.root.insertAdjacentHTML("beforeend", `<div class="modal"><div class="panel wide"><div class="panel-head"><h2>Tovin's Kit</h2><span>${state.gold} gold</span></div><div class="shop-grid">${stock.map((id) => `<div class="item-row"><strong>${items[id].name}</strong><span>${items[id].description}</span><button data-buy="${id}" ${state.gold < (items[id].price ?? 0) ? "disabled" : ""}>${items[id].price ?? 0}g</button></div>`).join("")}</div><button data-action="close-modal">Close</button></div></div>`);
    stock.forEach((id) => this.bind(`[data-buy='${id}']`, () => handlers.onBuy(id)));
    this.bind("[data-action='close-modal']", () => this.closeModal());
  }

  renderMenu(state: GameState, handlers: WorldHandlers): void {
    this.root.insertAdjacentHTML("beforeend", `<div class="modal"><div class="panel menu-panel"><div class="panel-head"><h2>Journal</h2><span>${state.gold} gold</span></div><div class="menu-grid"><section><h3>Party</h3>${state.party.map((hero) => this.heroChip(hero.id, hero.hp, maxHp(hero), hero.mp, maxMp(hero), hero.level, hero.xp)).join("")}</section><section><h3>Inventory</h3>${Object.entries(state.inventory).map(([id, count]) => this.inventoryRow(id, count)).join("") || "<p>No items.</p>"}</section><section><h3>Quests</h3>${Object.values(quests).map((quest) => { const progress = state.quests[quest.id]; return `<div class="quest"><strong>${quest.title}</strong><span>${progress?.complete ? "Complete" : progress ? quest.steps[progress.step] : "Not started"}</span></div>`; }).join("")}</section></div><div class="menu-actions"><button data-action="save">Save</button><button data-action="clear">Clear Save</button><button data-action="close-menu">Close</button></div></div></div>`);
    Object.keys(state.inventory).forEach((id) => state.party.forEach((hero) => {
      this.bind(`[data-use='${id}:${hero.id}']`, () => handlers.onUseItem(id, hero.id));
      this.bind(`[data-equip='${id}:${hero.id}']`, () => handlers.onEquip(id, hero.id));
    }));
    this.bind("[data-action='save']", () => { saveGame(state); this.toast("Game saved."); this.closeModal(); handlers.onCloseMenu(); });
    this.bind("[data-action='clear']", () => { clearSave(); this.toast("Save cleared."); this.closeModal(); handlers.onCloseMenu(); });
    this.bind("[data-action='close-menu']", () => { this.closeModal(); handlers.onCloseMenu(); });
  }

  renderBattle(battle: BattleState, state: GameState, handlers: BattleHandlers): void {
    const hero = battle.party[battle.activeHeroIndex];
    this.root.innerHTML = `<div class="battle-hud"><div class="enemy-row">${battle.enemies.map((enemy) => this.combatantCard(enemy)).join("")}</div><div class="battle-log">${battle.log.slice(-5).map((line) => `<p>${line}</p>`).join("")}</div><div class="command-panel"><div class="turn-label">${hero ? `${hero.name}'s turn` : "Resolving..."}</div><div class="commands"><button data-action="attack">Attack</button><button data-action="defend">Defend</button><button data-action="flee">Flee</button>${hero?.skills.map((id) => `<button data-skill="${id}" ${hero.mp < skills[id].mpCost ? "disabled" : ""}>${skills[id].name}</button>`).join("") ?? ""}${["herb", "ether"].map((id) => `<button data-item="${id}" ${itemCount(state, id) <= 0 ? "disabled" : ""}>${items[id].name} (${itemCount(state, id)})</button>`).join("")}</div></div><div class="party-strip battle">${battle.party.map((entry) => this.combatantCard(entry)).join("")}</div></div>`;
    this.bind("[data-action='attack']", handlers.attack);
    this.bind("[data-action='defend']", handlers.defend);
    this.bind("[data-action='flee']", handlers.flee);
    hero?.skills.forEach((id) => this.bind(`[data-skill='${id}']`, () => handlers.skill(id)));
    ["herb", "ether"].forEach((id) => this.bind(`[data-item='${id}']`, () => handlers.item(id)));
  }

  toast(message: string): void {
    window.clearTimeout(this.toastTimer);
    let el = this.root.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; this.root.appendChild(el); }
    el.textContent = message;
    this.toastTimer = window.setTimeout(() => el?.remove(), 2600);
  }

  clear(): void { this.root.innerHTML = ""; }

  private inventoryRow(id: string, count: number): string {
    const item = items[id];
    const targets = ["brann", "elia", "nyx"];
    const actions = item.kind === "consumable" ? targets.map((heroId) => `<button data-use="${id}:${heroId}">Use on ${actors[heroId].name}</button>`).join("") : (item.kind === "weapon" || item.kind === "armor" || item.kind === "accessory") ? targets.map((heroId) => `<button data-equip="${id}:${heroId}">Equip ${actors[heroId].name}</button>`).join("") : "";
    return `<div class="item-row"><strong>${item.name} x${count}</strong><span>${item.description}</span><div>${actions}</div></div>`;
  }

  private heroChip(id: string, hp: number, maxHpValue: number, mp: number, maxMpValue: number, level: number, xp: number): string {
    return `<div class="hero-chip"><strong>${actors[id].name}</strong><span>Lv ${level}</span><span>HP ${hp}/${maxHpValue}</span><span>MP ${mp}/${maxMpValue}</span><small>${xp}/${xpForNext(level)} XP</small></div>`;
  }

  private combatantCard(entry: Combatant): string {
    return `<div class="combatant ${entry.side}"><strong>${entry.name}</strong><span>HP ${entry.hp}/${entry.maxHp}</span><span>MP ${entry.mp}/${entry.maxMp}</span></div>`;
  }

  private bind(selector: string, handler: () => void): void {
    this.root.querySelectorAll<HTMLElement>(selector).forEach((el) => { el.onclick = handler; });
  }

  private closeModal(): void { this.root.querySelector(".modal")?.remove(); }
}
