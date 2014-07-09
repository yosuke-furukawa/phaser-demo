var express = require("express")
var collision = require("./collision");
var app = express();
var server = app.listen(process.PORT || 3000);
var io = require("socket.io")(server);

console.log(__dirname + "../client/src");
app.use(express.static(__dirname + "/../client/src"));

var positions = {};

io.on("connection", function(socket){
  socket.on("animation", function(animation) {
    socket.broadcast.emit("animation", {
      id: socket.id,
      animation : animation
    });
  });
  socket.on("position", function(position) {
    positions[socket.id] = position;
    socket.broadcast.emit("position", {
      id: socket.id,
      position : position
    });
    if (collision(positions, position, socket)) {
      io.emit("collision");
    }
  });
});

