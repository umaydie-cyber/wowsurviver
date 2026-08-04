import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { getClassTalents, type Upgrade } from '../systems/LevelSystem';
import { SHOP_SKILL_ITEMS, SHOP_UTILITY_ITEMS, type ShopItem } from '../systems/ShopSystem';
import { CLASSES, getBasicSkillDefinition, getClassDefinition, type BasicSkillId, type ClassId } from '../classes';
import { formatTime } from '../systems/progression';
import type { UpgradeRewardType } from '../systems/upgradeRules';
import { DIFFICULTIES, type DifficultyDefinition, type DifficultyId } from '../systems/difficulty';
import { Weapon } from '../combat/Weapon';
import { getSkillRankEffects } from '../systems/SkillLoadout';
import { MAPS, type MapId } from '../maps';
import type { ShopCheckpoint } from '../systems/Persistence';

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

export type StartSelection = { mapId: MapId; difficultyId: DifficultyId; classId: ClassId; basicSkillId: BasicSkillId };

export function showStartSelection(scene: Phaser.Scene, pick: (selection: StartSelection | ShopCheckpoint) => void, checkpoint?: ShopCheckpoint) {
  const { overlay } = createChoiceOverlay('start', '准备踏入战场', '选择地图、难度、职业与该职业可用的基础输出技能');
  const form = document.createElement('div');
  form.className = 'start-builder';
  overlay.querySelector('.choice-overlay__cards')!.replaceWith(form);
  let difficultyId: DifficultyId = 3;
  let mapId: MapId = 'barrens';
  let classId: ClassId = CLASSES[0].id;
  let basicSkillId: BasicSkillId = CLASSES[0].basicSkills[0].id;
  let submitted = false;
  const codexButton = document.createElement('button'); codexButton.type = 'button'; codexButton.className = 'start-codex-button'; codexButton.innerHTML = '<span>✦</span> 冒险图鉴'; overlay.append(codexButton);
  const section = (title: string) => { const element = document.createElement('section'); element.className = 'start-builder__section'; element.innerHTML = `<h2>${title}</h2>`; form.append(element); return element; };
  const mapSection = section('1 · 地图');
  const mapPicker = document.createElement('div'); mapPicker.className = 'map-picker'; mapSection.append(mapPicker);
  const mapTrigger = document.createElement('button'); mapTrigger.type = 'button'; mapTrigger.className = 'map-picker__trigger'; mapPicker.append(mapTrigger);
  const mapList = document.createElement('div'); mapList.className = 'map-picker__list'; mapList.hidden = true; mapPicker.append(mapList);
  const renderMapTrigger = () => { const map = MAPS.find(candidate => candidate.id === mapId)!; mapTrigger.innerHTML = `<span>当前地图</span><strong>${map.name}</strong><small>${map.region} · 点击打开地图列表</small><b>▾</b>`; };
  MAPS.forEach(map => { const button = document.createElement('button'); button.type = 'button'; button.className = `map-picker__option${map.id === mapId ? ' is-selected' : ''}`; button.style.setProperty('--card-color', map.color); button.innerHTML = `<strong>${map.name}</strong><span>${map.region}</span><small>${map.description}</small>`; button.addEventListener('click', () => { mapId = map.id; mapList.hidden = true; mapList.querySelectorAll('button').forEach(item => item.classList.toggle('is-selected', item === button)); renderMapTrigger(); }); mapList.append(button); });
  mapTrigger.addEventListener('click', () => { mapList.hidden = !mapList.hidden; mapTrigger.setAttribute('aria-expanded', String(!mapList.hidden)); }); renderMapTrigger();
  const difficultySection = section('2 · 难度');
  const difficultyChoices = document.createElement('div'); difficultyChoices.className = 'start-builder__choices start-builder__choices--difficulty'; difficultySection.append(difficultyChoices);
  const classSection = section('3 · 职业');
  const classChoices = document.createElement('div'); classChoices.className = 'start-builder__choices'; classSection.append(classChoices);
  const skillSection = section('4 · 初始武器与基础输出技能');
  const skillChoices = document.createElement('div'); skillChoices.className = 'start-builder__skills'; skillSection.append(skillChoices);
  const startButton = document.createElement('button'); startButton.type = 'button'; startButton.className = 'start-builder__submit'; startButton.textContent = '开始战斗'; form.append(startButton);
  if(checkpoint){const resumeButton=document.createElement('button');resumeButton.type='button';resumeButton.className='start-builder__submit';resumeButton.textContent=`继续上次冒险 · 第 ${checkpoint.completedWave} 波商店`;resumeButton.addEventListener('click',()=>{if(submitted)return;submitted=true;overlay.remove();pick(checkpoint);});form.append(resumeButton);}

  const showCodex = () => {
    const codex = document.createElement('section'); codex.className = 'codex'; codex.setAttribute('role', 'dialog'); codex.setAttribute('aria-modal', 'true'); codex.setAttribute('aria-label', '冒险图鉴');
    codex.innerHTML = `<div class="codex__panel"><header><div><span>冒险准备</span><h2>冒险图鉴</h2><p>以当前所选职业判定商店内容是否解锁；五倍等级天赋展示所有职业的完整选项。</p></div><button type="button" class="codex__close" aria-label="关闭图鉴">×</button></header><nav class="codex__tabs" aria-label="图鉴分类"></nav><div class="codex__content"></div></div>`;
    overlay.append(codex);
    const content = codex.querySelector('.codex__content')!;
    const tabs = codex.querySelector('.codex__tabs')!;
    const activeSkillIds: Partial<Record<ClassId, string[]>> = { berserker: ['heroic-leap', 'shield-wall'], 'frost-mage': ['ice-skating', 'icy-veins'] };
    const allShopEntries = [
      ...CLASSES.flatMap(owner => owner.basicSkills.map(skill => ({ id: `skill-copy-${skill.id}`, title: `技能核心：${skill.name}`, tag: '技能', description: `${owner.name}的 1 级${skill.name}核心，可通过同技能同等级核心合成。`, cost: 38, owner: owner.id }))),
      ...SHOP_SKILL_ITEMS.map(item => ({ ...item, owner: (Object.entries(activeSkillIds).find(([, ids]) => ids.includes(item.id))?.[0] as ClassId | undefined) })),
      ...SHOP_UTILITY_ITEMS.map(item => ({ ...item, owner: undefined })),
    ];
    const isUnlocked = (item: typeof allShopEntries[number]) => !item.owner || (item.owner === classId && (!item.id.startsWith('skill-copy-') || classId === 'berserker' || item.id === `skill-copy-${basicSkillId}`));
    const unlocked = allShopEntries.filter(isUnlocked);
    const locked = allShopEntries.filter(item => !isUnlocked(item));
    const renderShop = (items: typeof allShopEntries, isLocked: boolean) => {
      content.innerHTML = `<div class="codex__summary"><strong>${isLocked ? '未解锁' : '目前解锁'} ${items.length} 项</strong><span>${isLocked ? '切换对应职业或初始技能即可解锁' : `${getClassDefinition(classId).name}当前可获得`}</span></div><div class="codex__grid">${items.map(item => `<article class="codex-card${isLocked ? ' codex-card--locked' : ''}"><div><span>${item.tag}</span><b>${item.cost} 艾泽里特</b></div><h3>${item.title}</h3><p>${item.description}</p>${item.owner ? `<small>${getClassDefinition(item.owner).name}专属</small>` : '<small>全职业通用</small>'}</article>`).join('')}</div>`;
    };
    const renderTalents = () => { content.innerHTML = `<div class="codex__talents">${CLASSES.map(owner => `<section><header><h3>${owner.name}</h3><span>每 5 级四选一池 · ${getClassTalents(owner.id).length} 项</span></header><div class="codex__grid">${getClassTalents(owner.id).map(talent => `<article class="codex-card"><div><span>${talent.tag}</span>${talent.maxRank ? `<b>最高 ${talent.maxRank} 级</b>` : talent.repeat ? '<b>可重复</b>' : '<b>唯一</b>'}</div><h3>${talent.title}</h3><p>${talent.description}</p>${talent.requires ? `<small>前置：${getClassTalents(owner.id).find(item => item.id === talent.requires)?.title ?? talent.requires}</small>` : '<small>无前置要求</small>'}</article>`).join('')}</div></section>`).join('')}</div>`; };
    const definitions = [{ label: `目前解锁 (${unlocked.length})`, render: () => renderShop(unlocked, false) }, { label: `未解锁 (${locked.length})`, render: () => renderShop(locked, true) }, { label: '五倍等级天赋', render: renderTalents }];
    definitions.forEach((definition, index) => { const tab = document.createElement('button'); tab.type = 'button'; tab.textContent = definition.label; tab.className = index ? '' : 'is-active'; tab.addEventListener('click', () => { tabs.querySelectorAll('button').forEach(button => button.classList.toggle('is-active', button === tab)); definition.render(); }); tabs.append(tab); });
    definitions[0].render();
    const close = () => codex.remove(); codex.querySelector('.codex__close')!.addEventListener('click', close); codex.addEventListener('click', event => { if (event.target === codex) close(); });
  };
  codexButton.addEventListener('click', showCodex);

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
  startButton.addEventListener('click', () => { if (submitted) return; submitted = true; startButton.disabled = true; overlay.remove(); pick({ mapId, difficultyId, classId, basicSkillId }); });
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
  private gameOverOverlay?: HTMLElement;
  private bossMessage?: Phaser.GameObjects.Text;
  private acquiredTalents = new Map<string, { title: string; tag: string; description: string; count: number }>();

  constructor(private scene: Phaser.Scene, private player: Player, private weapon: Weapon, private classId: ClassId, private difficulty: DifficultyDefinition, private basicSkillId: BasicSkillId, private mapId: MapId) {
    this.create();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.hideUpgrades(); this.hideShop(); this.hideGameOver(); });
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
    this.timer.setText(`${MAPS.find(map => map.id === this.mapId)!.name} · ${this.difficulty.name} · ${formatTime(seconds)}`);
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
    // Choice/shop overlays live above the canvas and would intercept the canvas
    // restart control. Keep the whole defeat screen in that same DOM layer.
    this.hideUpgrades();
    this.hideShop();
    this.hideGameOver();
    const overlay = document.createElement('section');
    overlay.className = 'game-over-overlay';
    overlay.setAttribute('aria-label', '战斗终结');
    overlay.innerHTML = '<h1>战斗终结</h1><button type="button">再次踏入战场</button>';
    document.querySelector('#game')!.append(overlay);
    this.gameOverOverlay = overlay;
    overlay.querySelector('button')!.addEventListener('click', () => {
      this.hideGameOver();
      restart();
    }, { once: true });
  }

  private hideGameOver() {
    this.gameOverOverlay?.remove();
    this.gameOverOverlay = undefined;
  }
}
