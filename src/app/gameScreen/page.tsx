"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

const GameCanvas = dynamic(() => import("../../game/GameScene"), {
  ssr: false
});

export default function GameScreen() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden">
      <GameCanvas />
    </main>
  );
}
