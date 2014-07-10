var WorldTimer = function(fps) { 
  this.fps = fps;
};

WorldTimer.prototype.tick = function(cb) {
  var timer = setTimeout(function(){
    clearTimeout(timer);
    this.tick(cb);
  }.bind(this), (1000/this.fps)|0);
  if (cb) cb();
};

module.exports = WorldTimer;
