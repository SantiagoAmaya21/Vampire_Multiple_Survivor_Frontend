import { apiFetch } from "./api";

export async function getAllChests() {
  return apiFetch("/api/chests");
}

export async function getChestById(id: number) {
  return apiFetch(`/api/chests/${id}`);
}
