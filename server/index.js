var express = require("express")
var app = express();
var server = app.listen(3000);
var io = require("socket.io")(server);

console.log(__dirname + "../client/src");
app.use(express.static(__dirname + "/../client/src"));


io.on("connection", function(socket){
  socket.on("position", function(position) {
    socket.broadcast.emit("position", {
      id: socket.id,
      position : position
    });
  });
});

