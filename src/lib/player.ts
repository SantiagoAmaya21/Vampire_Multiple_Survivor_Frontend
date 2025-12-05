import axios from "axios";

const API_BASE = "http://4.239.139.143";

export const createPlayer = async (playerName: string) => {
  return axios.post("http://4.239.139.143/api/players/create", {
    playerName: playerName
  });
};

