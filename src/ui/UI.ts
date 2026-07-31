import Phaser from 'phaser';
import { Player } from '../entities/Player';
import type { Upgrade } from '../systems/LevelSystem';
import type { ShopItem } from '../systems/ShopSystem';
import { CLASSES, type ClassId } from '../classes';
import { formatTime } from '../systems/progression';
import type { UpgradeRewardType } from '../systems/upgradeRules';
import { DIFFICULTIES, type DifficultyDefinition, type DifficultyId } from '../systems/difficulty';

function createChoiceOverlay(kind: 'difficulty' | 'class' | 'upgrade' | 'shop', title: string, subtitle: string) {
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

export function showDifficultySelection(scene: Phaser.Scene, pick: (id: DifficultyId) => void) {
  const { overlay, cards } = createChoiceOverlay('difficulty', '选择难度', '命中率表示技能保持命中才能勉强过关的平衡目标');
  let selected = false;
  DIFFICULTIES.forEach(difficulty => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'choice-card choice-card--difficulty';
    card.style.setProperty('--card-color', difficulty.color);
    card.innerHTML = `<span class="choice-card__icon">${difficulty.id}</span><strong>${difficulty.name}</strong>
      <span class="choice-card__skill">最低技能命中率 ${difficulty.requiredAccuracy}%</span>
      <span class="choice-card__description">敌人生命 ${Math.round(difficulty.enemyHealthMultiplier * 100)}% · 伤害 ${Math.round(difficulty.enemyDamageMultiplier * 100)}%</span>`;
    card.addEventListener('click', () => {
      if (selected) return;
      selected = true;
      cards.querySelectorAll('button').forEach(button => { button.disabled = true; });
      overlay.remove();
      pick(difficulty.id);
    });
    cards.append(card);
  });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => overlay.remove());
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
    const icon = definition.icon
      ? `<img class="choice-card__icon-image" src="${definition.icon}" alt="" />`
      : definition.skill.slice(0, 1);
    card.innerHTML = `<span class="choice-card__icon">${icon}</span>
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
  private azerite!: Phaser.GameObjects.Text;
  private rage!: Phaser.GameObjects.Text;
  private focus!: Phaser.GameObjects.Text;
  private xpFill!: Phaser.GameObjects.Rectangle;
  private xpTrackWidth = 1;
  private upgradeOverlay?: HTMLElement;
  private shopOverlay?: HTMLElement;
  private bossMessage?: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, private player: Player, private classId: ClassId, private difficulty: DifficultyDefinition) {
    this.create();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.hideUpgrades(); this.hideShop(); });
  }

  private create() {
    const w = this.scene.scale.width;
    const definition = CLASSES.find(candidate => candidate.id === this.classId)!;
    const panelWidth = Math.min(w - 32, 940);
    const panelY = 58;
    const topRowY = panelY - 22;
    const middleRowY = panelY + 3;
    const hintY = panelY + 52;
    this.xpTrackWidth = Math.min(w - 64, 720);
    this.scene.add.rectangle(w / 2, panelY, panelWidth, 92, 0x090d17, .9).setScrollFactor(0).setDepth(20).setStrokeStyle(1, definition.color);
    this.hp = this.scene.add.text(w / 2 - panelWidth * .36, topRowY, '', { fontSize: '15px', color: '#f4d58a' }).setOrigin(.5).setScrollFactor(0).setDepth(21);
    this.level = this.scene.add.text(w / 2 - panelWidth * .17, topRowY, '', { fontSize: '15px', color: '#fff' }).setOrigin(.5).setScrollFactor(0).setDepth(21);
    this.azerite = this.scene.add.text(w / 2 + panelWidth * .12, topRowY, '', { fontSize: '15px', color: '#68e7ff' }).setOrigin(.5).setScrollFactor(0).setDepth(21);
    this.timer = this.scene.add.text(w / 2 + panelWidth * .36, topRowY, '', { fontFamily: 'Marcellus', fontSize: '17px', color: '#f4d58a' }).setOrigin(.5).setScrollFactor(0).setDepth(21);
    this.rage = this.scene.add.text(w / 2 - panelWidth * .22, middleRowY, '', { fontSize: '14px', color: '#ff884d' }).setOrigin(.5).setScrollFactor(0).setDepth(21).setVisible(this.classId === 'berserker');
    this.focus = this.scene.add.text(w / 2 + panelWidth * .18, middleRowY, '', { fontSize: '14px', color: '#ffe16b' }).setOrigin(.5).setScrollFactor(0).setDepth(21).setVisible(this.classId === 'berserker');
    this.scene.add.rectangle(w / 2, panelY + 27, this.xpTrackWidth, 8, 0x1d2638).setScrollFactor(0).setDepth(20);
    this.xpFill = this.scene.add.rectangle(w / 2 - this.xpTrackWidth / 2, panelY + 27, 1, 8, 0x39d0e7).setOrigin(0, .5).setScrollFactor(0).setDepth(21);
    this.scene.add.text(w / 2, hintY, `${definition.name}  |  ${definition.skill}自动释放`, { fontSize: '13px', color: '#d6a85d' }).setOrigin(.5).setScrollFactor(0).setDepth(21);
  }

  update(seconds: number) {
    this.hp.setText(`生命 ${Math.ceil(this.player.hp)} / ${this.player.maxHp}`);
    this.level.setText(`等级 ${this.player.level}`);
    this.rage.setText(`怒气 ${Math.floor(this.player.rage)} / ${this.player.maxRage}`);
    this.focus.setText(this.player.combatFocusActive ? `战斗专注 急速 +${Math.floor(this.player.combatFocusHasteBonus)}%` : '战斗专注 未激活');
    this.azerite.setText(`艾泽里特 ${this.player.azerite} · 技能栏 ${this.player.skillSlots} · 拾取 +${this.player.pickupRange}`);
    this.timer.setText(`${this.difficulty.name} · ${formatTime(seconds)}`);
    this.xpFill.width = Math.max(1, this.xpTrackWidth * this.player.xp / this.player.xpNeeded);
  }

  showUpgrades(items: Upgrade[], rewardType: UpgradeRewardType, pick: (upgrade: Upgrade) => void) {
    this.hideUpgrades();
    const skillReward = rewardType === 'skill';
    const { overlay, cards } = createChoiceOverlay('upgrade', skillReward ? '选择技能强化' : '选择基础属性', `${skillReward ? '每 5 级技能奖励' : '本级基础属性奖励'} · 四选一 · 点击卡片立即生效`);
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

  showShop(items: ShopItem[], wave: number, buy: (item: ShopItem, visibleIds: string[]) => ShopItem | false, leave: () => void) {
    this.hideShop();
    const { overlay, cards } = createChoiceOverlay('shop', `第 ${wave} 波结束 · 艾泽里特商店`, '高价道具需要取舍 · 购买后该货位会立即刷新');
    this.shopOverlay = overlay;
    const visibleItems = [...items];
    const renderItem = (item: ShopItem, index: number) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'choice-card choice-card--shop';
      card.innerHTML = `<span class="choice-card__tag">${item.tag} · ${item.cost} 艾泽里特</span>
        <strong>${item.title}</strong>
        <span class="choice-card__description">${item.description}</span>`;
      card.addEventListener('click', () => {
        const replacement = buy(item, visibleItems.map(candidate => candidate.id));
        if (!replacement) { card.classList.add('choice-card--locked'); return; }
        visibleItems[index] = replacement;
        card.replaceWith(renderItem(replacement, index));
      });
      return card;
    };
    visibleItems.forEach((item, index) => cards.append(renderItem(item, index)));
    const leaveButton = document.createElement('button');
    leaveButton.type = 'button';
    leaveButton.className = 'choice-card choice-card--continue';
    leaveButton.innerHTML = '<strong>继续下一波</strong><span class="choice-card__description">保留未消费艾泽里特，进入更长一波战斗</span>';
    leaveButton.addEventListener('click', () => { this.hideShop(); leave(); });
    cards.append(leaveButton);
  }

  hideShop() {
    this.shopOverlay?.remove();
    this.shopOverlay = undefined;
  }

  showBossBanner(kicker: string, name: string, mechanics: string) {
    const cx = this.scene.scale.width / 2;
    const banner = this.scene.add.container(cx, 170).setScrollFactor(0).setDepth(45);
    const bg = this.scene.add.rectangle(0, 0, 520, 92, 0x210d16, .92).setStrokeStyle(2, 0xd85843);
    const title = this.scene.add.text(0, -18, `${kicker} · ${name}`, { fontFamily: 'Marcellus', fontSize: '27px', color: '#ffd18b' }).setOrigin(.5);
    const detail = this.scene.add.text(0, 19, mechanics, { fontSize: '14px', color: '#f2b3ad' }).setOrigin(.5);
    banner.add([bg, title, detail]);
    this.scene.tweens.add({ targets: banner, alpha: 0, y: 145, delay: 2800, duration: 500, onComplete: () => banner.destroy() });
  }

  showBossMessage(title: string, detail: string) {
    this.bossMessage?.destroy();
    this.bossMessage = this.scene.add.text(this.scene.scale.width / 2, 130, `${title} · ${detail}`, {
      fontSize: '18px', color: '#ffe2c0', backgroundColor: '#641f2fcc', padding: { x: 18, y: 10 },
    }).setOrigin(.5).setScrollFactor(0).setDepth(46);
    const message = this.bossMessage;
    this.scene.tweens.add({ targets: message, alpha: 0, delay: 1900, duration: 350, onComplete: () => { if (this.bossMessage === message) this.bossMessage = undefined; message.destroy(); } });
  }

  gameOver(restart: () => void) {
    const cx = this.scene.scale.width / 2, cy = this.scene.scale.height / 2;
    const bg = this.scene.add.rectangle(cx, cy, this.scene.scale.width, this.scene.scale.height, 0x05060a, .88).setInteractive();
    const title = this.scene.add.text(cx, cy - 50, '战斗终结', { fontFamily: 'Marcellus', fontSize: '48px', color: '#d94a3d' }).setOrigin(.5);
    const btn = this.scene.add.text(cx, cy + 35, '再次踏入战场', { fontSize: '18px', backgroundColor: '#9a6b21', padding: { x: 28, y: 14 } }).setOrigin(.5).setInteractive({ useHandCursor: true }).on('pointerdown', restart);
    this.scene.add.container(0, 0, [bg, title, btn]).setScrollFactor(0).setDepth(60);
  }
}
