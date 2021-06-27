import Phaser from "phaser";
import FallingObject from "../ui/FallingObject.js";
import Laser from "../ui/Laser.js";
import ScoreLabel from "../ui/ScoreLabel.js";
import LifeLabel from "../ui/LifeLabel.js";

export default class CoronaBusterScene extends Phaser.Scene {
  constructor() {
    super("corona-buster-scene");
  }

  init() {
    this.clouds = undefined;
    this.nav_left = false;
    this.nav_right = false;
    this.shoot = false;
    this.player = undefined;
    this.speed = 150;
    this.keyboardKey = undefined;
    this.enemies = undefined;
    this.enemySpeed = 47;
    this.lasers = undefined;
    this.lastFired = 0;
    this.scoreLabel = undefined;
    this.lifeLabel = undefined;
    this.handSanitizer = undefined;
    this.backsound = undefined;
  }

  preload() {
    this.load.audio("laserSound", "sfx/sfx_laser.ogg");
    this.load.audio("destroySound", "sfx/destroy.mp3");
    this.load.audio("handsanitizerSound", "sfx/handsanitizer.mp3");
    this.load.audio("backsound", "sfx/backsound/Gamelan.mp3");

    this.load.image("background", "images/bg_layer1.jpg");
    this.load.image("cloud", "images/cloud.png");
    this.load.image("cloud2", "images/cloud2.png");
    this.load.image("enemy", "images/buto-ijo.png");
    this.load.image("explosion", "images/explosion.png");
    this.load.image("gameover", "images/gameover.png");
    this.load.image("handsanitizer", "images/handsanitizer.png");
    this.load.image("laser-bolts", "images/laser-bolts.png");
    this.load.image("left-btn", "images/left-btn.png");
    this.load.image("replay", "images/replay.png");
    this.load.image("right-btn", "images/right-btn.png");
    this.load.image("ship", "images/ship.png");
    this.load.image("shoot-btn", "images/shoot-btn.png");
  }

