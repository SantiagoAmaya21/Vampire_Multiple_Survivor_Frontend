// src/lib/player.ts
import axios from "axios";
const BACKEND_PROXY = "/api/proxy";
const API_URL = `${BACKEND_PROXY}/`;

export const createPlayer = async (playerName: string) => {
  return axios.post(`${API_URL}/api/players/create`, {
    playerName: playerName
  });
};

