"use client";

export default function JoinGame() {
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
        <div className="space-y-3 text-white">
          <p> Antonio</p>
          <p> Imelda</p>
        </div>

        <p className="mt-8 text-gray-300 italic">
          Esperando al host para comenzar...
        </p>
      </div>
    </main>
  );
}