  create() {
    // Background
    const gameWidth = this.scale.width * 0.5;
    const gameHeight = this.scale.height * 0.5;
    this.add.image(gameWidth, gameHeight, "background").setScale(1);

    // Clouds
    this.clouds = this.physics.add
      .group({
        key: ["cloud", "cloud2"],
        repeat: 5,
      })
      .setDepth(1)
      .setAlpha(0.7);
    Phaser.Actions.RandomRectangle(
      this.clouds.getChildren(),
      this.physics.world.bounds
    );

    // createButton
    this.createButton();

    // Player
    this.player = this.createPlayer();
    this.keyboardKey = this.input.keyboard.createCursorKeys();
    this.keyboardKeyA = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );
    this.keyboardKeyD = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.D
    );
    this.keyboardKeySpace = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Virus
    this.enemies = this.physics.add.group({
      classType: FallingObject,
      maxSize: 17,
      runChildUpdate: true,
    });

    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    // Laser
    this.lasers = this.physics.add.group({
      classType: Laser,
      maxSize: 5,
      runChildUpdate: true,
    });

    this.physics.add.overlap(
      this.lasers,
      this.enemies,
      this.hitEnemy,
      undefined,
      this
    );

    // Score Label
    this.scoreLabel = this.createScoreLabel(16, 16, 0);

    // Life Label
    this.lifeLabel = this.createLifeLabel(16, 43, 3);
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.decreaseLife,
      null,
      this
    );

    // Hand sanitizer
    this.handSanitizer = this.physics.add.group({
      classType: FallingObject,
      runChildUpdate: true,
    });

    this.time.addEvent({
      delay: 10000,
      callback: this.spawnHandSanitizer,
      callbackScope: this,
      loop: true,
    });

    this.physics.add.overlap(
      this.player,
      this.handSanitizer,
      this.increaseLife,
      undefined,
      this
    );

    this.backsound = this.sound.add("backsound");
    var soundConfig = {
      loop: true,
    };
    this.backsound.play(soundConfig);
  }

  update(time) {
    // Cloud
    this.clouds.children.iterate((child) => {
      child.setVelocityY(20);

      if (child.y > this.scale.height) {
        child.x = Phaser.Math.Between(10, 400);
        child.y = child.displayHeight * -1;
      }
    });

    // Player
    this.movePlayer(this.player, time);
  }

  createButton() {
    this.input.addPointer(3);

    let shoot = this.add
      .image(320, 550, "shoot-btn")
      .setInteractive()
      .setDepth(1)
      .setAlpha(0.8)
      .setScale(0.7);
      let nav_left = this.add
      .image(50, 550, "left-btn")
      .setInteractive()
      .setDepth(1)
      .setAlpha(0.8)
      .setScale(0.7);
      let nav_right = this.add
      .image(nav_left.x + nav_left.displayWidth + 20, 550, "right-btn")
      .setInteractive()
      .setDepth(1)
      .setAlpha(0.8)
      .setScale(0.7);

    nav_left.on(
      "pointerdown",
      () => {
        this.nav_left = true;
      },
      this
    );
    nav_left.on(
      "pointerout",
      () => {
        this.nav_left = false;
      },
      this
    );
    nav_right.on(
      "pointerdown",
      () => {
        this.nav_right = true;
      },
      this
    );
    nav_right.on(
      "pointerout",
      () => {
        this.nav_right = false;
      },
      this
    );
    shoot.on(
      "pointerdown",
      () => {
        this.shoot = true;
      },
      this
    );
    shoot.on(
      "pointerout",
      () => {
        this.shoot = false;
      },
      this
    );
  }

  movePlayer(player, time) {
    if (
      this.shoot ||
      (this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        .isDown &&
        time > this.lastFired)
    ) {
      const laser = this.lasers.get(0, 0, "laser-bolts");
      console.log("Test");
      if (laser) {
        laser.fire(this.player.x, this.player.y);
        this.lastFired = time + 50;
        this.sound.play("laserSound");
      }
    }

    if (
      this.nav_left ||
      this.keyboardKey.left.isDown ||
      this.keyboardKeyA.isDown
    ) {
      this.player.setVelocityX(this.speed * -1);
      this.player.setFlipX(false);
    } else if (
      this.nav_right ||
      this.keyboardKey.right.isDown ||
      this.keyboardKeyD.isDown
    ) {
      this.player.setVelocityX(this.speed);
      this.player.setFlipX(true);
    }
     else {
      this.player.setVelocityX(0);
    }
  }

  spawnEnemy() {
    const config = {
      speed: this.enemySpeed,
      rotation: 0.04,
    };

    const enemy = this.enemies.get(0, 0, "enemy", config);
    const enemyWidth = enemy.displayWidth;
    const positionX = Phaser.Math.Between(
      enemyWidth,
      this.scale.width - enemyWidth
    );

    if (enemy) {
      enemy.spawn(positionX);
    }
  }

  spawnHandSanitizer() {
    const config = {
      speed: 60,
      rotation: 0,
    };

    const handsanitizer = this.handSanitizer.get(0, 0, "handsanitizer", config);
    this.handSanitizer;
    handsanitizer.setScale(0.5);
    const handsanitizerWidth = handsanitizer.displayWidth;
    const positionX = Phaser.Math.Between(
      handsanitizerWidth,
      this.scale.width - handsanitizerWidth
    );

    if (handsanitizer) {
      handsanitizer.spawn(positionX);
    }
  }

  createPlayer() {
    const player = this.physics.add.sprite(200, 450, "ship").setScale(0.5);
    player.setCollideWorldBounds(true);

    this.anims.create({
      key: "turn",
      frames: [{ key: "ship", frame: 0 }],
    });

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("ship", { start: 1, end: 2 }),
      frameRate: 10,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("ship", { start: 1, end: 2 }),
      frameRate: 10,
    });

    return player;
  }

  hitEnemy(laser, enemy) {
    laser.erase();
    enemy.die();
    this.sound.play("destroySound");

    this.scoreLabel.add(10);
    if (this.scoreLabel.getScore() % 50 == 0) {
      this.enemySpeed += 70;
      this.speed += 40;
    }
  }

  createScoreLabel(x, y, score) {
    const style = { fontSize: "32px", fill: "#000" };
    const label = new ScoreLabel(this, x, y, score, style).setDepth(1);

    this.add.existing(label);

    return label;
  }

  createLifeLabel(x, y, life) {
    const style = { fontSize: "32px", fill: "#000" };
    const label = new LifeLabel(this, x, y, life, style).setDepth(1);

    this.add.existing(label);

    return label;
  }

  increaseLife(player, handsanitizer) {
    handsanitizer.die();
    this.lifeLabel.add(1);

    if (this.lifeLabel.getLife() >= 3) {
      player.clearTint().setAlpha(2);
    }
    if (this.lifeLabel.getLife() >= 2) {
      player.setAlpha(1);
    }
  }

  decreaseLife(player, enemy) {
    enemy.die();
    this.lifeLabel.subtract(1);

    if (this.lifeLabel.getLife() == 2) {
      player.setTint(0xff0000);
    } else if (this.lifeLabel.getLife() == 1) {
      player.setTint(0xff0000).setAlpha(0.2);
    } else if (this.lifeLabel.getLife() == 0) {
      this.backsound.stop(this.soundConfig);

      this.scene.start("game-over-scene", {
        score: this.scoreLabel.getScore(),
      });
    }
  }
}
