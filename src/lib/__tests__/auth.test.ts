import axios from "axios";
import {
  getCurrentUser,
  completeRegistration,
  checkPlayerNameAvailability,
  loginWithAzure,
  logout,
  saveUserToLocalStorage,
  clearUserFromLocalStorage,
  getPlayerFromLocalStorage
} from "../auth";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("auth.ts", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.location.href = "http://localhost/";
  });

  test("getCurrentUser() retorna datos cuando la API responde", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        isAuthenticated: true,
        isRegistered: true,
        playerName: "Juan"
      }
    });

    const user = await getCurrentUser();
    expect(user.isAuthenticated).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalled();
  });

  test("getCurrentUser() retorna no autenticado si la API falla", async () => {
    mockedAxios.get.mockRejectedValue(new Error("err"));

    const user = await getCurrentUser();

    expect(user.isAuthenticated).toBe(false);
    expect(user.isRegistered).toBe(false);
  });

  test("completeRegistration() envía el nombre", async () => {
    mockedAxios.post.mockResolvedValue({ data: { ok: true } });

    const result = await completeRegistration("Juan");

    expect(result.ok).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/register"),
      { playerName: "Juan" },
      expect.any(Object)
    );
  });

  test("checkPlayerNameAvailability() devuelve disponibilidad", async () => {
    mockedAxios.get.mockResolvedValue({ data: { available: true } });

    const result = await checkPlayerNameAvailability("Juan");
    expect(result.available).toBe(true);
  });

  test("loginWithAzure() cambia window.location.href", () => {
    loginWithAzure();

    expect(window.location.href).toContain("/.auth/login/aad");
    expect(window.location.href).toContain("post_login_redirect_uri=");
  });

  test("logout() cambia window.location.href", () => {
    logout();

    expect(window.location.href).toContain("/.auth/logout");
  });

  test("saveUserToLocalStorage guarda datos", () => {
    saveUserToLocalStorage({
      playerName: "Juan",
      isAuthenticated: true
    });

    const stored = JSON.parse(localStorage.getItem("player")!);
    expect(stored.playerName).toBe("Juan");
  });

  test("clearUserFromLocalStorage elimina datos", () => {
    localStorage.setItem("player", "test");
    clearUserFromLocalStorage();
    expect(localStorage.getItem("player")).toBeNull();
  });

  test("getPlayerFromLocalStorage devuelve datos válidos", () => {
    localStorage.setItem("player", JSON.stringify({ playerName: "Juan" }));

    const data = getPlayerFromLocalStorage();
    expect(data.playerName).toBe("Juan");
  });

  test("getPlayerFromLocalStorage maneja JSON corrupto", () => {
    localStorage.setItem("player", "{INVALID JSON");

    const data = getPlayerFromLocalStorage();
    expect(data).toBeNull();
  });
});
