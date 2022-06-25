require("../config/config");
const express = require("express");
const socketio = require("socket.io");
const path = require("path");
const http = require("http");
const Filter = require("bad-words");
const { generateMsg, generateLocationMsg } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New socket connection");

  socket.on("join", ({ username, room }, joinProof) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return joinProof(error);
    }
    socket.join(user.room);
    socket.emit("message", generateMsg("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMsg("Admin", `${user.username} has joined!`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    joinProof();
  });

  socket.on("sendMessage", (text, deliveryProof) => {
    const { room, username } = getUser(socket.id);
    if (room && username) {
      const filter = new Filter();
      if (filter.isProfane(text)) {
        return deliveryProof("Profanity is not allowed");
      }
      io.to(room).emit("message", generateMsg(username, text));
      deliveryProof();
    }
  });

  socket.on("shareLocation", ({ latitude, longitude }, deliveryProof) => {
    const { room, username } = getUser(socket.id);
    if (room && username) {
      io.to(room).emit(
        "locationMessage",
        generateLocationMsg(username, latitude, longitude)
      );
      deliveryProof();
    }
  });

  socket.on("disconnect", () => {
    const { username, room } = removeUser(socket.id);
    if (username && room) {
      io.to(room).emit(
        "message",
        generateMsg("Admin", `${username} has left!`)
      );
      io.to(room).emit("roomData", {
        room,
        users: getUsersInRoom(room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
