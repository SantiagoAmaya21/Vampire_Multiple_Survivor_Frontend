"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllRooms, joinRoom, createRoom } from "@/lib/gameRoom";

interface PlayerDTO {
  id: number;
  playerName: string;
  ready: boolean;
  host: boolean;
}

interface GameRoomDTO {
  id: number;
  roomCode: string;
  roomName: string;
  gameStarted: boolean;
  maxPlayers: number;
  players: PlayerDTO[];
}

export default function InitialScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<GameRoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState("Santiago"); // o guardado en contexto/session

  const fetchRooms = async () => {
    try {
      const data = await getAllRooms();
      // solo mostrar salas que no hayan iniciado
      const openRooms = data.filter((room: GameRoomDTO) => !room.gameStarted);
      setRooms(openRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // opcional: refrescar cada X segundos
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async (roomCode: string) => {
    try {
      await joinRoom(roomCode, playerName);
      router.push(`/lobby/joinGame?id=${roomCode}&playerName=${playerName}`);
    } catch (error) {
      console.error("Error joining room:", error);
      alert("No se pudo unir a la sala");
    }
  };

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex flex-col"
      style={{
        backgroundImage: "url('/assets/vampire-survivors_q9es.1280.jpg')",
      }}
    >
      <h2
        className="text-5xl font-extrabold text-center pt-10"
        style={{
          color: "black",
          fontFamily: "'Times New Roman', serif",
          WebkitTextStroke: "2px gold",
          textShadow:
            "0 0 10px gold, 0 0 20px gold, 0 0 30px rgba(255,215,0,0.6)",
        }}
      >
        Vampire Multiple Survivor
      </h2>

      <div className="absolute top-6 right-6">
        <button
          onClick={async () => {
            try {
              await createRoom("Sala nueva", playerName); // llamamos al backend
              router.push("/lobby/CreateGame"); // solo vamos a la página existente
            } catch (err) {
              console.error("Error creando sala:", err);
              alert("No se pudo crear la sala");
            }
          }}
          className="px-6 py-3 bg-black/70 text-white text-xl font-bold
                     border-2 border-[#d4af37] rounded-xl
                     transition-all duration-200 hover:scale-105
                     hover:border-[#f1d87a] hover:shadow-[0_0_12px_rgba(212,175,55,0.9)]"
        >
          Crear partida
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="bg-black/60 p-6 rounded-2xl border border-[#d4af37] w-[600px]">
          <h3 className="text-center text-2xl text-white font-bold mb-4">
            Partidas disponibles
          </h3>

          {loading ? (
            <p className="text-center text-white opacity-80">Cargando...</p>
          ) : rooms.length === 0 ? (
            <p className="text-center text-white opacity-80">
              No hay partidas por ahora...
            </p>
          ) : (
            <ul className="space-y-4">
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex justify-between items-center p-3 bg-black/30
                             rounded-xl border border-[#d4af37]/40"
                >
                  <span className="text-white">
                    <strong>{room.roomName}</strong> — Host:{" "}
                    {room.players.find((p) => p.host)?.playerName || "Desconocido"}
                  </span>
                  <button
                    onClick={() => handleJoin(room.roomCode)}
                    className="px-4 py-2 bg-red-800/80 text-white rounded-lg
                               border border-red-500 hover:bg-red-600 hover:scale-105"
                  >
                    Unirse
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
