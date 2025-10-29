import axios from "axios";

const API_URL = "https://proyectodgsa-brauaagmf6gwhxa9.canadacentral-01.azurewebsites.net/api/rooms";

export const getAllRooms = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const joinRoom = async (roomCode: string, playerName: string) => {
  const response = await axios.post(`${API_URL}/${roomCode}/join`, null, {
    params: { playerName },
  });
  return response.data;
};

export const createRoom = async (roomName: string, hostName: string, maxPlayers = 4) => {
  const response = await axios.post(`${API_URL}/create`, {
    roomName,
    hostName,
    maxPlayers,
  });
  return response.data;
};
