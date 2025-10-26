"use client";

import { useEffect } from "react";

export default function GameScreen() {
  useEffect(() => {
    console.log("Game started ");
    // Aquí irá la lógica del juego
  }, []);

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex flex-col items-center justify-between relative"
      style={{
        backgroundImage: "url('/assets/WhatsApp Image 2025-10-26 at 12.25.06 PM.jpeg')",
      }}
    >
      {/* HUD Superior */}
      <div className="absolute top-0 w-full flex justify-between p-6 text-white text-2xl font-bold bg-black/40">
        <span>Salud: 100%</span>
        <span>Puntos: 0</span>
        <span>Tiempo: 00:00</span>
      </div>

      {/* Área principal del juego */}
      <div className="flex-1 w-full flex items-center justify-center">
        <canvas
          id="gameCanvas"
          width={800}
          height={600}
          className="border-4 border-yellow-600 rounded-xl shadow-[0_0_30px_rgba(255,215,0,0.5)] bg-black/50"
        ></canvas>
      </div>

      {/* Botón para salir */}
      <div className="pb-10">
        <button
          onClick={() => (window.location.href = "/initialScreen")}
          className="px-6 py-3 bg-gradient-to-b from-red-700 to-red-900 text-white text-xl font-bold rounded-xl border-2 border-black shadow-[0_0_15px_rgba(255,0,0,0.6)] hover:scale-105 transition-all duration-300"
        >
          Salir al Menú
        </button>
      </div>
    </main>
  );
}
