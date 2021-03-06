(function () {
  'use strict';

  var Phaserkun = function() {};
  var platforms;
  var player;
  var shurikens;
  var stars;
  var alivedStarCount = 10;
  var score = 0;
  var scoreText;
  var timeText;
  var startTime;
  var otherPlayers = {};
  var otherShurikens = {};
  var explosions;
  var socket;
  var stopped = false;

  // TODO::プレイヤークラスに持たせる
  var usedShurikenAt = 0;

  Phaserkun.prototype = {
    
    preload: function () {
      this.game.load.image('sky', 'assets/sky.png');
      this.game.load.image('ground', 'assets/platform.png');
      this.game.load.image('star', 'assets/star.png');
      this.game.load.image('shuriken', 'assets/shuriken.png');
      this.game.load.spritesheet('hato', 'assets/hato.png', 24, 30);
    },

    setupPlayer: function() {
      var player = this.game.add.sprite(32, this.game.world.height - 150, 'hato');
      player.anchor.setTo(0.5, 0.5);
      this.game.physics.arcade.enable(player);
      player.animations.add('stop', [0, 0, 0, 0, 0, 1], 2, true);
      player.animations.add('run',  [5, 6, 7, 8], 10, true);
      player.animations.add('jump', [13, 14, 15, 16], 10, true);
      player.animations.add('collide', [19, 20, 21, 22], 10, true);
      return player;
    }, 
    createShuriken: function(x, y) {
      var shuriken = this.shurikens.create(x, y, 'shuriken');
      shuriken.anchor.setTo(0.5, 0.5);
      return shuriken;
    }, 
    create: function () {
      this.cursors = this.game.input.keyboard.createCursorKeys();
      // TODO::spaceキー対応
      //  this.cursors.space = this.game.input.keyboard.SPACEBAR;

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

      // 星関連
      stars = this.game.add.group();
      stars.enableBody = true;

      // 手裏剣
      this.shurikens = this.game.add.group();
      this.shurikens.enableBody = true;

      // プレイヤー
      player = this.setupPlayer();
      player.body.bounce.y  = 0;
      player.body.gravity.y = 500;
      player.body.collideWorldBounds = true;

      //  Here we'll create 12 of them evenly spaced apart
      for (var i = 0; i < alivedStarCount; i++) {
        //  Create a star inside of the 'stars' group
        var star = stars.create(i * 70, 0, 'star');
        //  Let gravity do its thing
        star.body.gravity.y = 6;
        //  This just gives each star a slightly random bounce value
        star.body.bounce.y = 1;
      }

      scoreText = this.game.add.text(16, 16, 'Score: ', { fontSize: '32px', fill: '#000' });
      timeText = this.game.add.text(this.game.world.width - 200, 16, 'Time: ', { fontSize: '32px', fill: '#000' });
      socket = io();
      socket.on("start", function(players){ 
        player.id = players.id;
        otherPlayers[players.id] = player;
        Object.keys(players.positions).forEach(function(otherId) {
          if (!otherPlayers[otherId]) {
            var other = this.setupPlayer();
            other.id = otherId;
            otherPlayers[otherId] = other;
          }
        }.bind(this));
      }.bind(this));
      socket.on("leave", function(id){ 
        var player = otherPlayers[id];
        if (player) player.kill();
      });
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
      socket.on("operation", function(otherPlayer){
        var other;
        if (!otherPlayers[otherPlayer.id]) {
          other = this.setupPlayer();
          otherPlayers[otherPlayer.id] = other;
        } else {
          other = otherPlayers[otherPlayer.id];
        }
        other.x = otherPlayer.operation.x;
        other.y = otherPlayer.operation.y;
        this.updatePlayer(other, otherPlayer.operation.cursors, false);
        this.updateShuriken(other, otherPlayer.operation.cursors, false);
      }.bind(this));
      socket.on("score", function(s){
        console.log(s);
        if (!s.id) {
          score += s.score;
          scoreText.text = 'Score: ' + score;
        }
        if (player.id === s.id) {
          console.log(s);
          score += s.score;
          scoreText.text = 'Score: ' + score;
        }
      }.bind(this));
    },
    update: function() {
      this.updatePlayer(player, this.cursors, true);
      this.updateShuriken(player, this.cursors, true);
    },
    updateShuriken: function(player, cursors, sync) {
   // TODO::spaceキー対応
   // if (this.cursors.space.isDown) {
      if (cursors.down.isDown) {
        if (this.time.now > usedShurikenAt + 200) {
          var shuriken = this.createShuriken();
          shuriken.x = player.x;
          shuriken.y = player.y;
          shuriken.ownerId = player.id;
          shuriken.id = Math.floor(Math.random() * 1000000);
          shuriken.body.collideWorldBounds = true;
          shuriken.body.gravity.y = 0;
          shuriken.body.velocity.x = (player.scale.x > 0) ? 250 : -250;
          shuriken.born = Date.now();
          shuriken.update = function() {
            this.age = Date.now() - this.born;
            if (this.age > 3000) this.kill();
          };
          usedShurikenAt = this.time.now;
        }
      }

    },
    updatePlayer: function(player, cursors, sync) {
      this.game.physics.arcade.collide(player, platforms);
      player.body.velocity.x = 0;

      if (cursors.left.isDown) {
        //  Move to the left
        player.scale.x = -1;
        player.body.velocity.x = -150;

        player.animations.play('run');
        if (sync) {
          socket.emit("animation", {action: "run", scale_x: player.scale.x});
        }
      } else if (cursors.right.isDown) {
        player.scale.x = 1;
        //  Move to the right
        player.body.velocity.x = 150;
        player.angle = 0;

        player.animations.play('run');
        if (sync) {
          socket.emit("animation", {action: "run", scale_x: player.scale.x});
        }
      } else if (Math.abs(player.body.velocity.y) > 15) {
        player.animations.play('jump');
        if (sync) {
          socket.emit("animation", {action: "jump", scale_x: player.scale.x});
        }
      } else {
        player.animations.play('stop');
      }

      if (alivedStarCount > 0) {
        timeText.text = 'Time: ' + (Date.now() - startTime)/1000;
      }

      //  Allow the player to jump if they are touching the ground.
      if (cursors.up.isDown && player.body.touching.down) {
        player.body.velocity.y = -450;
        player.animations.play('jump');
        if (sync) {
          socket.emit("animation", {action: "jump", angle: player.scale.x});
        }
      }
      if (sync) {
        this.syncOperation(player);
      }

      this.game.physics.arcade.collide(this.shurikens, platforms);
      this.game.physics.arcade.collide(stars, platforms);
      this.game.physics.arcade.overlap(player, stars, this.collectStar, null, this);
      this.game.physics.arcade.overlap(player, this.shurikens, this.hitShuriken, null, this);
    },
    syncOperation: function(player) {
      var cursor = {
        up : {
          isDown: this.cursors.up.isDown
        },
        left : {
          isDown: this.cursors.left.isDown
        },
        right : {
          isDown: this.cursors.right.isDown
        },
        down : {
          isDown: this.cursors.down.isDown
        },
      };
      if (this.cursors.up.isDown || this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.down.isDown) {
        socket.emit("operation", {cursors : cursor, x: player.x, y: player.y});
        stopped = false;
      } else if (!(stopped && player.body.touching.down)) {
        socket.emit("operation", {cursors : cursor, x: player.x, y: player.y});
        stopped = true;
      } else {
        // stopped...
      }
    },
    collectStar: function(player, star) {
      star.kill();
      alivedStarCount--;
      socket.emit("score", {id : player.id, score: 10});
    },
    hitShuriken: function(player, shuriken) {
      if (shuriken.ownerId != player.id) {
        shuriken.kill();
        socket.emit("score", {id : player.id, score: -10});
        socket.emit("score", {id : shuriken.ownerId, score: 10});
      }
    },
  };

  window['test-phaser'] = window['test-phaser'] || {};
  window['test-phaser'].Phaserkun = Phaserkun;

}());
