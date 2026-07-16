import Phaser from 'phaser';
import { Player } from './Player';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number; damage: number; speed: number; boss: boolean;
  constructor(scene: Phaser.Scene, x: number, y: number, boss=false) {
    super(scene,x,y,boss?'boss':'wolf'); scene.add.existing(this); scene.physics.add.existing(this);
    this.boss=boss; this.hp=boss?5000:50; this.damage=boss?50:5; this.speed=boss?48:80;
    this.setCircle(boss?43:18).setDepth(3);
  }
  chase(player: Player) { this.scene.physics.moveToObject(this,player,this.speed); this.setFlipX(this.body!.velocity.x<0); }
}
