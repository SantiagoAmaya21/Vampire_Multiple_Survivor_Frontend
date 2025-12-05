// src/lib/auth.ts
import axios from "axios";

const BACKEND_URL = "http://4.239.139.143";
const API_URL = `${BACKEND_URL}/api/auth`;

export interface UserInfo {
  isAuthenticated: boolean;
  isRegistered: boolean;
  userId?: number;
  email?: string;
  playerName?: string;
  displayName?: string;
  azureUserId?: string;
  needsRegistration?: boolean;
}

/**
 * Configuración de axios para incluir credenciales (cookies de Azure)
 */
const axiosConfig = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
};

/**
 * Obtener información del usuario actual desde Azure EasyAuth
 * Azure automáticamente agrega las cookies y headers necesarios
 */
export async function getCurrentUser(): Promise<UserInfo> {
  try {
    const response = await axios.get(`${API_URL}/me`, axiosConfig);
    console.log("User info:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return {
      isAuthenticated: false,
      isRegistered: false,
    };
  }
}

/**
 * Completar registro con nombre de jugador
 */
export async function completeRegistration(playerName: string) {
  const response = await axios.post(
    `${API_URL}/register`,
    { playerName },
    axiosConfig
  );
  return response.data;
}

/**
 * Verificar si un nombre de jugador está disponible
 */
export async function checkPlayerNameAvailability(playerName: string) {
  const response = await axios.get(`${API_URL}/check-playername`, {
    ...axiosConfig,
    params: { playerName }
  });
  return response.data;
}

/**
 * Iniciar sesión (redirige a Azure EasyAuth)
 * Azure maneja todo el flujo de autenticación
 */
export function loginWithAzure() {
  // Redirigir a la URL de login de Azure EasyAuth
  // Azure redirigirá automáticamente de vuelta después del login
  const redirectUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${BACKEND_URL}/.auth/login/aad?post_login_redirect_uri=${redirectUrl}`;
}

/**
 * Cerrar sesión
 */
export function logout() {
  const redirectUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${BACKEND_URL}/.auth/logout?post_logout_redirect_uri=${redirectUrl}`;
}

/**
 * Guardar información del usuario en localStorage
 */
export function saveUserToLocalStorage(user: UserInfo) {
  if (user.playerName) {
    localStorage.setItem("player", JSON.stringify({
      playerName: user.playerName,
      email: user.email,
      userId: user.userId
    }));
  }
}

/**
 * Limpiar información del usuario
 */
export function clearUserFromLocalStorage() {
  localStorage.removeItem("player");
}

/**
 * Obtener información del jugador desde localStorage
 */
export function getPlayerFromLocalStorage() {
  const stored = localStorage.getItem("player");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}