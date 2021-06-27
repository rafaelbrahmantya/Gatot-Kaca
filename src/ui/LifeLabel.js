import Phaser from "phaser";
const formatLife = (gameLife) => `Nyowo : ${gameLife}`;

export default class LifeLabel extends Phaser.GameObjects.Text {
  constructor(scene, x, y, skor, style) {
    super(scene, x, y, formatLife(skor), style);
    this.life = skor;
  }

  setLife(skor) {
    this.life = skor;
    this.setText(formatLife(this.life));
  }

  getLife() {
    return this.life;
  }

  add(points) {
    this.setLife(this.life + points);
  }

  subtract(value) {
    this.setLife(this.life - value);
  }
}
