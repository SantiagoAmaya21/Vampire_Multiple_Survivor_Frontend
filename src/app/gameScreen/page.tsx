"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { connect, sendInput, disconnect } from "@/lib/ws";
import {
  spawnPlayers,
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const movementInterval = useRef<NodeJS.Timeout | null>(null);
  const isAlive = useRef(true);
  const lastStateUpdate = useRef<number>(Date.now());

  // Assets
  const images = useRef<{ [key: string]: HTMLImageElement }>({});

  // Cargar imágenes
  useEffect(() => {
    const loadImage = (key: string, src: string) => {
      const img = new Image();
      img.src = src;
      img.onload = () => console.log(`Imagen cargada: ${key}`);
      img.onerror = () => console.error(`Error cargando: ${key} - ${src}`);
      images.current[key] = img;
    };

    loadImage("knightRight", "/Asstes-VampireSurvivors/knight/knight run right.gif");
    loadImage("knightLeft", "/Asstes-VampireSurvivors/knight/knight run left.gif");
    loadImage("knightIdle", "/Asstes-VampireSurvivors/knight/standing knight.gif");
    loadImage("skeletonRight", "/Asstes-VampireSurvivors/skeleton/skeleton walking right.gif");
    loadImage("skeletonLeft", "/Asstes-VampireSurvivors/skeleton/skeleton walking left.gif");
    loadImage("chestClosed", "/Asstes-VampireSurvivors/chest/Chestclosed.png");
    loadImage("chestOpen", "/Asstes-VampireSurvivors/chest/Openchest.gif");
  }, []);

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

        // NO llamar a spawnPlayers aquí - ya se llamó en startGame()

        // Obtener estado inicial
        setDebugInfo("Obteniendo estado inicial...");
        const healthData = await getPlayersHealth(roomCode);

        const npcsData = await getNpcPositions(roomCode);
        console.log("NPCs:", npcsData.npcs.length);

        const xpData = await getExperienceProgress(roomCode);
        console.log("XP inicial:", xpData.progress);

        // Actualizar estado con jugadores
        const playersMap = new Map<string, PlayerState>();
        healthData.forEach((p: PlayerHealthDTO) => {
          // Si alive/maxHealth son undefined, asumir que están vivos
          const isAlive = p.alive !== undefined ? p.alive : (p.health > 0);
          const maxHp = p.maxHealth || 100;

          console.log(`Jugador: ${p.playerName} - Vida: ${p.health}/${maxHp} - Vivo: ${isAlive}`);
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

        // Conectar WebSocket
        console.log("Conectando WebSocket...");
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

  // Handlers de WebSocket
  const handleGameStateUpdate = useCallback((data: any) => {
    console.log("📡 Estado del juego actualizado:", data);
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
    console.log("XP actualizada:", data);
    const progress = data.progress || 0;

    setGameState((prev) => ({
      ...prev,
      experienceProgress: progress,
    }));

    // Verificar victoria
    if (progress >= 1) {
      console.log("¡VICTORIA!");
      setGameState((prev) => ({
        ...prev,
        victory: true,
      }));
    }
  }, []);

  const handleGameEvent = useCallback((data: any) => {
    console.log("Evento de juego:", data);

    if (data.type === "PLAYER_DIED") {
      console.log(`${data.playerName} ha muerto`);
      if (data.playerName === playerName) {
        isAlive.current = false;
        setDebugInfo(`Has muerto - Modo espectador`);
      }

      // Actualizar estado del jugador
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
      console.log(`👾 NPC ${data.npcId} eliminado`);
      setGameState((prev) => ({
        ...prev,
        npcs: prev.npcs.filter((npc) => npc.id !== data.npcId),
      }));
    }

    if (data.type === "CHEST_OPENED") {
      console.log(`Cofre ${data.chestId} abierto`);
      setGameState((prev) => ({
        ...prev,
        chests: prev.chests.map((chest) =>
          chest.id === data.chestId ? { ...chest, opened: true } : chest
        ),
      }));
    }

    if (data.type === "GAME_OVER") {
      console.log("GAME OVER");
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
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

    // Solo enviar movimiento si el jugador está vivo
    movementInterval.current = setInterval(() => {
      if (!isAlive.current) return; // Importante: verificar dentro del interval

      const arriba = keysPressed.current.has("w") || keysPressed.current.has("arrowup");
      const abajo = keysPressed.current.has("s") || keysPressed.current.has("arrowdown");
      const izquierda = keysPressed.current.has("a") || keysPressed.current.has("arrowleft");
      const derecha = keysPressed.current.has("d") || keysPressed.current.has("arrowright");

      if (arriba || abajo || izquierda || derecha) {
        console.log("Enviando movimiento:", { arriba, abajo, izquierda, derecha });
        sendInput(roomCode, { playerName, arriba, abajo, izquierda, derecha });
      }
    }, 50);

    return () => {
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
      }
    };
  }, [roomCode, playerName]);

  // Renderizar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fondo semi-transparente para ver mejor
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar jugadores (más grandes)
      gameState.players.forEach((player) => {
        const size = 80; // Tamaño aumentado
        let img: HTMLImageElement | undefined;

        if (!player.alive) {
          ctx.globalAlpha = 0.3; // Jugadores muertos semi-transparentes
        }

        if (player.direction === "right") {
          img = images.current.knightRight;
        } else if (player.direction === "left") {
          img = images.current.knightLeft;
        } else {
          img = images.current.knightIdle;
        }

        if (img && img.complete) {
          ctx.drawImage(img, player.x, player.y, size, size);
        } else {
          // Fallback: rectángulo azul
          ctx.fillStyle = player.alive ? "blue" : "gray";
          ctx.fillRect(player.x, player.y, size, size);
        }

        ctx.globalAlpha = 1.0; // Restaurar opacidad

        // Nombre del jugador
        ctx.fillStyle = player.alive ? "white" : "red";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(player.name, player.x + size / 2, player.y - 20);

        // Barra de vida sobre el jugador
        const barWidth = size;
        const barHeight = 8;
        const healthPercent = player.health / player.maxHealth;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(player.x, player.y - 12, barWidth, barHeight);

        ctx.fillStyle = "red";
        ctx.fillRect(player.x, player.y - 12, barWidth, barHeight);

        ctx.fillStyle = "green";
        ctx.fillRect(player.x, player.y - 12, barWidth * healthPercent, barHeight);
      });

      // Dibujar NPCs (más grandes)
      gameState.npcs.forEach((npc) => {
        const size = 70;
        const img = images.current.skeletonRight;

        if (img && img.complete) {
          ctx.drawImage(img, npc.x, npc.y, size, size);
        } else {
          // Fallback: rectángulo rojo
          ctx.fillStyle = "red";
          ctx.fillRect(npc.x, npc.y, size, size);
        }

        // Barra de vida del NPC
        const barWidth = size;
        const barHeight = 6;
        const healthPercent = npc.health / 100; // Asumiendo 100 HP max

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(npc.x, npc.y - 10, barWidth, barHeight);

        ctx.fillStyle = "darkred";
        ctx.fillRect(npc.x, npc.y - 10, barWidth, barHeight);

        ctx.fillStyle = "orange";
        ctx.fillRect(npc.x, npc.y - 10, barWidth * healthPercent, barHeight);
      });

      // Dibujar cofres
      gameState.chests.forEach((chest) => {
        const size = 50;
        const img = chest.opened ? images.current.chestOpen : images.current.chestClosed;

        if (img && img.complete) {
          ctx.drawImage(img, chest.x, chest.y, size, size);
        } else {
          ctx.fillStyle = chest.opened ? "gold" : "brown";
          ctx.fillRect(chest.x, chest.y, size, size);
        }
      });

      requestAnimationFrame(render);
    };

    render();
  }, [gameState]);

  // Verificar si todos los jugadores han muerto
  useEffect(() => {
    const allDead = Array.from(gameState.players.values()).every((p) => !p.alive);
    if (allDead && gameState.players.size > 0 && !gameState.gameOver) {
      console.log("Todos los jugadores han muerto");
      setGameState((prev) => ({ ...prev, gameOver: true }));
    }
  }, [gameState.players, gameState.gameOver]);

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex flex-col items-center justify-between relative"
      style={{
        backgroundImage: "url('/assets/WhatsApp Image 2025-10-26 at 12.25.06 PM.jpeg')",
      }}
    >
      {/* Barra de experiencia */}
      <div className="absolute top-0 w-full p-4">
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
      <div className="absolute top-16 right-4 bg-black/80 p-3 rounded-lg border border-blue-500 text-xs text-white max-w-xs">
        <div>🎮 Sala: {roomCode}</div>
        <div>👤 Jugador: {playerName}</div>
        <div>👥 Jugadores: {gameState.players.size}</div>
        <div>👾 NPCs: {gameState.npcs.length}</div>
        <div>⭐ XP: {Math.round(gameState.experienceProgress * 100)}%</div>
        <div className="mt-2 text-yellow-400">{debugInfo}</div>
      </div>

      {/* Vida de los jugadores - esquina superior izquierda */}
      <div className="absolute top-16 left-4 bg-black/70 p-4 rounded-lg border-2 border-yellow-600 shadow-xl">
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

      {/* Canvas del juego */}
      <div className="flex-1 w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-yellow-600 rounded-xl shadow-[0_0_30px_rgba(255,215,0,0.5)] bg-black/50"
        ></canvas>
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
      <div className="absolute bottom-20 right-4 bg-black/70 p-4 rounded-lg border-2 border-yellow-600">
        <p className="text-white font-semibold mb-1">Controles:</p>
        <p className="text-white text-sm">WASD o Flechas para mover</p>
        {!isAlive.current && (
          <p className="text-red-500 text-sm mt-2 font-bold">Has muerto - Modo espectador</p>
        )}
      </div>

      {/* Botón para salir */}
      <div className="pb-4">
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