import axios from "axios";
import { getRoom, getRoomByPlayer, startGame } from "../lobby";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("roomActions.ts", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getRoom() obtiene datos correctamente", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { roomCode: "ABC123", players: [] }
    });

    const data = await getRoom("ABC123");

    expect(data.roomCode).toBe("ABC123");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/ABC123"),
      expect.any(Object)
    );
  });

  test("getRoomByPlayer() encuentra la sala por nombre del jugador", async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          roomCode: "ROOM1",
          players: [{ playerName: "Alice" }]
        },
        {
          roomCode: "ROOM2",
          players: [{ playerName: "Bob" }]
        }
      ]
    });

    const room = await getRoomByPlayer("Bob");

    expect(room.roomCode).toBe("ROOM2");
    expect(mockedAxios.get).toHaveBeenCalled();
  });

  test("getRoomByPlayer() retorna undefined si el jugador no está en ninguna sala", async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        { roomCode: "ROOM1", players: [{ playerName: "Alice" }] }
      ]
    });

    const room = await getRoomByPlayer("Charlie");
    expect(room).toBeUndefined();
  });

  test("startGame() inicia la partida correctamente", async () => {
    mockedAxios.put.mockResolvedValue({
      data: { started: true }
    });

    const res = await startGame("ABC123");

    expect(res.started).toBe(true);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining("/ABC123/start"),
      null,
      expect.any(Object)
    );
  });
});
