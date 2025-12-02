import axios from "axios";
import {
  spawnPlayers,
  getPlayersHealth,
  getPlayerPositions,
  getNpcPositions,
  addExperience,
  getExperienceProgress,
  updatePlayerMovement,
  playerWhipAttack
} from "../gamePlay";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("gamePlay.ts", () => {
  const roomCode = "ABC123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("spawnPlayers() realiza POST y devuelve data", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { ok: true }});

    const result = await spawnPlayers(roomCode);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining(`/players/${roomCode}/spawn`),
      null,
      expect.any(Object)
    );
    expect(result).toEqual({ ok: true });
  });

  test("getPlayersHealth() obtiene vida de jugadores", async () => {
    const mockResponse = [{ playerName: "Juan", health: 100 }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

    const result = await getPlayersHealth(roomCode);
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });

  test("getPlayerPositions() obtiene posiciones", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { players: [] }});

    const result = await getPlayerPositions(roomCode);
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(result).toEqual({ players: [] });
  });

  test("getNpcPositions() obtiene NPCs", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { npcs: [{ id: 1 }] }});

    const result = await getNpcPositions(roomCode);
    expect(result).toEqual({ npcs: [{ id: 1 }] });
  });

  test("addExperience() realiza POST con amount", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    const result = await addExperience(roomCode, 50);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining(`/players/${roomCode}/experience/add?amount=50`),
      null,
      expect.any(Object)
    );
    expect(result).toEqual({ success: true });
  });

  test("getExperienceProgress() consulta progreso", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { exp: 10, level: 1 } });

    const result = await getExperienceProgress(roomCode);
    expect(result).toEqual({ exp: 10, level: 1 });
  });

  test("updatePlayerMovement() realiza PUT con params correctos", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: { moved: true } });

    const result = await updatePlayerMovement(
      roomCode,
      "Carlos",
      true,
      false,
      true,
      false
    );

    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining(`/players/${roomCode}/move`),
      null,
      expect.objectContaining({
        params: {
          playerName: "Carlos",
          arriba: true,
          abajo: false,
          izquierda: true,
          derecha: false
        }
      })
    );

    expect(result).toEqual({ moved: true });
  });

  test("playerWhipAttack() realiza POST con playerName", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { attacked: true } });

    const result = await playerWhipAttack(roomCode, "Pedro");

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining(`/players/${roomCode}/attack`),
      null,
      expect.objectContaining({
        params: { playerName: "Pedro" }
      })
    );

    expect(result).toEqual({ attacked: true });
  });
});
