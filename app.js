const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: "*" });

const rooms = {};

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room ${roomId}`);
    if (!rooms[roomId]) {
      rooms[roomId] = new Set();
    }
    rooms[roomId].add(socket.id);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    for (const roomId in rooms) {
      if (rooms[roomId].has(socket.id)) {
        rooms[roomId].delete(socket.id);
        if (rooms[roomId].size === 0) {
          delete rooms[roomId];
        }
      }
    }
  });

  socket.on("screenshot", ({ roomId, screenshot }) => {
    const room = rooms[roomId];
    if (room) {
      for (const clientId of room) {
        if (clientId !== socket.id) {
          io.to(clientId).emit("receive-screenshot", screenshot);
        }
      }
    }
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
