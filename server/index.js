var express = require("express")
var World = require("./world");
var worldTimer = new World(30);
var app = express();
var server = app.listen(process.env.PORT || 3000);
var io = require("socket.io")(server);

app.use(express.static(__dirname + "/../client/src"));

var positions = {};
var shurikenPositions = {};

io.on("connection", function(socket){
  socket.emit("start", {id : socket.id, positions: positions});
  socket.on("disconnect", function() {
    delete positions[socket.id];
    socket.broadcast.emit("leave", socket.id);
  });
  socket.on("animation", function(animation) {
    socket.broadcast.emit("animation", {
      id: socket.id,
      animation : animation
    });
  });
  socket.on("operation", function(operation) {
    socket.broadcast.emit("operation", {
      id: socket.id,
      operation : operation
    });
  });
  socket.on("score", function(score) {
    io.emit("score", score);
  });
});
