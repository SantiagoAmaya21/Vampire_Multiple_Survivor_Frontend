// src/lib/__tests__/rooms.test.ts
import axios from "axios";
import { getAllRooms, joinRoom, createRoom } from "../gameRoom"; // <- ajustado al nombre rooms.ts

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("rooms.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getAllRooms() obtiene lista de salas", async () => {
    const mockData = [
      { roomCode: "AAA", players: 2 },
      { roomCode: "BBB", players: 4 }
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const result = await getAllRooms();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("api/rooms"),
      expect.any(Object)
    );

    expect(result).toEqual(mockData);
  });

  test("joinRoom() realiza POST y devuelve data", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { joined: true } });

    const result = await joinRoom("ABC123", "Juan");

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/ABC123/join"),
      null,
      expect.objectContaining({
        params: { playerName: "Juan" }
      })
    );

    expect(result).toEqual({ joined: true });
  });

  test("createRoom() crea una sala y devuelve data", async () => {
    const mockResponse = { roomCode: "XYZ123", roomName: "MiSala" };

    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await createRoom("MiSala", "Carlos", 4);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/create"),
      {
        roomName: "MiSala",
        hostName: "Carlos",
        maxPlayers: 4
      },
      expect.any(Object)
    );

    expect(result).toEqual(mockResponse);
  });
});
