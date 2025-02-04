import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let manager = null;
let client = null;
let clients = [];


wss.on("connection", (ws) => {

  ws.on("message", async (event) => {
    const message = JSON.parse(event);

    if (message.type === "connection:admin") {
      if (!manager) {
        manager = ws;
      }
    }

    if (message.type === "connection:client") {
      if (!client) {
        client = ws;
        client.send(JSON.stringify({ type: 'call:ready' }));
      } else {
        clients.push(ws);
      }
    }

    if (message.type === "offer" && manager) {
      manager.send(JSON.stringify(message));
    }

    if (message.type === "answer" && client) {
      client.send(JSON.stringify(message));
    }

    if (message.type === "candidate") {
      if (ws === client && manager) {
        manager.send(JSON.stringify(message));
      } else if (ws === manager && client) {
        client.send(JSON.stringify(message));
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    
    if (ws === manager) {
      manager = null;
      if(client) {
        client.send(JSON.stringify({
          type: "disconnect"
        }))
      }
    }

    if (ws === client) {
      client = null;
      if(manager) {
        manager.send(JSON.stringify({
          type: 'disconnect'
        }))
      }
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
