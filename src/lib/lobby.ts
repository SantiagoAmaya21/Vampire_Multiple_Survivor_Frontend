import axios from "axios";

const API_URL = "https://vampiremultiplesurvivors-h3gfb9gsf4bscre2.canadacentral-01.azurewebsites.net/api/rooms";

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