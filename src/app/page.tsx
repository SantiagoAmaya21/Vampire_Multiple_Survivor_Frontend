import Image from "next/image";

export default function Home() {
  return (
    <main
        className="h-screen w-screen bg-cover bg-center"
        style={{
            backgroundImage: "url('/assets/imagen.jpg')",
        }}
      >
        <div className="flex h-full items-center justify-center">
            <h1 className="text-white text-4xl font-bold">Pulsa cualquier tecla</h1>
        </div>
    </main>
  );
}
