import Phaser from "phaser";
import { assetManifest } from "../data/assets";
import { actors, dialogue, items, maps } from "../data/content";
import { createNewGame, loadGame, saveGame } from "../systems/GameState";
import { acceptQuest, addItem, advanceQuest, completeQuest, equipItem, itemCount, removeItem, useConsumable } from "../systems/Progression";
import type { AudioSystem } from "../systems/AudioSystem";
import type { GameState, MapData, NpcData } from "../systems/types";
import type { UiBridge } from "../ui/UiBridge";

export class WorldScene extends Phaser.Scene {
  private state!: GameState;
  private ui!: UiBridge;
  private audio!: AudioSystem;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private prompt = "";
  private currentMap!: MapData;
  private blocked = true;
  private interactTarget?: { type: "npc"; data: NpcData } | { type: "chest"; id: string } | { type: "pickup"; id: string };

  constructor() { super("WorldScene"); }

  preload(): void { this.createTextures(); }

  create(data?: { resumeState?: GameState }): void {
    this.ui = this.registry.get("ui") as UiBridge;
    this.audio = this.registry.get("audio") as AudioSystem;
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,E,SPACE,ESC,M") as Record<string, Phaser.Input.Keyboard.Key>;
    if (data?.resumeState) {
      this.state = data.resumeState;
      this.loadMap(this.state.mapId, this.state.player.x, this.state.player.y);
      return;
    }
    this.showTitle();
  }

