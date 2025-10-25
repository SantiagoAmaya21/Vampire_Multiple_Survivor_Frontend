"use client";

import { useEffect, useState } from "react";
import { getAllRooms, createRoom } from "@/lib/gameRoom";

export default function LobbyPage() {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    getAllRooms()
      .then(setRooms)
      .catch(console.error);
  }, []);

  async function handleCreateRoom() {
    const newRoom = await createRoom({ name: "Nueva Sala", maxPlayers: 4 });
    setRooms([...rooms, newRoom]);
  }

  return (
    <div>
      <h1>Lobby</h1>
      <button onClick={handleCreateRoom}>Crear Sala</button>
      <ul>
        {rooms.map((r) => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ul>
    </div>
  );
}
