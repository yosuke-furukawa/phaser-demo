var collision = function(positions, myPos, socket) {
  var result = false;
  Object.keys(positions).forEach(function(key) {
    if (key !== socket.id) {
      var otherPos = positions[key];
      if (otherPos.x < myPos.x + 10 && otherPos.x > myPos.x - 10) {
        if (otherPos.y < myPos.y + 10 && otherPos.y > myPos.y - 10) {
          result = true;
          return;
        }
      }
    }
  });
  return result;
};
module.exports = collision;
