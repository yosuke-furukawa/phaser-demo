var express = require("express")
var collision = require("./collision");
var app = express();
var server = app.listen(process.env.PORT || 3000);
var io = require("socket.io")(server);

app.use(express.static(__dirname + "/../client/src"));

var positions = {};
var shurikenPositions = {};

io.on("connection", function(socket){
  socket.emit("connect", socket.id);
  socket.on("disconnection", function() {
    io.emit("leave", socket.id);
  });
  socket.on("animation", function(animation) {
    socket.broadcast.emit("animation", {
      id: socket.id,
      animation : animation
    });
  });
  socket.on("position", function(position) {
    position.id = socket.id;
    positions[socket.id] = position;
    socket.broadcast.emit("position", {
      id: socket.id,
      position : position
    });
    var collider = collision(positions, shurikenPositions, socket);
    if (collider) {
      io.emit("collision", collider);
    }
  });
  socket.on("shuriken", function(shuriken) {
    shurikenPositions[shuriken.id] = shuriken;
    socket.broadcast.emit("shuriken", shuriken);
    var collider = collision(positions, shurikenPositions, socket);
    if (collider) {
      io.emit("collision", collider);
    }
  });
});



