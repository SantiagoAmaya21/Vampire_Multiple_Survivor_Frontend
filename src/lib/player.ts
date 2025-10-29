import axios from "axios";

const API_BASE = "https://proyectodgsa-brauaagmf6gwhxa9.canadacentral-01.azurewebsites.net/";

export const createPlayer = async (playerName: string) => {
  return axios.post("https://proyectodgsa-brauaagmf6gwhxa9.canadacentral-01.azurewebsites.net/api/players/create", {
    playerName: playerName
  });
};

