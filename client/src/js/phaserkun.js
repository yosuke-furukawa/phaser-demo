(function () {
  'use strict';

  var Phaserkun = function() {};
  var platforms;
  var player;
  var stars;
  var alivedStarCount = 10;
  var score = 0;
  var scoreText;
  var timeText;
  var startTime;
  var otherPlayers = {};
  var socket;
  Phaserkun.prototype = {
    
    preload: function () {
      this.game.load.image('sky', 'assets/sky.png');
      this.game.load.image('ground', 'assets/platform.png');
      this.game.load.image('star', 'assets/star.png');
      this.game.load.spritesheet('hato', 'assets/hato.png', 24, 30);
    },

    setupPlayer: function() {
      var player = this.game.add.sprite(32, this.game.world.height - 150, 'hato');
      player.anchor.setTo(0.5, 0.5);
      this.game.physics.arcade.enable(player);
      player.animations.add('stop', [0, 0, 0, 0, 0, 1], 2, true);
      player.animations.add('run',  [5, 6, 7, 8], 10, true);
      player.animations.add('jump', [13, 14, 15, 16], 10, true);
      return player;
    }, 

    create: function () {
      this.cursors = this.game.input.keyboard.createCursorKeys();
      //  We're going to be using physics, so enable the Arcade Physics system
      this.game.physics.startSystem(Phaser.Physics.ARCADE);

      //  A simple background for our game
      this.game.add.sprite(0, 0, 'sky');

      //  The platforms group contains the ground and the 2 ledges we can jump on
      platforms = this.game.add.group();

      //  We will enable physics for any object that is created in this group
      platforms.enableBody = true;

      // Here we create the ground.
      var ground = platforms.create(0, this.game.world.height - 64, 'ground');

      //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
      ground.scale.setTo(2, 2);

      //  This stops it from falling away when you jump on it
      ground.body.immovable = true;

      //  Now let's create two ledges
      var ledge = platforms.create(400, 400, 'ground');

      ledge.body.immovable = true;

      ledge = platforms.create(-150, 250, 'ground');

      ledge.body.immovable = true;

      startTime = Date.now();

      
      stars = this.game.add.group();

      stars.enableBody = true;
      player = this.setupPlayer();
      player.body.bounce.y  = 0;
      player.body.gravity.y = 300;
      player.body.collideWorldBounds = true;

      //  Here we'll create 12 of them evenly spaced apart
      for (var i = 0; i < alivedStarCount; i++) {
        //  Create a star inside of the 'stars' group
        var star = stars.create(i * 70, 0, 'star');

        //  Let gravity do its thing
        star.body.gravity.y = 6;

        //  This just gives each star a slightly random bounce value
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
      }

      scoreText = this.game.add.text(16, 16, 'Score: ', { fontSize: '32px', fill: '#000' });
      timeText = this.game.add.text(this.game.world.width - 200, 16, 'Time: ', { fontSize: '32px', fill: '#000' });
      socket = io();
      socket.on("animation", function(otherPlayer){
        var other;
        if (!otherPlayers[otherPlayer.id]) {
          other = this.setupPlayer();
          otherPlayers[otherPlayer.id] = other;
        } else {
          other = otherPlayers[otherPlayer.id];
        }
        other.scale.x = otherPlayer.animation.scale_x;
        other.animations.play(otherPlayer.animation.action);
      }.bind(this));
      socket.on("position", function(otherPlayer){
        var other;
        if (!otherPlayers[otherPlayer.id]) {
          other = this.setupPlayer();
          otherPlayers[otherPlayer.id] = other;
        } else {
          other = otherPlayers[otherPlayer.id];
        }
        other.x = otherPlayer.position.x;
        other.y = otherPlayer.position.y;
      }.bind(this));
    },
    update: function() {
      this.updatePlayer(player);
      this.syncPlayer(player);
    },
    updatePlayer: function(player) {
      this.game.physics.arcade.collide(player, platforms);
      player.body.velocity.x = 0;

      if (this.cursors.left.isDown) {
        //  Move to the left
        player.scale.x = -1;
        player.body.velocity.x = -150;

        player.animations.play('run');
        socket.emit("animation", {action: "run", scale_x: player.scale.x});
      } else if (this.cursors.right.isDown) {
        player.scale.x = 1;
        //  Move to the right
        player.body.velocity.x = 150;
        player.angle = 0;

        player.animations.play('run');
        socket.emit("animation", {action: "run", scale_x: player.scale.x});
      } else if (Math.abs(player.body.velocity.y) > 15) {
        player.animations.play('jump');
        socket.emit("animation", {action: "jump", scale_x: player.scale.x});
      } else {
        player.animations.play('stop');
        socket.emit("animation", {action: "stop", scale_x: player.scale.x});
      }

      if (alivedStarCount > 0) {
        timeText.text = 'Time: ' + (Date.now() - startTime)/1000;
      }

      //  Allow the player to jump if they are touching the ground.
      if (this.cursors.up.isDown && player.body.touching.down) {
        player.body.velocity.y = -350;
        player.animations.play('jump');
        socket.emit("animation", {action: "jump", angle: player.scale.x});
      }

      this.game.physics.arcade.collide(stars, platforms);
      this.game.physics.arcade.overlap(player, stars, this.collectStar, null, this);
    },
    collectStar: function(player, star) {
      star.kill();
      alivedStarCount--;

      score += 10;
      scoreText.text = 'Score: ' + score;
    },
    syncPlayer: function(player) {
      socket.emit("position", {x: player.x, y:player.y});
    },
  };

  window['test-phaser'] = window['test-phaser'] || {};
  window['test-phaser'].Phaserkun = Phaserkun;

}());


