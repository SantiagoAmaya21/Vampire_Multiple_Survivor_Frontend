import axios from "axios";
import { createPlayer } from "../player";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("createPlayer", () => {
  test("envía POST correctamente a la API", async () => {
    mockedAxios.post.mockResolvedValue({
      data: { success: true, message: "Player created" }
    });

    const result = await createPlayer("Juan");

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://4.239.139.143/api/players/create",
      { playerName: "Juan" }
    );

    expect(result.data.success).toBe(true);
  });

  test("maneja errores de Axios", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Network error"));

    await expect(createPlayer("Juan")).rejects.toThrow("Network error");
  });
});
