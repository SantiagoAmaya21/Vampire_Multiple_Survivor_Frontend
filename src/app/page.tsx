"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");

  const handleStart = () => {
    if (!playerName.trim()) return;
    localStorage.setItem("playerName", playerName);
    router.push("/initialScreen");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleStart();
  };

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex items-end justify-center"
      style={{
        backgroundImage: "url('/assets/imagen.jpg')",
      }}
    >
      <div className="pb-16 flex flex-col items-center space-y-4">
        <input
          type="text"
          placeholder="Ingresa tu nombre..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="
            px-6 py-3 rounded-xl w-64 text-lg text-white text-center font-semibold
            bg-black/60 placeholder-gray-300
            border-2 border-[#d4af37]
            shadow-lg shadow-black
            outline-none focus:ring-4 focus:ring-red-700/60
          "
        />


        <button
          onClick={handleStart}
          disabled={!playerName.trim()}
          className="
            mt-4 px-8 py-4
            text-white text-xl font-semibold
            rounded-2xl w-64
            bg-black/70
            border-2 border-[#d4af37]
            shadow-lg shadow-black
            transition-all duration-200
            hover:scale-105 hover:border-[#f1d87a]
            hover:shadow-[0_0_15px_rgba(212,175,55,0.8)]
            focus:outline-none focus:ring-4 focus:ring-red-700/60
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Iniciar juego
        </button>
      </div>
    </main>
  );
}
