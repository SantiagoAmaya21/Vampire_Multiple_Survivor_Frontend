/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import InitialScreen from "@/app/initialScreen/page";
import { getAllRooms, joinRoom, createRoom } from "@/lib/gameRoom";
import { getCurrentUser, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
}));

jest.mock("@/lib/gameRoom", () => ({
  getAllRooms: jest.fn(),
  joinRoom: jest.fn(),
  createRoom: jest.fn(),
}));

const mockPush = jest.fn();
const mockLocalStorage: { [key: string]: string } = {};

describe("InitialScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
        }),
      },
      writable: true,
    });

    // Mock window.alert
    global.alert = jest.fn();
  });

  test("muestra 'Cargando...' mientras se verifica la autenticación", async () => {
    (getCurrentUser as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                isAuthenticated: true,
                isRegistered: true,
                playerName: "TestPlayer",
                email: "test@test.com",
                userId: 1,
              }),
            100
          )
        )
    );

    (getAllRooms as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<InitialScreen />);
    });

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  test("redirige a '/' si el usuario no está autenticado", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: false,
      isRegistered: false,
    });

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("redirige a '/' si el usuario no está registrado", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: false,
      email: "test@test.com",
    });

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("redirige a '/' si el usuario no tiene playerName", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: null,
      email: "test@test.com",
    });

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("muestra información del usuario autenticado", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "JugadorTest",
      email: "jugador@test.com",
      userId: 42,
    });

    (getAllRooms as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText("JugadorTest")).toBeInTheDocument();
      expect(screen.getByText("jugador@test.com")).toBeInTheDocument();
    });
  });

  test("guarda el usuario en localStorage después de autenticarse", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "SavedPlayer",
      email: "saved@test.com",
      userId: 123,
    });

    (getAllRooms as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "player",
        JSON.stringify({
          playerName: "SavedPlayer",
          email: "saved@test.com",
          userId: 123,
        })
      );
    });
  });

  test("muestra mensaje cuando no hay partidas disponibles", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Player1",
      email: "player@test.com",
      userId: 1,
    });

    (getAllRooms as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("No hay partidas por ahora...")
      ).toBeInTheDocument();
    });
  });

  test("muestra lista de partidas disponibles", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Player1",
      email: "player@test.com",
      userId: 1,
    });

    const mockRooms = [
      {
        id: 1,
        roomCode: "ABC123",
        name: "Sala de prueba",
        gameStarted: false,
        maxPlayers: 4,
        players: [{ id: 1, playerName: "Host1", ready: true, host: true }],
      },
      {
        id: 2,
        roomCode: "XYZ789",
        name: "Otra sala",
        gameStarted: false,
        maxPlayers: 4,
        players: [{ id: 2, playerName: "Host2", ready: false, host: true }],
      },
    ];

    (getAllRooms as jest.Mock).mockResolvedValue(mockRooms);

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText("Sala de prueba")).toBeInTheDocument();
      expect(screen.getByText("Otra sala")).toBeInTheDocument();
      expect(screen.getByText(/Host1/)).toBeInTheDocument();
      expect(screen.getByText(/Host2/)).toBeInTheDocument();
    });
  });

  test("filtra las partidas que ya empezaron", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Player1",
      email: "player@test.com",
      userId: 1,
    });

    const mockRooms = [
      {
        id: 1,
        roomCode: "ABC123",
        name: "Sala disponible",
        gameStarted: false,
        maxPlayers: 4,
        players: [{ id: 1, playerName: "Host1", ready: true, host: true }],
      },
      {
        id: 2,
        roomCode: "XYZ789",
        name: "Sala iniciada",
        gameStarted: true,
        maxPlayers: 4,
        players: [{ id: 2, playerName: "Host2", ready: false, host: true }],
      },
    ];

    (getAllRooms as jest.Mock).mockResolvedValue(mockRooms);

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Sala disponible")
      ).toBeInTheDocument();
      expect(screen.queryByText("Sala iniciada")).not.toBeInTheDocument();
    });
  });

  test("botón 'Crear partida' llama a createRoom y redirige", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Host",
      email: "host@test.com",
      userId: 1,
    });

    (getAllRooms as jest.Mock).mockResolvedValue([]);
    (createRoom as jest.Mock).mockResolvedValue({ roomCode: "NEW123" });

    await act(async () => {
      render(<InitialScreen />);
    });

    const createButton = await screen.findByText("Crear partida");

    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(createRoom).toHaveBeenCalledWith("Sala nueva", "Host");
      expect(mockPush).toHaveBeenCalledWith("/lobby/CreateGame");
    });
  });

  test("botón 'Unirse' llama a joinRoom y redirige", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Joiner",
      email: "joiner@test.com",
      userId: 2,
    });

    const mockRooms = [
      {
        id: 1,
        roomCode: "JOIN123",
        name: "Sala para unirse",
        gameStarted: false,
        maxPlayers: 4,
        players: [{ id: 1, playerName: "HostPlayer", ready: true, host: true }],
      },
    ];

    (getAllRooms as jest.Mock).mockResolvedValue(mockRooms);
    (joinRoom as jest.Mock).mockResolvedValue({});

    await act(async () => {
      render(<InitialScreen />);
    });

    const joinButton = await screen.findByText("Unirse");

    await act(async () => {
      fireEvent.click(joinButton);
    });

    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith("JOIN123", "Joiner");
      expect(mockPush).toHaveBeenCalledWith(
        "/lobby/joinGame?id=JOIN123&playerName=Joiner"
      );
    });
  });

  test("muestra alerta si falla al unirse a la sala", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Player",
      email: "player@test.com",
      userId: 1,
    });

    const mockRooms = [
      {
        id: 1,
        roomCode: "FAIL123",
        name: "Sala con error",
        gameStarted: false,
        maxPlayers: 4,
        players: [{ id: 1, playerName: "Host", ready: true, host: true }],
      },
    ];

    (getAllRooms as jest.Mock).mockResolvedValue(mockRooms);
    (joinRoom as jest.Mock).mockRejectedValue(new Error("Sala llena"));

    await act(async () => {
      render(<InitialScreen />);
    });

    const joinButton = await screen.findByText("Unirse");

    await act(async () => {
      fireEvent.click(joinButton);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("No se pudo unir a la sala");
    });
  });

  test("muestra alerta si falla al crear sala", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Host",
      email: "host@test.com",
      userId: 1,
    });

    (getAllRooms as jest.Mock).mockResolvedValue([]);

    // Mock backend error → UI mostrará el err.message
    (createRoom as jest.Mock).mockRejectedValue(new Error("Error en servidor"));

    await act(async () => {
      render(<InitialScreen />);
    });

    const createButton = await screen.findByText("Crear partida");

    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Error en servidor");
    });
  });

  test("botón 'Cerrar Sesión' llama a logout", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Player",
      email: "player@test.com",
      userId: 1,
    });

    (getAllRooms as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<InitialScreen />);
    });

    const logoutButton = await screen.findByText("Cerrar Sesión");

    await act(async () => {
      fireEvent.click(logoutButton);
    });

    expect(logout).toHaveBeenCalled();
  });

  test("actualiza la lista de salas cada 5 segundos", async () => {
    jest.useFakeTimers();

    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Player",
      email: "player@test.com",
      userId: 1,
    });

    (getAllRooms as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(getAllRooms).toHaveBeenCalledTimes(1);
    });

    // Avanzar 5 segundos
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(getAllRooms).toHaveBeenCalledTimes(2);
    });

    // Otros 5 segundos
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(getAllRooms).toHaveBeenCalledTimes(3);
    });

    jest.useRealTimers();
  });

  test("limpia el intervalo al desmontar el componente", async () => {
    jest.useFakeTimers();

    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Player",
      email: "player@test.com",
      userId: 1,
    });

    (getAllRooms as jest.Mock).mockResolvedValue([]);

    const { unmount } = await act(async () => {
      return render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(getAllRooms).toHaveBeenCalledTimes(1);
    });

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(getAllRooms).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test("maneja errores al verificar autenticación", async () => {
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error("Auth error"));

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("maneja errores al obtener las salas", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Player",
      email: "player@test.com",
      userId: 1,
    });

    (getAllRooms as jest.Mock).mockRejectedValue(new Error("Network error"));

    await act(async () => {
      render(<InitialScreen />);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching rooms:",
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
