import Phaser from 'phaser';
import { Player } from '../entities/Player';
import type { Upgrade } from '../systems/LevelSystem';
import type { ShopItem } from '../systems/ShopSystem';
import { CLASSES, getBasicSkillDefinition, getClassDefinition, type BasicSkillId, type ClassId } from '../classes';
import { formatTime } from '../systems/progression';
import type { UpgradeRewardType } from '../systems/upgradeRules';
import { DIFFICULTIES, type DifficultyDefinition, type DifficultyId } from '../systems/difficulty';
import { Weapon } from '../combat/Weapon';
import { getSkillRankEffects } from '../systems/SkillLoadout';

function createChoiceOverlay(kind: 'start' | 'difficulty' | 'class' | 'upgrade' | 'shop', title: string, subtitle: string) {
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

export type StartSelection = { difficultyId: DifficultyId; classId: ClassId; basicSkillId: BasicSkillId };

export function showStartSelection(scene: Phaser.Scene, pick: (selection: StartSelection) => void) {
  const { overlay } = createChoiceOverlay('start', '准备踏入战场', '同时选择难度、职业与该职业可用的基础输出技能');
  const form = document.createElement('div');
  form.className = 'start-builder';
  overlay.querySelector('.choice-overlay__cards')!.replaceWith(form);
  let difficultyId: DifficultyId = 3;
  let classId: ClassId = CLASSES[0].id;
  let basicSkillId: BasicSkillId = CLASSES[0].basicSkills[0].id;
  let submitted = false;
  const section = (title: string) => { const element = document.createElement('section'); element.className = 'start-builder__section'; element.innerHTML = `<h2>${title}</h2>`; form.append(element); return element; };
  const difficultySection = section('1 · 难度');
  const difficultyChoices = document.createElement('div'); difficultyChoices.className = 'start-builder__choices start-builder__choices--difficulty'; difficultySection.append(difficultyChoices);
  const classSection = section('2 · 职业');
  const classChoices = document.createElement('div'); classChoices.className = 'start-builder__choices'; classSection.append(classChoices);
  const skillSection = section('3 · 初始武器与基础输出技能');
  const skillChoices = document.createElement('div'); skillChoices.className = 'start-builder__skills'; skillSection.append(skillChoices);
  const startButton = document.createElement('button'); startButton.type = 'button'; startButton.className = 'start-builder__submit'; startButton.textContent = '开始战斗'; form.append(startButton);

  const renderSkills = () => {
    skillChoices.innerHTML = '';
    getClassDefinition(classId).basicSkills.forEach(skill => {
      const card = document.createElement('button'); card.type = 'button'; card.className = `start-skill${skill.id === basicSkillId ? ' is-selected' : ''}`;
      card.innerHTML = `<span>${skill.weapon}</span><strong>${skill.name}</strong><small>${skill.description}</small>`;
      card.addEventListener('click', () => { basicSkillId = skill.id; renderSkills(); }); skillChoices.append(card);
    });
  };
  DIFFICULTIES.forEach(difficulty => {
    const button = document.createElement('button'); button.type = 'button'; button.className = `start-option${difficulty.id === difficultyId ? ' is-selected' : ''}`; button.style.setProperty('--card-color', difficulty.color);
    button.innerHTML = `<strong>${difficulty.id}</strong><span>${difficulty.name}</span><small>命中 ${difficulty.requiredAccuracy}% · 生命 ${Math.round(difficulty.enemyHealthMultiplier * 100)}%</small>`;
    button.addEventListener('click', () => { difficultyId = difficulty.id; difficultyChoices.querySelectorAll('button').forEach(item => item.classList.toggle('is-selected', item === button)); }); difficultyChoices.append(button);
  });
  CLASSES.forEach(definition => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `start-option start-option--class${definition.id === classId ? ' is-selected' : ''}`;
    card.style.setProperty('--card-color', `#${definition.color.toString(16).padStart(6, '0')}`);
    card.innerHTML = `<strong>${definition.name}</strong><span>${definition.fantasy}</span><small>${definition.basicSkills.length} 个可用基础技能</small>`;
    card.addEventListener('click', () => {
      classId = definition.id; basicSkillId = definition.basicSkills[0].id;
      classChoices.querySelectorAll('button').forEach(item => item.classList.toggle('is-selected', item === card)); renderSkills();
    });
    classChoices.append(card);
  });
  renderSkills();
  startButton.addEventListener('click', () => { if (submitted) return; submitted = true; startButton.disabled = true; overlay.remove(); pick({ difficultyId, classId, basicSkillId }); });
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
  private acquiredTalents = new Map<string, { title: string; tag: string; description: string; count: number }>();

  constructor(private scene: Phaser.Scene, private player: Player, private weapon: Weapon, private classId: ClassId, private difficulty: DifficultyDefinition, private basicSkillId: BasicSkillId) {
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
    const skill = getBasicSkillDefinition(this.classId, this.basicSkillId)!;
    const skillHint = `${skill.name}自动释放 · 初始武器 ${skill.weapon}`;
    this.scene.add.text(w / 2, hintY, `${definition.name}  |  ${skillHint}`, { fontSize: '13px', color: '#d6a85d' }).setOrigin(.5).setScrollFactor(0).setDepth(21);
  }

  update(seconds: number) {
    this.hp.setText(`生命 ${Math.ceil(this.player.hp)} / ${this.player.maxHp}`);
    this.level.setText(`等级 ${this.player.level}`);
    this.rage.setText(`怒气 ${Math.floor(this.player.rage)} / ${this.player.maxRage}`);
    this.focus.setText(this.player.combatFocusActive ? `战斗专注 急速 +${Math.floor(this.player.combatFocusHasteBonus)}%` : '战斗专注 未激活');
    this.azerite.setText(`艾泽里特 ${this.player.azerite} · 技能栏 6 · 拾取 +${this.player.pickupRange}`);
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

  recordTalent(upgrade: Pick<Upgrade, 'id' | 'title' | 'tag' | 'description'>) {
    const current = this.acquiredTalents.get(upgrade.id);
    this.acquiredTalents.set(upgrade.id, { ...upgrade, count: (current?.count ?? 0) + 1 });
  }

  showShop(items: ShopItem[], wave: number, buy: (item: ShopItem, visibleIds: string[]) => ShopItem | false, leave: () => void) {
    this.hideShop();
    const overlay = document.createElement('section');
    overlay.className = 'choice-overlay choice-overlay--shop';
    overlay.setAttribute('aria-label', `第 ${wave} 波结束 · 艾泽里特商店`);
    overlay.innerHTML = `<header class="shop-header"><div><span class="shop-header__eyebrow">第 ${wave} 波完成</span><h1>艾泽里特商店</h1></div><p>购买后货位立即刷新，整备完成后进入下一波</p></header>
      <main class="shop-layout">
        <aside class="shop-left"><section class="shop-panel shop-vitals" aria-label="角色资源"></section><section class="shop-panel shop-talents"><h2>已获天赋</h2><div class="shop-talents__list"></div></section></aside>
        <section class="shop-stock"><div class="shop-stock__heading"><h2>本轮货物</h2><span>点击购买</span></div><div class="choice-overlay__cards"></div></section>
        <aside class="shop-panel shop-stats"><h2>角色基础属性</h2><div class="shop-stats__list"></div></aside>
      </main>
      <footer class="shop-loadout"><div class="shop-loadout__heading"><h2>已装配技能</h2><span>拖拽技能调整顺序</span></div><div class="shop-skill-slots"></div><button type="button" class="shop-continue">继续下一波 <span>›</span></button></footer>`;
    document.querySelector('#game')!.append(overlay);
    this.shopOverlay = overlay;
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => overlay.remove());
    const cards = overlay.querySelector('.choice-overlay__cards')!;
    const vitals = overlay.querySelector('.shop-vitals')!;
    const stats = overlay.querySelector('.shop-stats__list')!;
    const talentList = overlay.querySelector('.shop-talents__list')!;
    const renderSummary = () => {
      vitals.innerHTML = `<div><span>等级 / 经验</span><strong>Lv.${this.player.level} · ${Math.floor(this.player.xp)} / ${this.player.xpNeeded}</strong></div>
        <div><span>生命上限</span><strong>${Math.ceil(this.player.maxHp)}</strong></div><div><span>艾泽里特</span><strong class="shop-vitals__currency">${this.player.azerite}</strong></div>`;
      const attributes = [
        ['攻击强度', this.player.attackPower.toFixed(1)], ['法术强度', this.player.spellPower.toFixed(1)], ['速度', this.player.speed.toFixed(1)],
        ['护甲', this.player.armor.toFixed(1)], ['魔抗', this.player.magicResistance.toFixed(1)], ['全能伤害率', `${this.player.versatility.toFixed(1)}%`],
        ['急速', `${this.player.haste.toFixed(1)}%`], ['暴击', `${this.player.criticalStrike.toFixed(1)}%`], ['精通', this.player.mastery.toFixed(1)], ['经验获取', `+${this.player.xpRate.toFixed(1)}%`], ['拾取范围', `+${this.player.pickupRange}`],
      ];
      stats.innerHTML = attributes.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
    };
    renderSummary();
    talentList.innerHTML = this.acquiredTalents.size
      ? [...this.acquiredTalents.values()].map(talent => `<article><span>${talent.tag}</span><strong>${talent.title}${talent.count > 1 ? ` ×${talent.count}` : ''}</strong><p>${talent.description}</p></article>`).join('')
      : '<p class="shop-empty">尚未获得职业天赋<br>每 5 级可选择一次</p>';
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
        renderSummary();
        renderSlots();
        card.replaceWith(renderItem(replacement, index));
      });
      return card;
    };
    visibleItems.forEach((item, index) => cards.append(renderItem(item, index)));
    const slots = overlay.querySelector('.shop-skill-slots')!;
    let draggedIndex = -1;
    const renderSlots = () => {
      const passiveSlots = this.weapon.loadout.slots.map((slot, index) => { const skill = slot ? getBasicSkillDefinition(this.classId, slot.skillId)! : undefined; const effects = slot ? getSkillRankEffects(slot.rank) : undefined; return `<div class="shop-skill-slot${slot ? ' shop-skill-slot--filled' : ''} skill-rank-${slot?.rank ?? 0}" draggable="${Boolean(slot)}" data-index="${index}"><span>S${index + 1}${slot ? ` · ${slot.rank}级` : ''}</span><strong>${skill?.name || '空技能槽'}</strong><small>${effects ? `伤害 ×${effects.damageMultiplier.toFixed(2)} · 范围 ×${effects.rangeMultiplier.toFixed(2)} · 间隔 ×${effects.cooldownMultiplier.toFixed(2)}` : '拖入技能核心'}</small></div>`; }).join('');
      const movementUnlocked = this.player.heroicLeapUnlocked || this.player.iceSkatingUnlocked;
      const burstUnlocked = this.player.shieldWallUnlocked || this.player.icyVeinsUnlocked;
      const movement = this.player.iceSkatingUnlocked ? '滑冰术' : this.player.heroicLeapUnlocked ? '英勇跳跃' : '空位移技能槽';
      const burst = this.player.icyVeinsUnlocked ? '寒冰血脉' : this.player.shieldWallUnlocked ? '盾墙' : '空爆发技能槽';
      slots.innerHTML = `${passiveSlots}<div class="shop-skill-slot${movementUnlocked ? ' shop-skill-slot--filled' : ''}"><span>Space</span><strong>${movement}</strong><small>位移技能</small></div><div class="shop-skill-slot${burstUnlocked ? ' shop-skill-slot--filled' : ''}"><span>Q</span><strong>${burst}</strong><small>爆发技能</small></div>`;
      slots.querySelectorAll<HTMLElement>('.shop-skill-slot').forEach(slot => {
        slot.addEventListener('dragstart', () => { draggedIndex = Number(slot.dataset.index); slot.classList.add('is-dragging'); });
        slot.addEventListener('dragend', () => slot.classList.remove('is-dragging'));
        slot.addEventListener('dragover', event => { event.preventDefault(); slot.classList.add('is-dragover'); });
        slot.addEventListener('dragleave', () => slot.classList.remove('is-dragover'));
        slot.addEventListener('drop', event => { event.preventDefault(); const target = Number(slot.dataset.index); if (draggedIndex < 0 || draggedIndex === target) return; this.weapon.loadout.moveOrMerge(draggedIndex, target); draggedIndex = -1; renderSlots(); });
      });
    };
    renderSlots();
    const leaveButton = overlay.querySelector<HTMLButtonElement>('.shop-continue')!;
    leaveButton.addEventListener('click', () => { this.hideShop(); leave(); });
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
