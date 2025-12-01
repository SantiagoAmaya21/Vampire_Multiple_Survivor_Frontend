import axios from "axios";

const API_BASE = "https://vampiremultiplesurvivors-h3gfb9gsf4bscre2.canadacentral-01.azurewebsites.net/";

export const createPlayer = async (playerName: string) => {
  return axios.post("https://vampiremultiplesurvivors-h3gfb9gsf4bscre2.canadacentral-01.azurewebsites.net/api/players/create", {
    playerName: playerName
  });
};

