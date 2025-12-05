import axios from "axios";

const API_URL = "http://4.239.139.143/api/rooms";

// Configuración para incluir credenciales (cookies de Azure)
const axiosConfig = {
  withCredentials: true
};

export const getAllRooms = async () => {
  const response = await axios.get(API_URL, axiosConfig);
  return response.data;
};

export const joinRoom = async (roomCode: string, playerName: string) => {
  const response = await axios.post(
    `${API_URL}/${roomCode}/join`,
    null,
    {
      ...axiosConfig,
      params: { playerName }
    }
  );
  return response.data;
};

export const createRoom = async (roomName: string, hostName: string, maxPlayers = 4) => {
  const response = await axios.post(
    `${API_URL}/create`,
    {
      roomName,
      hostName,
      maxPlayers,
    },
    axiosConfig
  );
  return response.data;
};