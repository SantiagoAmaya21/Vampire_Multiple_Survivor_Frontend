"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { connect, sendInput, disconnect } from "@/lib/ws";
import {
  getPlayersHealth,
  getNpcPositions,
  getExperienceProgress,
  PlayerHealthDTO,
  NpcDTO,
} from "@/lib/gamePlay";

interface PlayerState {
  name: string;
  x: number;
  y: number;
  direction: "left" | "right" | "idle";
  alive: boolean;
  health: number;
  maxHealth: number;
}

interface GameState {
  players: Map<string, PlayerState>;
  npcs: NpcDTO[];
  chests: any[];
  experienceProgress: number;
  gameOver: boolean;
  victory: boolean;
}

export default function GameScreen() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [gameState, setGameState] = useState<GameState>({
    players: new Map(),
    npcs: [],
    chests: [],
    experienceProgress: 0,
    gameOver: false,
    victory: false,
  });
  const [debugInfo, setDebugInfo] = useState<string>("Inicializando...");

  const keysPressed = useRef<Set<string>>(new Set());
  const movementInterval = useRef<NodeJS.Timeout | null>(null);
  const isAlive = useRef(true);
  const lastStateUpdate = useRef<number>(Date.now());

  // Obtener roomCode y playerName
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("roomCode");

    const stored = localStorage.getItem("player");
    if (!stored || !code) {
      console.error("No hay player o roomCode");
      router.push("/");
      return;
    }

    const player = JSON.parse(stored);
    setRoomCode(code);
    setPlayerName(player.playerName);
    console.log(`Jugador: ${player.playerName} | Sala: ${code}`);
  }, [router]);

  // Inicializar juego
  useEffect(() => {
    if (!roomCode || !playerName) return;

    const initGame = async () => {
      try {
        setDebugInfo("Obteniendo estado inicial...");
        console.log("Inicializando juego...");

        const healthData = await getPlayersHealth(roomCode);
        const npcsData = await getNpcPositions(roomCode);
        const xpData = await getExperienceProgress(roomCode);

        const playersMap = new Map<string, PlayerState>();
        healthData.forEach((p: PlayerHealthDTO) => {
          const isAlive = p.alive !== undefined ? p.alive : (p.health > 0);
          const maxHp = p.maxHealth || 100;

          playersMap.set(p.playerName, {
            name: p.playerName,
            x: Math.random() * 600 + 100,
            y: Math.random() * 400 + 100,
            direction: "idle",
            alive: isAlive,
            health: p.health,
            maxHealth: maxHp,
          });
        });

        setGameState((prev) => ({
          ...prev,
          players: playersMap,
          npcs: npcsData.npcs || [],
          experienceProgress: xpData.progress || 0,
        }));

        setDebugInfo(`Juego iniciado - ${healthData.length} jugadores, ${npcsData.npcs?.length || 0} NPCs`);

        connect(
          roomCode,
          handleGameStateUpdate,
          handleXpUpdate,
          handleGameEvent
        );

      } catch (error) {
        console.error("Error inicializando juego:", error);
        setDebugInfo(`Error: ${error}`);
      }
    };

    initGame();

    return () => {
      disconnect();
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
      }
    };
  }, [roomCode, playerName]);

  useEffect(() => {
    if (!roomCode) return;

    const loadInitialChests = async () => {
      try {
        const response = await fetch(`/api/gameplay/chests/${roomCode}`);
        if (response.ok) {
          const chestsData = await response.json();
          setGameState((prev) => ({
            ...prev,
            chests: chestsData.map((c: any) => ({
              id: c.id,
              x: c.position.x,
              y: c.position.y,
              opened: !c.active
            }))
          }));
        }
      } catch (error) {
        console.error("Error cargando cofres:", error);
      }
    };

    loadInitialChests();
  }, [roomCode]);

  // Handlers de WebSocket
  const handleGameStateUpdate = useCallback((data: any) => {
    lastStateUpdate.current = Date.now();

    if (data.players) {
      const playersMap = new Map<string, PlayerState>();
      data.players.forEach((p: any) => {
        playersMap.set(p.playerName, {
          name: p.playerName,
          x: p.x || 0,
          y: p.y || 0,
          direction: p.direction || "idle",
          alive: p.alive !== undefined ? p.alive : true,
          health: p.health || 100,
          maxHealth: p.maxHealth || 100,
        });
      });

      setGameState((prev) => ({
        ...prev,
        players: playersMap,
      }));
    }

    if (data.npcs) {
      setGameState((prev) => ({
        ...prev,
        npcs: data.npcs,
      }));
    }

    setDebugInfo(`Última actualización: ${new Date().toLocaleTimeString()}`);
  }, []);

  const handleXpUpdate = useCallback((data: any) => {
    const progress = data.progress || 0;

    setGameState((prev) => ({
      ...prev,
      experienceProgress: progress,
    }));

    if (progress >= 1) {
      setGameState((prev) => ({
        ...prev,
        victory: true,
      }));
    }
  }, []);

  const handleGameEvent = useCallback((data: any) => {
    if (data.type === "PLAYER_DIED") {
      if (data.playerName === playerName) {
        isAlive.current = false;
        setDebugInfo(`Has muerto - Modo espectador`);
      }

      setGameState((prev) => {
        const newPlayers = new Map(prev.players);
        const player = newPlayers.get(data.playerName);
        if (player) {
          player.alive = false;
          player.health = 0;
          newPlayers.set(data.playerName, player);
        }
        return { ...prev, players: newPlayers };
      });
    }

    if (data.type === "NPC_KILLED") {
      setGameState((prev) => ({
        ...prev,
        npcs: prev.npcs.filter((npc) => npc.id !== data.npcId),
      }));
    }

    if (data.type === "CHEST_SPAWNED") {
      setGameState((prev) => ({
        ...prev,
        chests: [...prev.chests, {
          id: data.chestId,
          x: data.x,
          y: data.y,
          opened: false
        }]
      }));
    }

    if (data.type === "CHEST_OPENED") {
      setGameState((prev) => ({
        ...prev,
        chests: prev.chests.map((chest) =>
          chest.id === data.chestId ? { ...chest, opened: true } : chest
        ),
      }));
    }

    if (data.type === "GAME_OVER") {
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
      }));
    }

    if (data.type === "GAME_WON") {
      setGameState((prev) => ({
        ...prev,
        victory: true,
      }));
    }
  }, [playerName]);

  // Control de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAlive.current) return;
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Enviar movimiento por WebSocket
  useEffect(() => {
    if (!roomCode || !playerName) return;

    movementInterval.current = setInterval(() => {
      if (!isAlive.current) return;

      const arriba = keysPressed.current.has("w") || keysPressed.current.has("arrowup");
      const abajo = keysPressed.current.has("s") || keysPressed.current.has("arrowdown");
      const izquierda = keysPressed.current.has("a") || keysPressed.current.has("arrowleft");
      const derecha = keysPressed.current.has("d") || keysPressed.current.has("arrowright");

      if (arriba || abajo || izquierda || derecha) {
        sendInput(roomCode, { playerName, arriba, abajo, izquierda, derecha });
      }
    }, 50);

    return () => {
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
      }
    };
  }, [roomCode, playerName]);

  // Función para obtener sprite correcto
  const getPlayerSprite = (direction: string) => {
    switch(direction) {
      case "right": return "/Asstes-VampireSurvivors/knight/knight run right.gif";
      case "left": return "/Asstes-VampireSurvivors/knight/knight run left.gif";
      default: return "/Asstes-VampireSurvivors/knight/standing knight.gif";
    }
  };

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex flex-col items-center justify-between relative overflow-hidden"
      style={{
        backgroundImage: "url('/assets/WhatsApp Image 2025-10-26 at 12.25.06 PM.jpeg')",
      }}
    >
      {/* Barra de experiencia */}
      <div className="absolute top-0 w-full p-4 z-20">
        <div className="w-full bg-gray-800 h-10 rounded-full border-2 border-yellow-600 overflow-hidden shadow-lg">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-300"
            style={{ width: `${gameState.experienceProgress * 100}%` }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
            XP: {Math.round(gameState.experienceProgress * 100)}%
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="absolute top-16 right-4 bg-black/80 p-3 rounded-lg border border-blue-500 text-xs text-white max-w-xs z-20">
        <div>🎮 Sala: {roomCode}</div>
        <div>👤 Jugador: {playerName}</div>
        <div>👥 Jugadores: {gameState.players.size}</div>
        <div>👾 NPCs: {gameState.npcs.length}</div>
        <div>⭐ XP: {Math.round(gameState.experienceProgress * 100)}%</div>
        <div className="mt-2 text-yellow-400">{debugInfo}</div>
      </div>

      {/* Vida de los jugadores */}
      <div className="absolute top-16 left-4 bg-black/70 p-4 rounded-lg border-2 border-yellow-600 shadow-xl z-20">
        <h3 className="text-yellow-400 font-bold mb-3 text-lg">Jugadores</h3>
        {Array.from(gameState.players.values()).map((player) => (
          <div key={player.name} className="text-white mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={player.alive ? "font-semibold" : "line-through opacity-50"}>
                {player.name}
              </span>
              {!player.alive && <span className="text-red-500 text-xs font-bold">(MUERTO)</span>}
              {player.name === playerName && <span className="text-yellow-400 text-xs">(TÚ)</span>}
            </div>
            <div className="w-40 h-4 bg-red-900 rounded-full overflow-hidden border border-white/30">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {player.health}/{player.maxHealth} HP
            </div>
          </div>
        ))}
      </div>

      {/* ÁREA DE JUEGO CON ENTIDADES HTML */}
      <div className="flex-1 w-full flex items-center justify-center">
        <div
          className="relative"
          style={{ width: 800, height: 600 }}
        >
          {/* Renderizar jugadores como elementos HTML */}
          {Array.from(gameState.players.values()).map((player) => (
            <div
              key={player.name}
              className="absolute transition-all duration-75"
              style={{
                left: `${player.x}px`,
                top: `${player.y}px`,
                width: '80px',
                height: '80px',
                opacity: player.alive ? 1 : 0.3,
              }}
            >
              {/* GIF animado del jugador */}
              <img
                src={getPlayerSprite(player.direction)}
                alt={player.name}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Nombre */}
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-white font-bold text-sm whitespace-nowrap"
                style={{ textShadow: '2px 2px 4px black' }}
              >
                {player.name}
              </div>

              {/* Barra de vida */}
              <div className="absolute -top-4 left-0 w-full h-2 bg-black/70 rounded">
                <div
                  className="h-full bg-green-500 rounded transition-all"
                  style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}

          {/* Renderizar NPCs como elementos HTML */}
          {gameState.npcs.map((npc) => (
            <div
              key={npc.id}
              className="absolute transition-all duration-75"
              style={{
                left: `${npc.x}px`,
                top: `${npc.y}px`,
                width: '70px',
                height: '70px',
              }}
            >
              {/* GIF animado del NPC */}
              <img
                src="/Asstes-VampireSurvivors/skeleton/skeleton walking right.gif"
                alt="skeleton"
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Barra de vida */}
              <div className="absolute -top-3 left-0 w-full h-1.5 bg-black/70 rounded">
                <div
                  className="h-full bg-orange-500 rounded transition-all"
                  style={{ width: `${(npc.health / 100) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}

          {/* Renderizar cofres */}
          {gameState.chests.map((chest) => (
            <div
              key={chest.id}
              className="absolute"
              style={{
                left: `${chest.x}px`,
                top: `${chest.y}px`,
                width: '50px',
                height: '50px',
              }}
            >
              <img
                src={chest.opened
                  ? "/Asstes-VampireSurvivors/chest/Openchest.gif"
                  : "/Asstes-VampireSurvivors/chest/Chestclosed.png"
                }
                alt="chest"
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Overlay de Game Over */}
      {gameState.gameOver && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-red-900/90 p-10 rounded-xl border-4 border-red-600 text-center shadow-2xl">
            <h2 className="text-5xl font-bold text-white mb-4">¡GAME OVER!</h2>
            <p className="text-white text-xl mb-6">Todos los jugadores han muerto</p>
            <button
              onClick={() => router.push("/initialScreen")}
              className="px-8 py-4 bg-red-700 text-white font-bold text-xl rounded-lg hover:bg-red-600 transition-all"
            >
              Volver al Menú
            </button>
          </div>
        </div>
      )}

      {/* Overlay de Victoria */}
      {gameState.victory && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-yellow-600/90 p-10 rounded-xl border-4 border-yellow-400 text-center shadow-2xl">
            <h2 className="text-5xl font-bold text-white mb-4">¡VICTORIA!</h2>
            <p className="text-white text-xl mb-6">¡Han completado la barra de experiencia!</p>
            <button
              onClick={() => router.push("/initialScreen")}
              className="px-8 py-4 bg-yellow-700 text-white font-bold text-xl rounded-lg hover:bg-yellow-600 transition-all"
            >
              Volver al Menú
            </button>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="absolute bottom-20 right-4 bg-black/70 p-4 rounded-lg border-2 border-yellow-600 z-20">
        <p className="text-white font-semibold mb-1">Controles:</p>
        <p className="text-white text-sm">WASD o Flechas para mover</p>
        {!isAlive.current && (
          <p className="text-red-500 text-sm mt-2 font-bold">Has muerto - Modo espectador</p>
        )}
      </div>

      {/* Botón para salir */}
      <div className="pb-4 z-20">
        <button
          onClick={() => router.push("/initialScreen")}
          className="px-8 py-4 bg-gradient-to-b from-red-700 to-red-900 text-white text-xl font-bold rounded-xl border-2 border-black shadow-[0_0_15px_rgba(255,0,0,0.6)] hover:scale-105 transition-all duration-300"
        >
          Salir al Menú
        </button>
      </div>
    </main>
  );
}