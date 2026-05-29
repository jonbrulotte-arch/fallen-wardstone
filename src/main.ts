import Phaser from "phaser";
import { WorldScene } from "./scenes/WorldScene";
import { BattleScene } from "./scenes/BattleScene";
import { AudioSystem } from "./systems/AudioSystem";
import { UiBridge } from "./ui/UiBridge";
import "./styles/game.css";

const ui = new UiBridge(document.querySelector<HTMLDivElement>("#ui-root")!);
const audio = new AudioSystem();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#12151c",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: [WorldScene, BattleScene],
  callbacks: {
    postBoot: (game) => {
      game.registry.set("ui", ui);
      game.registry.set("audio", audio);
    }
  }
};

new Phaser.Game(config);
