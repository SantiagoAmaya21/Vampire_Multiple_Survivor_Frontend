import axios from "axios";

const API_URL = "http://localhost:8080/api/rooms";

export const getRoom = async (roomCode: string) => {
  const res = await axios.get(`${API_URL}/${roomCode}`);
  return res.data;
};

export const getRoomByPlayer = async (playerName: string) => {
  const res = await axios.get(API_URL);
  const rooms = res.data;
  return rooms.find((r: any) =>
    r.players.some((p: any) => p.playerName === playerName)
  );
};

export const startGame = async (roomCode: string) => {
  const res = await axios.put(`${API_URL}/${roomCode}/start`);
  return res.data;
};
