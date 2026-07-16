import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import './style.css';

new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', backgroundColor: '#080b13',
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1280, height: 720 },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [GameScene]
});
