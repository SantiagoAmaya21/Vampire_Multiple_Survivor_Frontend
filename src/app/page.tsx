"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyPress = () => {
      router.push("/initialScreen");
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router]);

  return (
    <main
      className="h-screen w-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/assets/imagen.jpg')",
      }}
    >
      <div className="flex h-full items-end justify-center pb-16">
        <h1 className="text-white text-4xl font-bold blink">
          Pulsa cualquier tecla
        </h1>
      </div>
    </main>
  );
}
