import Phaser from "phaser";
import { connectWS, sendInput } from "./websocket";
import { assets } from "./assets";

let player: Phaser.GameObjects.Sprite | null = null;
let xpBar: Phaser.GameObjects.Graphics;
let xpProgress = 0;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("background", assets.map);
    this.load.image("xp", "https://dummyimage.com/200x10/00ff00/000000.png");

    Object.entries(assets.knight).forEach(([key, path]) => {
      this.load.image("knight_" + key, path as string);
    });
  }

  create() {
    // Fondo
    this.add.image(0, 0, "background").setOrigin(0).setDisplaySize(1920, 1080);

    // Jugador (por ahora idle)
    player = this.add.sprite(200, 200, "knight_idle").setScale(1.5);

    // Barra XP
    xpBar = this.add.graphics();
    this.updateXPBar();

    const stored = JSON.parse(localStorage.getItem("player")!);
    const roomCode = stored.roomCode;
    const name = stored.playerName;

    connectWS(roomCode, name, (state: any) => {
      if (!player) return;
      const myState = state.players.find((p: any) => p.name === name);
      if (myState) {
        player.x = myState.x;
        player.y = myState.y;
        xpProgress = state.xpProgress;
        this.updateXPBar();
      }
    });

    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => this.handleInput(e));
    this.input.keyboard?.on("keyup", (e: KeyboardEvent) => this.handleInput(e));
  }

  handleInput(e: KeyboardEvent) {
    if (!player) return;

    let xDir = 0;
    let yDir = 0;
    let facingRight = true;

    if (this.input.keyboard?.addKey("W").isDown) yDir = -1;
    if (this.input.keyboard?.addKey("S").isDown) yDir = 1;
    if (this.input.keyboard?.addKey("A").isDown) {
      xDir = -1;
      facingRight = false;
    }
    if (this.input.keyboard?.addKey("D").isDown) {
      xDir = 1;
      facingRight = true;
    }

    if (xDir !== 0 || yDir !== 0) {
      player.setTexture(facingRight ? "knight_runRight" : "knight_runLeft");
    } else {
      player.setTexture("knight_idle");
    }

    sendInput(xDir, yDir, facingRight);
  }

  updateXPBar() {
    xpBar.clear();
    xpBar.fillStyle(0x000000);
    xpBar.fillRect(20, 20, 300, 20);

    xpBar.fillStyle(0x00ff00);
    xpBar.fillRect(20, 20, 300 * xpProgress, 20);
  }
}

export default function GameCanvas() {
  return <div id="phaser-game" style={{ width: "100%", height: "100%" }}></div>;
}
