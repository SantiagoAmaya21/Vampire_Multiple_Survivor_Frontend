import SockJS from "sockjs-client";
import { Client, Frame } from "@stomp/stompjs";

let client: Client | null = null;
let room: string | null = null;
let playerName: string | null = null;

export function connectGame(roomCode: string, name: string, onState: (data: any) => void, onXp: (data: any) => void, onEvent: (data: any) => void) {
  room = roomCode;
  playerName = name;

  if (client && client.connected) return;

  client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws-game"),
    reconnectDelay: 3000,
    debug: () => {},
  });

  client.onConnect = () => {
    client!.subscribe(`/topic/game/${roomCode}/state`, (msg) => { if (msg.body) onState(JSON.parse(msg.body)); });
    client!.subscribe(`/topic/game/${roomCode}/xp`, (msg) => { if (msg.body) onXp(JSON.parse(msg.body)); });
    client!.subscribe(`/topic/game/${roomCode}/event`, (msg) => { if (msg.body) onEvent(JSON.parse(msg.body)); });
  };

  client.activate();
}

export function disconnectGame() { client?.deactivate(); client = null; room = null; playerName = null; }

export function sendMovement(arriba: boolean, abajo: boolean, izquierda: boolean, derecha: boolean) {
  if (!client || !client.connected || !room || !playerName) return;
  client.publish({ destination: `/app/game/${room}/input`, body: JSON.stringify({ playerName, arriba, abajo, izquierda, derecha }) });
}
