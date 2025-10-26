"use client";
import { useRouter } from "next/navigation";

export default function InitialScreen() {
  const router = useRouter();

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex flex-col items-center justify-between"
      style={{
        backgroundImage: "url('/assets/vampire-survivors_q9es.1280.jpg')",
      }}
    >
      {/* ====== Título principal ====== */}
      <div className="pt-20 text-center">
        <h2
          className="text-5xl font-extrabold animate-pulse"
          style={{
            color: "black",
            fontFamily: "'Times New Roman', serif",
            WebkitTextStroke: "2px gold",
            textShadow:
              "0 0 10px gold, 0 0 20px gold, 0 0 30px rgba(255,215,0,0.6)",
          }}
        >
          ¡Vampire Survivor Multiplayer!
        </h2>
      </div>

      {/* ====== Botones ====== */}
      <div className="pb-20 flex flex-col items-center space-y-8">
        {/* Botón Crear partida */}
        <button
          onClick={() => router.push("/lobby/CreaPage")}
          className="w-72 px-8 py-4 bg-gradient-to-b from-green-700 to-green-900
                     text-white text-2xl font-bold rounded-2xl border-4 border-black
                     shadow-[0_0_20px_rgba(0,0,0,0.5)]
                     hover:from-green-600 hover:to-green-800 hover:scale-105 hover:shadow-[0_0_25px_rgba(0,255,0,0.6)]
                     transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500 animate-pulse"
        >
          Crear partida
        </button>

        {/* Botón Unirse */}
        <button
          onClick={() => router.push("/lobby")}
          className="w-72 px-8 py-4 bg-gradient-to-b from-green-700 to-green-900
                     text-white text-2xl font-bold rounded-2xl border-4 border-black
                     shadow-[0_0_20px_rgba(0,0,0,0.5)]
                     hover:from-green-600 hover:to-green-800 hover:scale-105 hover:shadow-[0_0_25px_rgba(0,255,0,0.6)]
                     transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500 animate-pulse"
        >
          Unirse
        </button>
      </div>
    </main>
  );
}
