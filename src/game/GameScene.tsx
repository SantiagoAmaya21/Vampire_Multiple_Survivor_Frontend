import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import { connectGame, disconnectGame, sendMovement } from "./websocket";
import { assets } from "./assets";

type PlayerState = {
  name: string;
  x: number;
  y: number;
  health: number;
};

type GameState = {
  roomCode: string;
  players: PlayerState[];
  npcs?: any[];
  chests?: any[];
  xpProgress?: number;
};

let phaserGame: Phaser.Game | null = null;

export default function GameCanvas(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("player");
    if (!stored) {
      alert("Jugador no encontrado en localStorage");
      return;
    }
    const player = JSON.parse(stored);
    const roomCode = player.roomCode || new URLSearchParams(window.location.search).get("roomCode");
    const playerName = player.playerName;

    if (!roomCode || !playerName) {
      alert("Falta roomCode o playerName.");
      return;
    }

    class MainScene extends Phaser.Scene {
      playersMap = new Map<string, Phaser.GameObjects.Image>();
      nameTexts = new Map<string, Phaser.GameObjects.Text>();
      npcMap = new Map<string, Phaser.GameObjects.Image>();
      chestMap = new Map<number, Phaser.GameObjects.Image>();
      xpProgress = 0;
      hudText!: Phaser.GameObjects.Text;
      xpText!: Phaser.GameObjects.Text;
      xpBar!: Phaser.GameObjects.Graphics;

      constructor() { super({ key: "MainScene" }); }

      preload() {
        // fondo
        this.load.image("background", assets.map);

        // Knight
        this.load.spritesheet("knight-run-right", assets.knight.runRight, { frameWidth: 180, frameHeight: 180 });
        this.load.spritesheet("knight-run-left", assets.knight.runLeft, { frameWidth: 180, frameHeight: 180 });
        this.load.image("knight-idle", assets.knight.idle);

        // Skeleton
        this.load.spritesheet("skeleton-walk-right", assets.skeleton.walkRight, { frameWidth: 150, frameHeight: 150 });
        this.load.spritesheet("skeleton-walk-left", assets.skeleton.walkLeft, { frameWidth: 150, frameHeight: 150 });

        // Chest
        this.load.image("chest_closed", assets.chest.closed);
        this.load.image("chest_open", assets.chest.open);
      }

      create() {
        const w = this.scale.width;
        const h = this.scale.height;

        const bg = this.add.image(0, 0, "background").setOrigin(0);
        bg.setDisplaySize(w, h);

        this.hudText = this.add.text(16, 16, "Jugadores:", { font: "18px Arial", color: "#ffffff" }).setDepth(1000);

        this.xpBar = this.add.graphics().setDepth(1000);
        this.xpText = this.add.text(w / 2, 10, "XP: 0%", { font: "18px Arial", color: "#ffffff" }).setOrigin(0.5, 0);
        this.drawXpBar();

        // Input
        const keys = this.input.keyboard.addKeys({
          up: "W",
          down: "S",
          left: "A",
          right: "D",
        }) as Phaser.Types.Input.Keyboard.CursorKeys & { left: Phaser.Input.Keyboard.Key, right: Phaser.Input.Keyboard.Key };

        const sendCurrentInput = () => {
          sendMovement(!!keys.up?.isDown, !!keys.down?.isDown, !!keys.left?.isDown, !!keys.right?.isDown);
        };

        this.input.keyboard.on("keydown", sendCurrentInput);
        this.input.keyboard.on("keyup", sendCurrentInput);

        connectGame(
          roomCode,
          playerName,
          (state: GameState) => { this.applyState(state); },
          (xpPayload: any) => { if (xpPayload.progress !== undefined) { this.xpProgress = xpPayload.progress; this.drawXpBar(); } },
          (ev: any) => { if (ev.type === "GAME_WON") { this.add.text(w / 2, h / 2, "¡Ganaste!", { font: "42px Arial", color: "#ffd700" }).setOrigin(0.5); } }
        );
      }

      drawXpBar() {
        const w = this.scale.width;
        const barWidth = 360;
        const barHeight = 18;
        const x = (w - barWidth) / 2;
        const y = 10;

        this.xpBar.clear();
        this.xpBar.fillStyle(0x000000, 0.6);
        this.xpBar.fillRoundedRect(x - 4, y - 4, barWidth + 8, barHeight + 8, 6);

        this.xpBar.fillStyle(0x444444);
        this.xpBar.fillRoundedRect(x, y, barWidth, barHeight, 6);

        this.xpBar.fillStyle(0x00ff00);
        this.xpBar.fillRoundedRect(x, y, barWidth * this.xpProgress, barHeight, 6);

        this.xpText.setText(`XP: ${Math.round(this.xpProgress * 100)}%`);
      }

      applyState(state: GameState) {
        if (!state) return;

        // Players
        const seen = new Set<string>();
        (state.players || []).forEach((p) => {
          seen.add(p.name);
          let spr = this.playersMap.get(p.name);
          if (!spr) {
            spr = this.add.image(p.x, p.y, "knight-idle").setScale(1.2);
            this.playersMap.set(p.name, spr);
            const txt = this.add.text(p.x, p.y - 40, `${p.name} (${p.health})`, { font: "16px Arial", color: "#ffffff", backgroundColor: "rgba(0,0,0,0.4)" }).setOrigin(0.5);
            this.nameTexts.set(p.name, txt);
          } else {
            spr.x = p.x; spr.y = p.y;
            const txt = this.nameTexts.get(p.name);
            if (txt) { txt.x = p.x; txt.y = p.y - 40; txt.setText(`${p.name} (${p.health})`); }
          }
          if (p.health <= 0) {
            this.playersMap.get(p.name)?.destroy();
            this.nameTexts.get(p.name)?.destroy();
            this.playersMap.delete(p.name);
            this.nameTexts.delete(p.name);
          }
        });
        Array.from(this.playersMap.keys()).forEach((name) => { if (!seen.has(name)) { this.playersMap.get(name)?.destroy(); this.nameTexts.get(name)?.destroy(); this.playersMap.delete(name); this.nameTexts.delete(name); } });

        // XP
        if (typeof state.xpProgress === "number") { this.xpProgress = state.xpProgress; this.drawXpBar(); }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: containerRef.current || undefined,
      scene: [MainScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      backgroundColor: "#000000",
    };

    phaserGame = new Phaser.Game(config);

    return () => { disconnectGame(); phaserGame?.destroy(true); phaserGame = null; };
  }, []);

  return <div ref={containerRef} id="phaser-container" style={{ width: "100%", height: "100%" }} />;
}
