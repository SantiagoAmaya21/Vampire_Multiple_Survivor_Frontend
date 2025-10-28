import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let client: Client | null = null;
let roomCode = "";
let playerName = "";
let callback: any = null;

export function connectWS(code: string, name: string, onStateUpdate: any) {
  roomCode = code;
  playerName = name;
  callback = onStateUpdate;

  client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    reconnectDelay: 5000,
  });

  client.onConnect = () => {
    client!.subscribe(`/topic/game/${roomCode}`, (msg) => {
      const state = JSON.parse(msg.body);
      callback(state);
    });

    sendInput(0, 0, true);
  };

  client.activate();
}

export function sendInput(x: number, y: number, facingRight: boolean) {
  if (!client || !client.connected) return;
  client.publish({
    destination: `/app/game/update/${roomCode}`,
    body: JSON.stringify({ player: playerName, x, y, facingRight })
  });
}
