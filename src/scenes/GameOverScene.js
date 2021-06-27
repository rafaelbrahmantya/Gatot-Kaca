import Phaser from "phaser";

var replayButton;

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("game-over-scene");
  }

  init(data) {
    this.score = data.score;
    this.backsound = undefined;
  }

  preload() {
    this.load.image("background", "images/bg_layer1.png");
    this.load.image("gameover", "images/gameover.png");
    this.load.image("replay", "images/replay.png");
  }

  create() {

    this.add.image(200, 320, "background").setScale(4);
    this.add.image(200, 315, "gameover").setScale(0.7);
    this.replayButton = this.add.image(200, 450, "replay").setScale(0.7).setInteractive();

    this.replayButton.once(
      "pointerup",
      () => {
        this.scene.start("corona-buster-scene");
      },
      this
    );

    this.add.text(100, 360, `Sekor: ${this.score}`, {
      fontSize: "30px",
      fill: "#000",
    });
  }
}
