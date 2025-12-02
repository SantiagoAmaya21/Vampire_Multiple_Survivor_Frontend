"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllRooms, joinRoom, createRoom } from "@/lib/gameRoom";
import { getCurrentUser, logout, activateSession, deactivateSession } from "@/lib/auth";

interface PlayerDTO {
  id: number;
  playerName: string;
  ready: boolean;
  host: boolean;
}

interface GameRoomDTO {
  id: number;
  roomCode: string;
  name: string;
  gameStarted: boolean;
  maxPlayers: number;
  players: PlayerDTO[];
}

export default function InitialScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<GameRoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionBlocked, setSessionBlocked] = useState(false);

  useEffect(() => {
    verifyAuthAndLoadPlayer();
  }, []);

  const verifyAuthAndLoadPlayer = async () => {
    try {
      // Verificar autenticación con Azure
      const user = await getCurrentUser();

      if (!user.isAuthenticated || !user.isRegistered || !user.playerName) {
        // No autenticado o no registrado - redirigir al login
        router.push("/");
        return;
      }

      // VALIDAR SESIÓN ÚNICA
      const sessionResult = await activateSession();

      if (!sessionResult.success && sessionResult.hasActiveSession) {
        // Otra sesión activa detectada
        setSessionBlocked(true);
        setLoading(false);
        return;
      }

      // Usuario válido con sesión activada
      setPlayerName(user.playerName);
      setEmail(user.email || "");

      // Guardar en localStorage para compatibilidad
      localStorage.setItem("player", JSON.stringify({
        playerName: user.playerName,
        email: user.email,
        userId: user.userId
      }));

      console.log("✅ Usuario autenticado y sesión activada:", user.playerName);

    } catch (error) {
      console.error("Error verificando autenticación:", error);
      router.push("/");
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await getAllRooms();
      // Filtrar solo salas que NO están iniciadas Y que tienen jugadores
      const openRooms = data.filter((room: GameRoomDTO) =>
        !room.gameStarted && room.players && room.players.length > 0
      );
      setRooms(openRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!playerName) return;

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [playerName]);

  const handleJoin = async (roomCode: string) => {
    try {
      await joinRoom(roomCode, playerName);
      router.push(`/lobby/joinGame?id=${roomCode}&playerName=${playerName}`);
    } catch (error) {
      console.error("Error joining room:", error);
      alert("No se pudo unir a la sala");
    }
  };

  const handleCreateRoom = async () => {
    try {
      await createRoom("Sala nueva", playerName);
      router.push("/lobby/CreateGame");
    } catch (err: any) {
      console.error("Error creando sala:", err);
      const errorMessage = err.response?.data?.message || err.message || "No se pudo crear la sala";
      alert(errorMessage);
    }
  };

  const handleLogout = async () => {
    await deactivateSession();
    logout();
  };

  // Desactivar sesión al cerrar/salir
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerName) {
        deactivateSession();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [playerName]);

  if (loading || !playerName) {
    return (
      <main
        className="h-screen w-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/assets/vampire-survivors_q9es.1280.jpg')",
        }}
      >
        <div className="bg-black/70 p-8 rounded-2xl border-2 border-[#d4af37]">
          <p className="text-white text-xl">Cargando...</p>
        </div>
      </main>
    );
  }

  // Pantalla de sesión bloqueada
  if (sessionBlocked) {
    return (
      <main
        className="h-screen w-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/assets/vampire-survivors_q9es.1280.jpg')",
        }}
      >
        <div className="bg-red-900/90 p-8 rounded-2xl border-4 border-red-500 max-w-md text-center">
          <h2 className="text-white text-3xl font-bold mb-4">🔒 Sesión Activa Detectada</h2>
          <p className="text-white text-lg mb-6">
            Esta cuenta ya tiene una sesión activa en otro dispositivo.
          </p>
          <p className="text-white text-sm mb-6 opacity-80">
            Por seguridad, solo puedes tener una sesión activa a la vez.
            Cierra la otra sesión para continuar aquí.
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-white text-red-900 font-bold rounded-lg
                       hover:bg-gray-200 transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </main>
    );
  }

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

      {/* Información del usuario */}
      <div className="absolute top-6 left-6 bg-black/70 p-4 rounded-xl border-2 border-[#d4af37]">
        <p className="text-white text-sm">
          👤 <span className="text-yellow-400 font-bold">{playerName}</span>
        </p>
        <p className="text-white text-xs opacity-80">{email}</p>
        <button
          onClick={handleLogout}
          className="mt-2 px-3 py-1 text-xs bg-red-800/80 text-white rounded-lg
                     border border-red-500 hover:bg-red-600 transition-all"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Botón crear partida */}
      <div className="absolute top-6 right-6">
        <button
          onClick={handleCreateRoom}
          className="px-6 py-3 bg-black/70 text-white text-xl font-bold
                     border-2 border-[#d4af37] rounded-xl
                     transition-all duration-200 hover:scale-105
                     hover:border-[#f1d87a] hover:shadow-[0_0_12px_rgba(212,175,55,0.9)]"
        >
          Crear partida
        </button>
      </div>

      {/* Lista de partidas */}
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
                    <strong>{room.name}</strong> — Host:{" "}
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