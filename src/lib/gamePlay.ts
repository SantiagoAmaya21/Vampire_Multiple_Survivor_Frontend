// src/lib/gamePlay.ts
import axios from "axios";

const API_URL = "https://vampiremultiplesurvivors-h3gfb9gsf4bscre2.canadacentral-01.azurewebsites.net/api";

// Configuración para incluir credenciales
const axiosConfig = {
  withCredentials: true
};

export interface PlayerHealthDTO {
  playerName: string;
  health: number;
  maxHealth: number;
  alive: boolean;
}

export interface PlayerPositionDTO {
  name: string;
  x: number;
  y: number;
}

export interface NpcDTO {
  id: number;
  x: number;
  y: number;
  health: number;
}

export interface ChestDTO {
  id: number;
  x: number;
  y: number;
  opened: boolean;
}

// Spawnear jugadores al iniciar la partida
export async function spawnPlayers(roomCode: string) {
  const response = await axios.post(
    `${API_URL}/players/${roomCode}/spawn`,
    null,
    axiosConfig
  );
  return response.data;
}

// Obtener vida de los jugadores
export async function getPlayersHealth(roomCode: string): Promise<PlayerHealthDTO[]> {
  const response = await axios.get(
    `${API_URL}/players/${roomCode}/health`,
    axiosConfig
  );
  return response.data;
}

// Obtener posiciones de los jugadores
export async function getPlayerPositions(roomCode: string) {
  const response = await axios.get(
    `${API_URL}/players/${roomCode}/positions`,
    axiosConfig
  );
  return response.data;
}

// Obtener posiciones de NPCs
export async function getNpcPositions(roomCode: string): Promise<{ npcs: NpcDTO[] }> {
  const response = await axios.get(
    `${API_URL}/players/${roomCode}/npcs`,
    axiosConfig
  );
  return response.data;
}

// Añadir experiencia
export async function addExperience(roomCode: string, amount: number) {
  const response = await axios.post(
    `${API_URL}/players/${roomCode}/experience/add?amount=${amount}`,
    null,
    axiosConfig
  );
  return response.data;
}

// Obtener progreso de experiencia
export async function getExperienceProgress(roomCode: string) {
  const response = await axios.get(
    `${API_URL}/players/${roomCode}/experience/progress`,
    axiosConfig
  );
  return response.data;
}

// Actualizar movimiento del jugador
export async function updatePlayerMovement(
  roomCode: string,
  playerName: string,
  arriba: boolean,
  abajo: boolean,
  izquierda: boolean,
  derecha: boolean
) {
  const response = await axios.put(
    `${API_URL}/players/${roomCode}/move`,
    null,
    {
      ...axiosConfig,
      params: { playerName, arriba, abajo, izquierda, derecha }
    }
  );
  return response.data;
}

// Atacar con el látigo
export async function playerWhipAttack(roomCode: string, playerName: string) {
  const response = await axios.post(
    `${API_URL}/players/${roomCode}/attack`,
    null,
    {
      ...axiosConfig,
      params: { playerName }
    }
  );
  return response.data;
}