  update(): void {
    if (this.blocked || !this.player) return;
    const speed = 150;
    const x = (this.cursors.left.isDown || this.keys.A.isDown ? -1 : 0) + (this.cursors.right.isDown || this.keys.D.isDown ? 1 : 0);
    const y = (this.cursors.up.isDown || this.keys.W.isDown ? -1 : 0) + (this.cursors.down.isDown || this.keys.S.isDown ? 1 : 0);
    this.player.setVelocity(x * speed, y * speed);
    if (x !== 0 && y !== 0) this.player.body.velocity.normalize().scale(speed);
    this.state.player = { x: this.player.x, y: this.player.y };
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.keys.M) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.ui.renderMenu(this.state, this.worldHandlers());
  }

  private showTitle(): void {
    this.blocked = true;
    this.ui.renderTitle(loadGame() !== null, {
      onNewGame: () => { this.state = createNewGame(); this.loadMap("town", this.state.player.x, this.state.player.y); },
      onLoadGame: () => { this.state = loadGame() ?? createNewGame(); this.loadMap(this.state.mapId, this.state.player.x, this.state.player.y); }
    });
  }

  private loadMap(mapId: string, x: number, y: number): void {
    this.physics.world.colliders.getActive().forEach((collider) => collider.destroy());
    this.children.removeAll();
    this.currentMap = maps[mapId];
    this.state.mapId = mapId;
    this.state.player = { x, y };
    this.physics.world.setBounds(0, 0, this.currentMap.bounds.width, this.currentMap.bounds.height);
    this.cameras.main.setBounds(0, 0, this.currentMap.bounds.width, this.currentMap.bounds.height);
    this.drawMap(this.currentMap);
    this.player = this.physics.add.sprite(x, y, assetManifest.characters.hero).setSize(24, 26).setOffset(4, 6);
    this.player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.spawnMapObjects(this.currentMap);
    this.blocked = false;
    this.renderHud();
    this.audio.play(this.currentMap.theme);
    if (!this.state.quests.main) this.ui.toast("Speak with Elder Rowan. Move with WASD or arrows, interact with E.");
  }

  private drawMap(map: MapData): void {
    const bg = map.theme === "town" ? 0x2d5947 : map.theme === "wilds" ? 0x253f32 : 0x242733;
    this.add.rectangle(map.bounds.width / 2, map.bounds.height / 2, map.bounds.width, map.bounds.height, bg);
    const gridColor = map.theme === "dungeon" ? 0x34394a : 0x37634f;
    for (let gx = 0; gx < map.bounds.width; gx += 64) this.add.line(0, 0, gx, 0, gx, map.bounds.height, gridColor, 0.18).setOrigin(0);
    for (let gy = 0; gy < map.bounds.height; gy += 64) this.add.line(0, 0, 0, gy, map.bounds.width, gy, gridColor, 0.18).setOrigin(0);
    if (map.theme === "town") {
      this.add.rectangle(185, 310, 190, 130, 0x7c563d).setStrokeStyle(4, 0x3b2419);
      this.add.rectangle(715, 305, 180, 120, 0x6c4b3a).setStrokeStyle(4, 0x2c1d17);
      this.add.circle(480, 230, 38, this.state?.storyComplete ? 0x84e6ff : 0x4b5565).setStrokeStyle(5, 0xd8c987);
    }
    if (map.theme === "wilds") {
      for (let i = 0; i < 18; i += 1) this.add.circle(120 + i * 62, 110 + (i % 4) * 95, 20, 0x21412a);
      this.add.rectangle(1000, 275, 180, 160, 0x384452).setStrokeStyle(4, 0x9c8b5f);
    }
    if (map.theme === "dungeon") {
      this.add.rectangle(1055, 270, 185, 190, 0x313748).setStrokeStyle(5, 0x7f6b48);
      this.add.circle(1055, 270, 52, 0x5d2636, 0.55);
    }
    map.exits.forEach((exit) => {
      this.add.rectangle(exit.x + exit.w / 2, exit.y + exit.h / 2, exit.w, exit.h, 0xb8a45d, 0.6).setStrokeStyle(2, 0xf4e6a0);
      this.add.text(exit.x - 6, exit.y - 22, exit.label, { fontFamily: "monospace", fontSize: "13px", color: "#fff2c2" });
    });
  }

  private spawnMapObjects(map: MapData): void {
    map.npcs.forEach((npc) => {
      const sprite = this.physics.add.staticSprite(npc.x, npc.y, assetManifest.characters.npc);
      this.add.text(npc.x - 32, npc.y - 44, npc.name, { fontFamily: "monospace", fontSize: "12px", color: "#f7e5bd" });
      this.physics.add.overlap(this.player, sprite, () => this.setPrompt(`Talk to ${npc.name}`, { type: "npc", data: npc }));
    });
    map.pickups.filter((entry) => !this.state.collected[entry.id]).forEach((pickup) => {
      const sprite = this.physics.add.staticSprite(pickup.x, pickup.y, pickup.itemId === "wardShard" ? assetManifest.environment.shard : assetManifest.environment.pickup);
      this.physics.add.overlap(this.player, sprite, () => this.setPrompt(`Pick up ${items[pickup.itemId].name}`, { type: "pickup", id: pickup.id }));
    });
    map.chests.filter((entry) => !this.state.openedChests[entry.id]).forEach((chest) => {
      const sprite = this.physics.add.staticSprite(chest.x, chest.y, assetManifest.environment.chest);
      this.physics.add.overlap(this.player, sprite, () => this.setPrompt("Open chest", { type: "chest", id: chest.id }));
    });
    map.enemies.filter((entry) => !this.state.defeated[entry.id]).forEach((encounter) => {
      const sprite = this.physics.add.sprite(encounter.x, encounter.y, encounter.boss ? assetManifest.characters.boss : assetManifest.characters.enemy);
      sprite.setImmovable(true);
      this.tweens.add({ targets: sprite, y: encounter.y + 12, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      this.physics.add.overlap(this.player, sprite, () => { this.blocked = true; this.scene.start("BattleScene", { state: this.state, encounter }); });
    });
    map.exits.forEach((exit) => {
      const zone = this.add.zone(exit.x + exit.w / 2, exit.y + exit.h / 2, exit.w, exit.h);
      this.physics.world.enable(zone);
      this.physics.add.overlap(this.player, zone, () => {
        if (exit.requiresQuestStep !== undefined && (this.state.quests.main?.step ?? 0) < exit.requiresQuestStep) { this.ui.toast("The ruin gate waits for the wardstone shard."); return; }
        this.loadMap(exit.toMap, exit.toX, exit.toY);
      });
    });
  }

  private setPrompt(prompt: string, target: WorldScene["interactTarget"]): void {
    this.prompt = `${prompt} [E]`;
    this.interactTarget = target;
    this.renderHud();
    this.time.delayedCall(180, () => {
      if (this.prompt === `${prompt} [E]`) { this.prompt = ""; this.interactTarget = undefined; this.renderHud(); }
    });
  }

  private interact(): void {
    if (!this.interactTarget) return;
    this.audio.play("ui", 0.05);
    if (this.interactTarget.type === "npc") this.handleNpc(this.interactTarget.data);
    if (this.interactTarget.type === "pickup") this.handlePickup(this.interactTarget.id);
    if (this.interactTarget.type === "chest") this.handleChest(this.interactTarget.id);
  }

  private handleNpc(npc: NpcData): void {
    const data = dialogue[npc.dialogueId];
    this.blocked = true;
    this.ui.renderDialogue(npc.name, data.lines, () => {
      if (data.questId) acceptQuest(this.state, data.questId);
      if (data.questId === "main" && this.state.quests.main.step === 0) advanceQuest(this.state, "main");
      if (data.turnInItem && itemCount(this.state, data.turnInItem) >= (data.turnInCount ?? 1)) {
        removeItem(this.state, data.turnInItem, data.turnInCount ?? 1);
        completeQuest(this.state, data.questId!);
        this.ui.toast("Mara packs the herbs into careful little bundles.");
      }
      this.blocked = false;
      this.renderHud();
      if (npc.shop) this.ui.renderShop(this.state, npc.shop, this.worldHandlers());
    });
  }

  private handlePickup(id: string): void {
    const pickup = this.currentMap.pickups.find((entry) => entry.id === id);
    if (!pickup) return;
    addItem(this.state, pickup.itemId);
    this.state.collected[id] = true;
    if (pickup.advancesQuest) advanceQuest(this.state, pickup.advancesQuest);
    this.ui.toast(`Found ${items[pickup.itemId].name}.`);
    this.loadMap(this.state.mapId, this.player.x, this.player.y);
  }

  private handleChest(id: string): void {
    const chest = this.currentMap.chests.find((entry) => entry.id === id);
    if (!chest) return;
    this.state.openedChests[id] = true;
    this.state.gold += chest.gold;
    chest.items.forEach((item) => addItem(this.state, item));
    this.ui.toast(`Found ${chest.gold} gold and ${chest.items.map((item) => items[item].name).join(", ")}.`);
    this.loadMap(this.state.mapId, this.player.x, this.player.y);
  }

  private worldHandlers() {
    return {
      onNewGame: () => { this.state = createNewGame(); this.loadMap("town", 480, 360); },
      onLoadGame: () => { this.state = loadGame() ?? createNewGame(); this.loadMap(this.state.mapId, this.state.player.x, this.state.player.y); },
      onSaveGame: () => saveGame(this.state),
      onCloseMenu: () => this.renderHud(),
      onBuy: (itemId: string) => { const item = items[itemId]; if (this.state.gold < (item.price ?? 0)) return; this.state.gold -= item.price ?? 0; addItem(this.state, itemId); this.ui.toast(`Bought ${item.name}.`); },
      onUseItem: (itemId: string, heroId: string) => { this.ui.toast(useConsumable(this.state, itemId, heroId)); this.renderHud(); },
      onEquip: (itemId: string, heroId: string) => { const hero = this.state.party.find((entry) => entry.id === heroId); if (!hero) return; const previous = equipItem(hero, itemId); removeItem(this.state, itemId); if (previous) addItem(this.state, previous); this.ui.toast(`${actors[heroId].name} equipped ${items[itemId].name}.`); this.renderHud(); }
    };
  }

  private renderHud(): void { this.ui.renderWorld(this.state, this.currentMap, this.prompt, this.worldHandlers()); }

  private createTextures(): void {
    const make = (key: string, color: number, stroke = 0xffffff) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(color, 1); g.fillRoundedRect(2, 2, 28, 28, 7);
      g.lineStyle(2, stroke, 1); g.strokeRoundedRect(2, 2, 28, 28, 7);
      g.generateTexture(key, 32, 32); g.destroy();
    };
    make(assetManifest.characters.hero, 0x58b5b0, 0xe9fffb);
    make(assetManifest.characters.npc, 0xc9955b, 0xffe1b3);
    make(assetManifest.characters.enemy, 0x8a3d48, 0xffb0b8);
    make(assetManifest.characters.boss, 0x5b2438, 0xffd26a);
    make(assetManifest.environment.pickup, 0x74b85a, 0xf4ffd6);
    make(assetManifest.environment.shard, 0x5ac7ff, 0xffffff);
    make(assetManifest.environment.chest, 0x9d6a34, 0xffd48a);
  }
}
