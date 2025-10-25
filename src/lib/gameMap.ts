import { apiFetch } from "./api";

export async function getGameMap(id: number) {
  return apiFetch(`/api/maps/${id}`);
}

export async function createGameMap(data: any) {
  return apiFetch("/api/maps", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
