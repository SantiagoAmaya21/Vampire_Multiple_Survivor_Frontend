import { apiFetch } from "./api";

export async function createRoom(data: any) {
  return apiFetch("/api/rooms/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAllRooms() {
  return apiFetch("/api/rooms");
}

export async function joinRoom(roomCode: string, playerName: string) {
  return apiFetch(`/api/rooms/${roomCode}/join?playerName=${playerName}`, {
    method: "POST",
  });
}
