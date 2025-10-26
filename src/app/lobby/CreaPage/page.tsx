"use client";

import { useEffect, useState } from "react";
import { getAllRooms, createRoom } from "@/lib/gameRoom";

export default function CrePage() {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    getAllRooms()
      .then(setRooms)
      .catch(console.error);
  }, []);

  async function handleCreateRoom() {
    try {
      const newRoom = await createRoom({ name: "Nueva Sala", maxPlayers: 4 });
      setRooms([...rooms, newRoom]);
    } catch (err) {
      console.error("Error creando sala:", err);
    }
  }

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex flex-col items-center justify-between"
      style={{
        backgroundImage:
          "url('/assets/170f8c3d-45c8-43c8-a598-2914faba1361.jpg')",
      }}
    >
      {/* ====== Título superior ====== */}
      <div className="pt-20 text-center">
        <h1
          className="text-5xl font-extrabold text-white animate-pulse"
          style={{
            fontFamily: "'Times New Roman', serif",
            WebkitTextStroke: "2px black",
            textShadow:
              "0 0 10px gold, 0 0 20px gold, 0 0 40px rgba(255,215,0,0.8)",
          }}
        >
          Pantalla de Creación de Partida
        </h1>
      </div>

      {/* ====== Contenedor inferior ====== */}
      <div className="pb-16 flex flex-col items-center space-y-8 w-full max-w-md">
        {/* Botón crear sala */}
        <button
          onClick={handleCreateRoom}
          className="w-72 px-8 py-4 bg-gradient-to-b from-yellow-600 to-yellow-800
                     text-white text-2xl font-bold rounded-2xl shadow-[0_0_20px_rgba(255,215,0,0.5)]
                     hover:from-yellow-500 hover:to-yellow-700 hover:scale-105 transition-all duration-300
                     focus:outline-none focus:ring-4 focus:ring-yellow-300"
        >
          Crear Sala
        </button>

        {/* Lista de salas */}
        <ul className="bg-black/60 rounded-xl p-6 w-full max-h-64 overflow-y-auto text-white text-lg space-y-2 shadow-lg">
          {rooms.length === 0 ? (
            <li className="text-center text-gray-300 italic">
              No hay salas disponibles
            </li>
          ) : (
            rooms.map((r) => (
              <li
                key={r.id}
                className="border-b border-gray-500 py-2 hover:text-yellow-300 transition-colors"
              >
                {r.name}
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}
