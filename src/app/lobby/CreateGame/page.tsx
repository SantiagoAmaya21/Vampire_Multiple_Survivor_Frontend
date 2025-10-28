"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRoomByPlayer, startGame } from "@/lib/lobby";

interface PlayerDTO {
  id: number;
  playerName: string;
  host: boolean;
}

interface GameRoomDTO {
  roomCode: string;
  players: PlayerDTO[];
  gameStarted: boolean;
}

export default function CreateGame() {
  const router = useRouter();
  const [room, setRoom] = useState<GameRoomDTO | null>(null);
  const [playerName, setPlayerName] = useState<string>("");

  const fetchRoom = async (host: string) => {
    try {
      const found = await getRoomByPlayer(host);
      if (found) {
        setRoom(found);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("player");
    if (!stored) return router.push("/");

    const parsed = JSON.parse(stored);
    setPlayerName(parsed.playerName);

    fetchRoom(parsed.playerName);
    const interval = setInterval(() => fetchRoom(parsed.playerName), 1500);
    return () => clearInterval(interval);
  }, [router]);

  const handleStart = async () => {
    if (!room) return;
    try {
      await startGame(room.roomCode);
      router.push(`/gameScreen?roomCode=${room.roomCode}`);
    } catch (err) {
      console.error(err);
      alert("No se pudo iniciar la partida");
    }
  };

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/assets/imagen.jpg')" }}
    >
      <div className="bg-black/60 border-2 border-[#d4af37] rounded-xl p-8 w-[500px] shadow-xl text-center">
        <h1 className="text-[#d4af37] text-3xl font-bold mb-6 drop-shadow-md">
          Sala de espera
        </h1>

        <ul className="text-white text-left mb-8 space-y-2">
          {room?.players?.length ? (
            room.players.map((p) => (
              <li key={p.id}>
                {p.playerName} {p.host && "(Host)"}
              </li>
            ))
          ) : (
            <p className="text-gray-300">Esperando jugadores...</p>
          )}
        </ul>

        <button
          onClick={handleStart}
          className="px-8 py-4 w-full text-white text-xl font-semibold rounded-2xl bg-black/70 border-2 border-[#d4af37] transition-all duration-200 hover:scale-105 hover:border-[#f1d87a] hover:shadow-[0_0_15px_rgba(212,175,55,0.8)]"
        >
          Iniciar Partida
        </button>
      </div>
    </main>
  );
}
