"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPlayer } from "../lib/player";
import InputPlayerName from "../components/InputPlayerName";

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");

  const handleStart = async () => {
    if (!playerName.trim()) return;

    try {
      const playerData = await createPlayer(playerName);
      localStorage.setItem("player", JSON.stringify(playerData.data));
      console.log("Jugador creado:", playerData.data);
      router.push("/initialScreen");
    } catch (error: any) {
        if (error.response && error.response.status === 409) {
          alert("Ese nombre ya existe, elige otro.");
        } else {
          alert("Hubo un error al crear el jugador.");
        }
    }
  };

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex items-end justify-center"
      style={{ backgroundImage: "url('/assets/imagen.jpg')" }}
    >
      <div className="pb-16 flex flex-col items-center space-y-4">
        <InputPlayerName
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onEnter={handleStart}
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
