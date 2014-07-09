var collision = function(positions, shurikenPositions, ignorePosition) {
  var result = false;
  Object.keys(positions).forEach(function(peopleId) {
    if (peopleId !== ignorePosition.id) {
      Object.keys(shurikenPositions).forEach(function(shurikenId) {
        var person = positions[peopleId];
        var shuriken = shurikenPositions[shurikenId];
        if (shuriken.x < person.x + 20 && shuriken.x > person.x - 20) {
          if (shuriken.y < person.y + 20 && shuriken.y > person.y - 20) {
            result = {person: person, shuriken: shuriken};
            return;
          }
        }
      });
    }
  });
  return result;
};
module.exports = collision;
