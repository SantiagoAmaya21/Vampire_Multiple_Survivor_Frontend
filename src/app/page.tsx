"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex items-end justify-center"
      style={{
        backgroundImage: "url('/assets/imagen.jpg')",
      }}
    >
      <div className="pb-16 flex flex-col items-center space-y-4">
        <h1 className="text-white text-5xl font-bold drop-shadow-lg">
        </h1>

        <button
          onClick={() => router.push("/initialScreen")}
          className="mt-6 px-8 py-4 bg-green-600 text-white text-xl font-semibold rounded-2xl
                     shadow-lg transition-transform transform hover:scale-105 hover:bg-green-500
                     focus:outline-none focus:ring-4 focus:ring-green-300 animate-pulse"
        >
          Pulsa para comenzar
        </button>
      </div>
    </main>
  );
}
