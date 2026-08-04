import Phaser from 'phaser'; import { Enemy, type EnemyKind } from '../entities/Enemy'; import { Player } from '../entities/Player';
import { isBossWave, pickEnemyKindForWave, waveDurationSeconds } from './spawnRules';
import type { DifficultyDefinition } from './difficulty';

const SPAWN_INTERVAL_MS = 5000;

export class Spawner {
  private wave = 0; bossSpawned = false; private waveStartedAt = 0; private nextSpawnAt = 0; private inBreak = false;
  constructor(private scene:Phaser.Scene,private enemies:Phaser.Physics.Arcade.Group,private player:Player,private difficulty?:DifficultyDefinition) {}
  start(){ this.startWave(); }
  update(_elapsed:number){
    if(this.inBreak)return;
    const now=this.scene.time.now;
    if(isBossWave(this.currentWave)){
      if(!this.bossSpawned){this.bossSpawned=true;const bosses:EnemyKind[]=['onyxia','jaina','thalnos'];const boss=bosses[Math.floor(Math.random()*bosses.length)];this.spawn(boss);this.scene.events.emit(`${boss}-start`);}
    }else if(now>=this.nextSpawnAt){this.spawnWave(10+this.wave*3);this.nextSpawnAt=now+SPAWN_INTERVAL_MS;}
    if(now-this.waveStartedAt>=this.currentWaveSeconds*1000)this.endWave();
  }
  continue(){ if(!this.inBreak)return; this.wave++; this.startWave(); }
  get currentWave(){return this.wave+1;}
  get currentWaveSeconds(){return waveDurationSeconds(this.currentWave);}
  private startWave(){this.inBreak=false;this.waveStartedAt=this.scene.time.now;this.nextSpawnAt=this.waveStartedAt;if(isBossWave(this.currentWave))this.bossSpawned=false;this.scene.events.emit('wave-start',this.currentWave,this.currentWaveSeconds);}
  private endWave(){this.inBreak=true;this.enemies.getChildren().forEach(enemy=>enemy.destroy());this.scene.events.emit('wave-break',this.currentWave,()=>this.continue());}
  private spawnWave(n:number){for(let i=0;i<n;i++)this.spawn(this.pickEnemyKind());}
  private pickEnemyKind():EnemyKind{
    return pickEnemyKindForWave(this.wave,Math.random());
  }
  spawn(kind:EnemyKind,distance=Phaser.Math.Between(430,650)){const angle=Math.random()*Math.PI*2; const e=new Enemy(this.scene,this.player.x+Math.cos(angle)*distance,this.player.y+Math.sin(angle)*distance,kind,this.difficulty); this.enemies.add(e);return e;}
}
