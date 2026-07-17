import Phaser from 'phaser';
import { Player } from '../entities/Player';
import type { Upgrade } from '../systems/LevelSystem';
import { CLASSES, type ClassId } from '../classes';
import { formatTime } from '../systems/progression';

function createChoiceOverlay(kind: 'class' | 'upgrade', title: string, subtitle: string) {
  const overlay = document.createElement('section');
  overlay.className = `choice-overlay choice-overlay--${kind}`;
  overlay.setAttribute('aria-label', title);

  const heading = document.createElement('h1');
  heading.textContent = title;
  const description = document.createElement('p');
  description.className = 'choice-overlay__subtitle';
  description.textContent = subtitle;
  const cards = document.createElement('div');
  cards.className = 'choice-overlay__cards';
  overlay.append(heading, description, cards);
  document.querySelector('#game')!.append(overlay);
  return { overlay, cards };
}

export function showClassSelection(scene: Phaser.Scene, pick: (id: ClassId) => void) {
  const { overlay, cards } = createChoiceOverlay(
    'class',
    '选择你的职业',
    '职业决定初始技能、成长词条与整局玩法',
  );
  let selected = false;

  CLASSES.forEach(definition => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'choice-card';
    card.style.setProperty('--card-color', `#${definition.color.toString(16).padStart(6, '0')}`);
    card.innerHTML = `<span class="choice-card__icon">${definition.skill.slice(0, 1)}</span>
      <strong>${definition.name}</strong>
      <span class="choice-card__skill">初始技能 · ${definition.skill}</span>
      <span class="choice-card__description">${definition.fantasy}</span>`;
    card.addEventListener('click', () => {
      if (selected) return;
      selected = true;
      card.classList.add('choice-card--selected');
      cards.querySelectorAll('button').forEach(button => { button.disabled = true; });
      window.setTimeout(() => {
        overlay.remove();
        pick(definition.id);
      }, 80);
    });
    cards.append(card);
  });

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => overlay.remove());
}

export class GameUI {
  private hp!: Phaser.GameObjects.Text;
  private level!: Phaser.GameObjects.Text;
  private timer!: Phaser.GameObjects.Text;
  private rage!: Phaser.GameObjects.Text;
  private xpFill!: Phaser.GameObjects.Rectangle;
  private upgradeOverlay?: HTMLElement;

  constructor(private scene: Phaser.Scene, private player: Player, private classId: ClassId) {
    this.create();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hideUpgrades());
  }

  private create() {
    const w = this.scene.scale.width;
    const definition = CLASSES.find(candidate => candidate.id === this.classId)!;
    this.scene.add.rectangle(w / 2, 35, Math.min(w - 32, 860), 54, 0x090d17, .88).setScrollFactor(0).setDepth(20).setStrokeStyle(1, definition.color);
    this.hp = this.scene.add.text(w / 2 - 390, 26, '', { fontSize: '15px', color: '#f4d58a' }).setScrollFactor(0).setDepth(21);
    this.level = this.scene.add.text(w / 2 - 205, 26, '', { fontSize: '15px', color: '#fff' }).setScrollFactor(0).setDepth(21);
    this.rage = this.scene.add.text(w / 2 - 65, 26, '', { fontSize: '15px', color: '#ff884d' }).setScrollFactor(0).setDepth(21).setVisible(this.classId === 'berserker');
    this.timer = this.scene.add.text(w / 2 + 325, 26, '', { fontFamily: 'Marcellus', fontSize: '17px', color: '#f4d58a' }).setScrollFactor(0).setDepth(21);
    this.scene.add.text(w / 2, 108, `${definition.name}  |  ${definition.skill}自动释放`, { fontSize: '13px', color: '#d6a85d' }).setOrigin(.5).setScrollFactor(0).setDepth(21);
    this.scene.add.rectangle(w / 2, 78, Math.min(w - 50, 650), 8, 0x1d2638).setScrollFactor(0).setDepth(20);
    this.xpFill = this.scene.add.rectangle(w / 2 - Math.min(w - 50, 650) / 2, 78, 1, 8, 0x39d0e7).setOrigin(0, .5).setScrollFactor(0).setDepth(21);
  }

  update(seconds: number) {
    this.hp.setText(`生命 ${Math.ceil(this.player.hp)} / ${this.player.maxHp}`);
    this.level.setText(`等级 ${this.player.level}`);
    this.rage.setText(`怒气 ${Math.floor(this.player.rage)} / ${this.player.maxRage}`);
    this.timer.setText(formatTime(seconds));
    this.xpFill.width = Math.max(1, Math.min(this.scene.scale.width - 50, 650) * this.player.xp / this.player.xpNeeded);
  }

  showUpgrades(items: Upgrade[], pick: (upgrade: Upgrade) => void) {
    this.hideUpgrades();
    const { overlay, cards } = createChoiceOverlay('upgrade', '选择成长方向', '升级四选一 · 点击卡片立即生效');
    this.upgradeOverlay = overlay;
    let selected = false;

    items.forEach(upgrade => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'choice-card choice-card--upgrade';
      if (upgrade.tag === '顶点天赋') card.classList.add('choice-card--apex');
      card.innerHTML = `<span class="choice-card__tag">${upgrade.tag}</span>
        <strong>${upgrade.title}</strong>
        <span class="choice-card__description">${upgrade.description}</span>`;
      card.addEventListener('click', () => {
        if (selected) return;
        selected = true;
        card.classList.add('choice-card--selected');
        cards.querySelectorAll('button').forEach(button => { button.disabled = true; });
        pick(upgrade);
      });
      cards.append(card);
    });
  }

  hideUpgrades() {
    this.upgradeOverlay?.remove();
    this.upgradeOverlay = undefined;
  }

  gameOver(restart: () => void) {
    const cx = this.scene.scale.width / 2, cy = this.scene.scale.height / 2;
    const bg = this.scene.add.rectangle(cx, cy, this.scene.scale.width, this.scene.scale.height, 0x05060a, .88).setInteractive();
    const title = this.scene.add.text(cx, cy - 50, '战斗终结', { fontFamily: 'Marcellus', fontSize: '48px', color: '#d94a3d' }).setOrigin(.5);
    const btn = this.scene.add.text(cx, cy + 35, '再次踏入战场', { fontSize: '18px', backgroundColor: '#9a6b21', padding: { x: 28, y: 14 } }).setOrigin(.5).setInteractive({ useHandCursor: true }).on('pointerdown', restart);
    this.scene.add.container(0, 0, [bg, title, btn]).setScrollFactor(0).setDepth(60);
  }
}
