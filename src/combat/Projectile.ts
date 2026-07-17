import Phaser from 'phaser';
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage: number;
  slow = 0;
  constructor(scene: Phaser.Scene,x:number,y:number,damage:number,texture='flame') { super(scene,x,y,texture); scene.add.existing(this); scene.physics.add.existing(this); this.damage=damage; this.setCircle(10).setDepth(4); }
}
