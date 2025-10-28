import axios from "axios";

const API_BASE = "http://localhost:8080/api/players";

export const createPlayer = async (playerName: string) => {
  return axios.post("http://localhost:8080/api/players/create", {
    playerName: playerName
  });
};

