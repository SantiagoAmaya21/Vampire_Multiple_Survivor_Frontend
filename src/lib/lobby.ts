// src/lib/lobby.ts
import axios from "axios";

const API_URL = "http://localhost:8080/api/rooms";

export const getRoom = async (roomCode: string) => {
  const res = await axios.get(`${API_URL}/${roomCode}`);
  return res.data;
};

export const getRoomByPlayer = async (playerName: string) => {
  // backend no tiene endpoint directo, usamos GET /api/rooms y filtramos
  const res = await axios.get(API_URL);
  const rooms = res.data as any[];
  return rooms.find((r) =>
    Array.isArray(r.players) && r.players.some((p: any) => p.playerName === playerName)
  );
};

export const toggleReady = async (roomCode: string, playerName: string) => {
  const res = await axios.put(`${API_URL}/${roomCode}/ready`, null, {
    params: { playerName },
  });
  return res.data;
};

export const startGame = async (roomCode: string) => {
  const res = await axios.put(`${API_URL}/${roomCode}/start`);
  return res.data;
};


