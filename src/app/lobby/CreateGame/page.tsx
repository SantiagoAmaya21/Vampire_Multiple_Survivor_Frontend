"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRoomByPlayer, getRoom, startGame } from "@/lib/lobby";

interface PlayerDTO {
  id: number;
  playerName: string;
  ready: boolean;
  host: boolean;
}

interface GameRoomDTO {
  id: number;
  roomCode: string;
  name: string; // backend uses 'name' in DTO
  gameStarted: boolean;
  maxPlayers: number;
  players: PlayerDTO[];
}

export default function CreateGame() {
  const router = useRouter();
  const [room, setRoom] = useState<GameRoomDTO | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomForHost = async (host: string) => {
    try {
      // Intentamos primero encontrar la sala donde el jugador es host
      const found = await getRoomByPlayer(host);
      if (found) {
        // Backend GameRoomDTO tiene 'name' (según tu DTO)
        setRoom(found);
      } else {
        setRoom(null);
        setError("No se encontró la sala en la que eres host.");
      }
    } catch (err) {
      console.error("Error fetching host room:", err);
      setError("Error al obtener la sala.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("player");
    if (!stored) {
      router.push("/");
      return;
    }
    const parsed = JSON.parse(stored);
    setPlayerName(parsed.playerName);

    // fetch once and poll
    fetchRoomForHost(parsed.playerName);
    const interval = setInterval(() => fetchRoomForHost(parsed.playerName), 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the host clicked "Iniciar partida"
  const handleStart = async () => {
    if (!room) return;
    try {
      // Validación local: sólo permitir si todos ready
      const allReady = room.players.every((p) => p.ready);
      if (!allReady) {
        alert("No todos los jugadores están listos.");
        return;
      }

      await startGame(room.roomCode);
      // Navegar al mapa (gameScreen) con el roomCode
      router.push(`/gameScreen?roomCode=${room.roomCode}`);
    } catch (err) {
      console.error("Error starting game:", err);
      alert("No se pudo iniciar la partida.");
    }
  };

  // Helper para detectar si el current player es host
  const isCurrentPlayerHost = () => {
    if (!room) return false;
    return room.players.some((p) => p.playerName === playerName && p.host);
  };

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/assets/imagen.jpg')" }}
    >
      <div className="bg-black/60 border-2 border-[#d4af37] rounded-xl p-8 w-[500px] shadow-xl text-center">
        <h1 className="text-[#d4af37] text-3xl font-bold mb-6 drop-shadow-md">
          Jugadores en la partida
        </h1>

        <div className="space-y-3 mb-8 text-white">
          {loading ? (
            <p>Obteniendo jugadores...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : room ? (
            <>
              {room.players.length === 0 ? (
                <p>No hay jugadores aún.</p>
              ) : (
                <ul className="text-left">
                  {room.players.map((p) => (
                    <li key={p.id} className="flex justify-between items-center py-1">
                      <span>
                        {p.playerName} {p.host ? "(host)" : ""}
                      </span>
                      <span className="text-sm italic">
                        {p.ready ? "Listo" : "No listo"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p>No se encontró la sala.</p>
          )}
        </div>

        {/* Botón Iniciar sólo visible si eres host */}
        {room && isCurrentPlayerHost() ? (
          <button
            onClick={handleStart}
            className="
              mt-4 px-8 py-4 w-full
              text-white text-xl font-semibold
              rounded-2xl bg-black/70
              border-2 border-[#d4af37]
              transition-all duration-200
              hover:scale-105 hover:border-[#f1d87a]
              hover:shadow-[0_0_15px_rgba(212,175,55,0.8)]
            "
          >
            Iniciar partida
          </button>
        ) : (
          // Si por alguna razón no eres host, mostramos un botón deshabilitado o texto
          <div className="mt-4">
            <button
              disabled
              className="mt-4 px-8 py-4 w-full text-white text-xl font-semibold rounded-2xl bg-black/30 border-2 border-[#666]"
            >
              Esperando como jugador
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
