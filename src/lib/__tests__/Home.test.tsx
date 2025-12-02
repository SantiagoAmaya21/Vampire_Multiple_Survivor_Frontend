/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import Home from "@/app/page";
import {
  getCurrentUser,
  completeRegistration,
  loginWithAzure,
  saveUserToLocalStorage,
  checkPlayerNameAvailability
} from "@/lib/auth";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
  completeRegistration: jest.fn(),
  loginWithAzure: jest.fn(),
  saveUserToLocalStorage: jest.fn(),
  checkPlayerNameAvailability: jest.fn(),
}));

const mockPush = jest.fn();

describe("Home page", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  test("muestra 'Cargando...' inicialmente", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: false
    });

    await act(async () => {
      render(<Home />);
    });

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  test("usuario NO autenticado → muestra botón de login", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: false
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText("🎮 Iniciar Sesión con Microsoft")).toBeInTheDocument();
    });
  });

  test("botón de login llama loginWithAzure()", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: false
    });

    await act(async () => {
      render(<Home />);
    });

    const btn = await screen.findByText("🎮 Iniciar Sesión con Microsoft");

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(loginWithAzure).toHaveBeenCalled();
  });

  test("usuario autenticado Y registrado → redirige a /initialScreen", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: true,
      playerName: "Juan",
      email: "a@b.com",
      userId: 1
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/initialScreen");
    });
  });

  test("usuario autenticado pero NO registrado → muestra input de nombre", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: false,
      email: "test@microsoft.com"
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Elige tu nombre de jugador para continuar/)
      ).toBeInTheDocument();
    });
  });

  test("registro exitoso → guarda usuario y redirige", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: false,
      email: "player@test.com"
    });

    (checkPlayerNameAvailability as jest.Mock).mockResolvedValue({
      available: true
    });

    (completeRegistration as jest.Mock).mockResolvedValue({
      success: true,
      userId: 99,
      email: "player@test.com",
      playerName: "NuevoJugador"
    });

    await act(async () => {
      render(<Home />);
    });

    const input = await screen.findByRole("textbox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "NuevoJugador" } });
    });

    const btn = screen.getByText("Confirmar Nombre");

    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(saveUserToLocalStorage).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/initialScreen");
    });
  });

  test("si el nombre NO está disponible → muestra error", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: false,
      email: "test@test.com"
    });

    (checkPlayerNameAvailability as jest.Mock).mockResolvedValue({
      available: false
    });

    await act(async () => {
      render(<Home />);
    });

    const input = await screen.findByRole("textbox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Juan" } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Confirmar Nombre"));
    });

    await waitFor(() => {
      expect(screen.getByText("Ese nombre ya está en uso, elige otro")).toBeInTheDocument();
    });
  });

  test("si completeRegistration falla → muestra mensaje de error", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isRegistered: false,
      email: "test@test.com"
    });

    (checkPlayerNameAvailability as jest.Mock).mockResolvedValue({
      available: true
    });

    (completeRegistration as jest.Mock).mockRejectedValue({
      response: { data: { error: "Nombre inválido" } }
    });

    await act(async () => {
      render(<Home />);
    });

    const input = await screen.findByRole("textbox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Invalido" } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Confirmar Nombre"));
    });

    await waitFor(() => {
      expect(screen.getByText("Nombre inválido")).toBeInTheDocument();
    });
  });
});