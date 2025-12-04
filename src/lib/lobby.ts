// src/lib/lobby.ts
import axios from "axios";
const BACKEND_PROXY = "/api/proxy";
const API_URL = `${BACKEND_PROXY}/api/rooms`;

// Configuración para incluir credenciales
const axiosConfig = {
  withCredentials: true
};

export const getRoom = async (roomCode: string) => {
  const res = await axios.get(`${API_URL}/${roomCode}`, axiosConfig);
  return res.data;
};

export const getRoomByPlayer = async (playerName: string) => {
  const res = await axios.get(API_URL, axiosConfig);
  const rooms = res.data;
  return rooms.find((r: any) =>
    r.players.some((p: any) => p.playerName === playerName)
  );
};

export const startGame = async (roomCode: string) => {
  const res = await axios.put(`${API_URL}/${roomCode}/start`, null, axiosConfig);
  console.log(res.data);
  return res.data;
};