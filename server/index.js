var express = require("express")
var collision = require("./collision");
var World = require("./world");
var worldTimer = new World(30);
var app = express();
var server = app.listen(process.env.PORT || 3000);
var io = require("socket.io")(server);

app.use(express.static(__dirname + "/../client/src"));

var positions = {};
var shurikenPositions = {};

worldTimer.tick(function(){
  var collider = collision(positions, shurikenPositions);
  if (collider) {
    delete shurikenPositions[collider.shuriken.id];
    io.emit("collision", collider);
  }
});
io.on("connection", function(socket){
  socket.emit("connect", socket.id);
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
  socket.on("position", function(position) {
    position.id = socket.id;
    positions[socket.id] = position;
    socket.broadcast.emit("position", {
      id: socket.id,
      position : position
    });
  });
  socket.on("shuriken", function(shuriken) {
    if (shuriken.age > 3000) {
      delete shurikenPositions[shuriken.id];
      return;
    }
    shurikenPositions[shuriken.id] = shuriken;
    socket.broadcast.emit("shuriken", shuriken);
  });
});
