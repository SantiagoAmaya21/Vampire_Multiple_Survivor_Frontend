"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  getCurrentUser,
  completeRegistration,
  loginWithAzure,
  saveUserToLocalStorage,
  checkPlayerNameAvailability
} from "@/lib/auth";
import InputPlayerName from "@/components/InputPlayerName";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser();

      if (!user.isAuthenticated) {
        // No autenticado - mostrar botón de login
        setIsAuthenticated(false);
        setIsRegistered(false);
        setLoading(false);
        return;
      }

      if (user.isRegistered && user.playerName) {
        // Usuario completamente registrado - redirigir
        saveUserToLocalStorage(user);
        router.push("/initialScreen");
      } else {
        // Autenticado pero sin registrar - mostrar formulario
        setIsAuthenticated(true);
        setIsRegistered(false);
        setEmail(user.email || "");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      setLoading(false);
    }
  };

  const handleLogin = () => {
    loginWithAzure();
  };

  const handleRegister = async () => {
    if (!playerName.trim()) {
      setError("Por favor ingresa un nombre de jugador");
      return;
    }

    setError("");
    setCheckingName(true);

    try {
      // Verificar disponibilidad
      const availability = await checkPlayerNameAvailability(playerName);

      if (!availability.available) {
        setError("Ese nombre ya está en uso, elige otro");
        setCheckingName(false);
        return;
      }

      // Completar registro
      const result = await completeRegistration(playerName);

      if (result.success) {
        saveUserToLocalStorage({
          isAuthenticated: true,
          isRegistered: true,
          userId: result.userId,
          email: result.email,
          playerName: result.playerName
        });
        router.push("/initialScreen");
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Hubo un error al registrar el nombre");
      }
    } finally {
      setCheckingName(false);
    }
  };

  if (loading) {
    return (
      <main
        className="h-screen w-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/assets/imagen.jpg')" }}
      >
        <div className="bg-black/70 p-8 rounded-2xl border-2 border-[#d4af37]">
          <p className="text-white text-xl">Cargando...</p>
        </div>
      </main>
    );
  }

  // Usuario NO autenticado - Mostrar botón de login
  if (!isAuthenticated) {
    return (
      <main
        className="h-screen w-screen bg-cover bg-center flex items-end justify-center"
        style={{ backgroundImage: "url('/assets/imagen.jpg')" }}
      >
        <div className="pb-16 flex flex-col items-center space-y-6">
          <h1
            className="text-6xl font-extrabold text-center mb-8"
            style={{
              color: "black",
              fontFamily: "'Times New Roman', serif",
              WebkitTextStroke: "3px gold",
              textShadow: "0 0 15px gold, 0 0 30px gold, 0 0 45px rgba(255,215,0,0.6)",
            }}
          >
            Vampire Multiple Survivor
          </h1>

          <button
            onClick={handleLogin}
            className="
              px-12 py-5
              text-white text-2xl font-bold
              rounded-2xl w-80
              bg-gradient-to-b from-red-700 to-red-900
              border-3 border-[#d4af37]
              shadow-[0_0_20px_rgba(212,175,55,0.9)]
              transition-all duration-300
              hover:scale-110 hover:shadow-[0_0_30px_rgba(212,175,55,1)]
              focus:outline-none focus:ring-4 focus:ring-yellow-500/60
            "
          >
            🎮 Iniciar Sesión con Microsoft
          </button>

          <p className="text-white text-center text-sm opacity-80 max-w-md">
            Inicia sesión con tu cuenta de Microsoft para jugar.<br/>
            Si es tu primera vez, crearás tu nombre de jugador después de iniciar sesión.
          </p>
        </div>
      </main>
    );
  }

  // Usuario autenticado pero SIN registro - Mostrar formulario de nombre
  return (
    <main
      className="h-screen w-screen bg-cover bg-center flex items-end justify-center"
      style={{ backgroundImage: "url('/assets/imagen.jpg')" }}
    >
      <div className="pb-16 flex flex-col items-center space-y-4">
        <div className="bg-black/80 p-6 rounded-xl border-2 border-[#d4af37] mb-4">
          <p className="text-white text-center">
            ¡Bienvenido! <span className="text-yellow-400">{email}</span>
          </p>
          <p className="text-white text-center text-sm opacity-80 mt-2">
            Elige tu nombre de jugador para continuar
          </p>
        </div>

        <InputPlayerName
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onEnter={handleRegister}
        />

        {error && (
          <div className="bg-red-900/80 border-2 border-red-500 px-4 py-2 rounded-lg">
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={!playerName.trim() || checkingName}
          className="
            mt-4 px-8 py-4
            text-white text-xl font-semibold
            rounded-2xl w-64
            bg-black/70
            border-2 border-[#d4af37]
            shadow-lg shadow-black
            transition-all duration-200
            hover:scale-105 hover:border-[#f1d87a]
            hover:shadow-[0_0_15px_rgba(212,175,55,0.8)]
            focus:outline-none focus:ring-4 focus:ring-red-700/60
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {checkingName ? "Verificando..." : "Confirmar Nombre"}
        </button>
      </div>
    </main>
  );
}