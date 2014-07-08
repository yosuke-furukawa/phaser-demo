var express = require("express")
var app = express();
var server = app.listen(process.PORT || 3000);
var io = require("socket.io")(server);

console.log(__dirname + "../client/src");
app.use(express.static(__dirname + "/../client/src"));


io.on("connection", function(socket){
  socket.on("animation", function(animation) {
    socket.broadcast.emit("animation", {
      id: socket.id,
      animation : animation
    });
  });
  socket.on("position", function(position) {
    socket.broadcast.emit("position", {
      id: socket.id,
      position : position
    });
  });
});

