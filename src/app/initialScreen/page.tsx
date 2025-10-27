"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InitialScreen() {
  const router = useRouter();

  // Esto luego lo reemplazaremos con datos reales del backend
  const [rooms] = useState([
    { id: 1, name: "Sala 1", owner: "Santiago" },
    { id: 2, name: "Sala 2", owner: "Ricardo" },
  ]);

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex flex-col"
      style={{
        backgroundImage: "url('/assets/vampire-survivors_q9es.1280.jpg')",
      }}
    >
      {/* ===== Título ===== */}
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

      {/* ===== Botón Crear Partida ===== */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => router.push("/lobby/CreateGame")}
          className="px-6 py-3 bg-black/70 text-white text-xl font-bold
                     border-2 border-[#d4af37] rounded-xl
                     transition-all duration-200 hover:scale-105
                     hover:border-[#f1d87a] hover:shadow-[0_0_12px_rgba(212,175,55,0.9)]"
        >
          Crear partida
        </button>
      </div>

      {/* ===== Lista de Partidas ===== */}
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="bg-black/60 p-6 rounded-2xl border border-[#d4af37] w-[600px]">
          <h3 className="text-center text-2xl text-white font-bold mb-4">
            Partidas disponibles
          </h3>

          {rooms.length === 0 ? (
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
                    <strong>{room.name}</strong> — {room.owner}
                  </span>
                  <button
                    onClick={() => router.push(`/lobby/joinGame?id=${room.id}`)}
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
