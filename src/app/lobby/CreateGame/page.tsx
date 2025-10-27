"use client";
import { useRouter } from "next/navigation";

export default function CreateGame() {
  const router = useRouter();

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/assets/imagen.jpg')" }}
    >
      <div className="bg-black/60 border-2 border-[#d4af37] rounded-xl p-8 w-[500px] shadow-xl text-center">
        <h1 className="text-[#d4af37] text-3xl font-bold mb-6 drop-shadow-md">
          Jugadores en la partida
        </h1>

        {/* Lista temporal estática */}
        <div className="space-y-3 mb-8 text-white">
          <p> Antonio</p>
          <p> Imelda</p>
        </div>

        <button
          onClick={() => router.push("/gameScreen")}
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
      </div>
    </main>
  );
}
