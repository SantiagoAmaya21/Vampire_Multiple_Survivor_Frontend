// src/lib/ws.ts
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

export function connect(
  roomCode: string,
  onState: (data: any) => void,
  onXp: (data: any) => void,
  onEvent: (data: any) => void
) {
  if (client && client.connected) return client;

  const backendWsUrl = "/api/proxy/ws-game";

  client = new Client({
    webSocketFactory: () => new SockJS(backendWsUrl),
    reconnectDelay: 5000,
    debug: () => {
      // console.log(str);
    },
    onConnect: () => {
      // Suscripciones del juego
      client!.subscribe(`/topic/game/${roomCode}/state`, (msg) => {
        if (msg.body) onState(JSON.parse(msg.body));
      });
      client!.subscribe(`/topic/game/${roomCode}/xp`, (msg) => {
        if (msg.body) onXp(JSON.parse(msg.body));
      });
      client!.subscribe(`/topic/game/${roomCode}/event`, (msg) => {
        if (msg.body) onEvent(JSON.parse(msg.body));
      });
    },
  });

  client.activate();
  return client;
}

export function sendInput(
  roomCode: string,
  movement: {
    playerName: string;
    arriba: boolean;
    abajo: boolean;
    izquierda: boolean;
    derecha: boolean;
  }
) {
  if (!client || !client.connected) return;
  client.publish({
    destination: `/app/game/${roomCode}/input`,
    body: JSON.stringify(movement),
  });
}

export function disconnect() {
  if (client) {
    client.deactivate();
    client = null;
  }
}
