import Phaser from 'phaser'; import { Enemy, type EnemyKind } from '../entities/Enemy'; import { Player } from '../entities/Player';

const SPAWN_INTERVAL_MS = 5000;
const FIRST_WAVE_SECONDS = 20;
const WAVE_STEP_SECONDS = 5;
const MAX_WAVE_SECONDS = 50;

export class Spawner {
  private wave = 0; bossSpawned = false; private waveStartedAt = 0; private nextSpawnAt = 0; private inBreak = false;
  constructor(private scene:Phaser.Scene,private enemies:Phaser.Physics.Arcade.Group,private player:Player) {}
  start(){ this.startWave(); }
  update(elapsed:number){
    if(elapsed>=300 && !this.bossSpawned){this.bossSpawned=true;this.spawn('boss');}
    if(this.inBreak)return;
    const now=this.scene.time.now;
    if(now>=this.nextSpawnAt){this.spawnWave(10+this.wave*3);this.nextSpawnAt=now+SPAWN_INTERVAL_MS;}
    if(now-this.waveStartedAt>=this.currentWaveSeconds*1000)this.endWave();
  }
  continue(){ if(!this.inBreak)return; this.wave++; this.startWave(); }
  get currentWave(){return this.wave+1;}
  get currentWaveSeconds(){return Math.min(FIRST_WAVE_SECONDS+this.wave*WAVE_STEP_SECONDS,MAX_WAVE_SECONDS);}
  private startWave(){this.inBreak=false;this.waveStartedAt=this.scene.time.now;this.nextSpawnAt=this.waveStartedAt;this.scene.events.emit('wave-start',this.currentWave,this.currentWaveSeconds);}
  private endWave(){this.inBreak=true;this.enemies.getChildren().forEach(enemy=>enemy.destroy());this.scene.events.emit('wave-break',this.currentWave,()=>this.continue());}
  private spawnWave(n:number){for(let i=0;i<n;i++)this.spawn(this.pickEnemyKind());}
  private pickEnemyKind():EnemyKind{return this.wave>=1&&Math.random()<0.35?'swiftClaw':'wolf';}
  private spawn(kind:EnemyKind){const angle=Math.random()*Math.PI*2, distance=Phaser.Math.Between(430,650); const e=new Enemy(this.scene,this.player.x+Math.cos(angle)*distance,this.player.y+Math.sin(angle)*distance,kind); this.enemies.add(e);}
}
