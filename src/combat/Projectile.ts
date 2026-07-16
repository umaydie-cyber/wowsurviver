import Phaser from 'phaser';
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage: number;
  constructor(scene: Phaser.Scene,x:number,y:number,damage:number) { super(scene,x,y,'flame'); scene.add.existing(this); scene.physics.add.existing(this); this.damage=damage; this.setCircle(10).setDepth(4); }
}
