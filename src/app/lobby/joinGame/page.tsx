"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRoom } from "@/lib/lobby";

interface PlayerDTO {
  id: number;
  playerName: string;
  host: boolean;
}

interface GameRoomDTO {
  roomCode: string;
  gameStarted: boolean;
  players: PlayerDTO[];
}

export default function JoinGame() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const [room, setRoom] = useState<GameRoomDTO | null>(null);
  const [playerName, setPlayerName] = useState("");

  const fetchRoom = async () => {
    if (!roomCode) return;
    try {
      const data = await getRoom(roomCode);
      setRoom(data);

      if (data.gameStarted) {
        router.push(`/gameScreen?roomCode=${roomCode}`);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("player");
    if (!stored) {
      router.push("/");
      return;
    }

    setPlayerName(JSON.parse(stored).playerName);

    // ✅ Obtener roomCode desde el navegador
    const params = new URLSearchParams(window.location.search);
    const code = params.get("id");
    if (!code) {
      router.push("/");
      return;
    }

    setRoomCode(code);
  }, [router]);

  useEffect(() => {
    if (!roomCode) return;

    fetchRoom();
    const interval = setInterval(fetchRoom, 1500);
    return () => clearInterval(interval);
  }, [roomCode]);

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

        <p className="text-gray-300 italic">
          Esperando que el anfitrión inicie la partida...
        </p>
      </div>
    </main>
  );
}
