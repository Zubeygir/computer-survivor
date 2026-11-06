import Phaser from 'phaser';
import { ATLAS } from '../art/atlas';
import { characterFrame } from '../art/characters';
import {
  characterDef,
  PREMIUM_SKIN,
  PREMIUM_SKIN_PRICE,
  SKIN_TASK_SECONDS,
  type CharacterDef,
  type CharacterId,
} from '../data/characters';
import { FREE_GEMS } from '../data/meta';
import { EVOLUTIONS } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import { progress } from '../systems/Progress';
import { addDarkBackdrop, addScreenHeader, clearScene, COLOR, createButton, DPR, fitCamera, panel, pixelText, SCREEN_HEADER_H } from '../ui/Button';
import { pedestal } from '../ui/Pedestal';
import { formatTime } from '../ui/RunTimer';

export interface CharacterSceneData {
  id: CharacterId;
  /** The skin shown first. */
  skin: number;
}

const SIDE_MARGIN = 12;
const MAX_COLUMN_W = 420;
const BUTTON_H = 56;
const PANEL_H = 202;
const PANEL_TITLE_H = 30;
const PANEL_PAD = 14;
const PANEL_GAP = 20;
/** From the platform's standing line down to the panel. */
const FLOOR_TO_PANEL = 114;
const PEDESTAL_W = 210;
const HERO_SCALE = 7;
/** Used when the screen is too short for the big one. */
const HERO_SCALE_SMALL = 5;
const HERO_H = 20;
const ARROW_W = 52;
const ARROW_H = 72;
const ARROW_UNIT = 3;
const ARROW_STEPS = 6;
const DOT = 12;
const DOT_STEP = 24;
const WEAPON_BOX = 48;
const WEAPON_SCALE = 4;
const BAR_H = 6;
/** CSS pixels of horizontal drag that count as a swipe to the next skin. */
const SWIPE = 40;
const GEM_COLOR = 0xec407a;
const SILHOUETTE = 0x000000;
/** Gold sparkles around a premium skin, as offsets from its feet. */
const SPARKLES: readonly [number, number][] = [[-92, -150], [86, -118], [-70, -60], [100, -40], [-104, -20], [62, -176]];
const SPARKLE_LONG = 12;
const SPARKLE_SHORT = 4;

type SkinState = 'lockedCharacter' | 'owned' | 'lockedSkin' | 'premium';

/** One character on a platform: arrows and swipes cycle its skins, the panel below says what each one is. */
export class CharacterScene extends Phaser.Scene {
  private def!: CharacterDef;
  private skin = 0;
  private swipeX = 0;
  private swipeY = 0;
  private swiping = false;
  private stageBottom = 0;

  constructor() {
    super('CharacterScene');
  }

  create(data: CharacterSceneData) {
    this.def = characterDef(data.id);
    this.skin = data.skin;
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
      this.input.off('pointerdown', this.onDown, this);
      this.input.off('pointerup', this.onUp, this);
    });
  }

  private get state(): SkinState {
    if (!progress.characterUnlocked(this.def)) return 'lockedCharacter';
    if (progress.ownsSkin(this.def, this.skin)) return 'owned';
    return this.skin === PREMIUM_SKIN ? 'premium' : 'lockedSkin';
  }

  /** Rebuilds the screen; only runs on entry, on resize and on a skin change, pick or purchase. */
  private layout() {
    clearScene(this);
    const { width, height } = fitCamera(this);
    addDarkBackdrop(this);
    const columnW = Math.min(width - SIDE_MARGIN * 2, MAX_COLUMN_W);
    const left = (width - columnW) / 2;
    const cx = width / 2;
    const state = this.state;
    const hidden = state === 'lockedCharacter' || state === 'lockedSkin';
    const premiumLook = this.skin === PREMIUM_SKIN && !hidden;
    const highlight = premiumLook ? GEM_COLOR : COLOR.accent;

    const buttonY = height - 16 - BUTTON_H / 2;
    const panelTop = buttonY - BUTTON_H / 2 - PANEL_GAP - PANEL_H;
    const floor = panelTop - FLOOR_TO_PANEL;
    this.stageBottom = panelTop;
    const heroScale = floor - SCREEN_HEADER_H - 16 >= HERO_H * HERO_SCALE ? HERO_SCALE : HERO_SCALE_SMALL;

    pedestal(this, cx, floor, PEDESTAL_W, highlight);
    const hero = this.add.image(cx, floor + 2, ATLAS, characterFrame(this.def.id, this.skin, 'stand')).setOrigin(0.5, 1).setScale(heroScale);
    if (hidden) hero.setTintFill(SILHOUETTE);
    if (premiumLook) {
      for (const [dx, dy] of SPARKLES) {
        this.add.rectangle(cx + dx, floor + dy, SPARKLE_SHORT, SPARKLE_LONG, COLOR.gold).setOrigin(0);
        this.add.rectangle(cx + dx - SPARKLE_SHORT, floor + dy + SPARKLE_SHORT, SPARKLE_LONG, SPARKLE_SHORT, COLOR.gold).setOrigin(0);
      }
    }

    const arrowY = floor - heroScale * HERO_H / 2 - 20;
    this.addArrow(left + ARROW_W / 2, arrowY, -1);
    this.addArrow(left + columnW - ARROW_W / 2, arrowY, 1);

    const skinName = hidden ? '???' : this.def.skins[this.skin];
    pixelText(this, cx, floor + 46, skinName, { size: 18, color: hidden ? COLOR.muted : highlight }).setOrigin(0.5, 0);
    for (let i = 0; i < this.def.skins.length; i++) {
      const x = cx - DOT_STEP * (this.def.skins.length - 1) / 2 + i * DOT_STEP - DOT / 2;
      const dot = this.add.rectangle(x, floor + 76, DOT, DOT, i === this.skin ? highlight : COLOR.bg).setOrigin(0);
      if (i !== this.skin) dot.setStrokeStyle(2, COLOR.line);
    }

    this.addPanel(state, left, panelTop, columnW, premiumLook);
    this.addAction(state, cx, buttonY, columnW);
    addScreenHeader(this, progress.characterUnlocked(this.def) ? this.def.name : '???', null, left, left + columnW, () =>
      this.scene.start('CharactersScene'),
    );
  }

  private addArrow(x: number, y: number, dir: number) {
    createButton(this, x, y, { width: ARROW_W, height: ARROW_H, label: '', color: COLOR.line, onClick: () => this.step(dir) });
    // The tallest column is the arrow's back; the point is on the side it points to
    for (let i = 0; i < ARROW_STEPS; i++) {
      const h = ((ARROW_STEPS - i) * 2 - 1) * ARROW_UNIT;
      const half = (ARROW_STEPS * ARROW_UNIT) / 2;
      const columnX = dir < 0 ? x + half - (i + 1) * ARROW_UNIT : x - half + i * ARROW_UNIT;
      this.add.rectangle(columnX, y - h / 2, ARROW_UNIT, h, COLOR.accent).setOrigin(0);
    }
  }

  private addPanel(state: SkinState, left: number, top: number, width: number, premiumLook: boolean) {
    const { shadow, face } = panel(this, width, PANEL_H, premiumLook ? GEM_COLOR : COLOR.line);
    shadow.setPosition(left + width / 2, top + PANEL_H / 2 + 4);
    face.setPosition(left + width / 2, top + PANEL_H / 2);
    this.add.rectangle(left + 2, top + 2, width - 4, PANEL_TITLE_H, COLOR.panelHi).setOrigin(0);
    const titles: Record<SkinState, string> = {
      lockedCharacter: 'Locked character',
      owned: 'Character',
      lockedSkin: 'Locked skin',
      premium: 'Premium skin',
    };
    const titleY = top + 2 + PANEL_TITLE_H / 2;
    pixelText(this, left + PANEL_PAD, titleY, titles[state], { color: premiumLook ? GEM_COLOR : COLOR.accent, centered: false }).setOrigin(0, 0.5);
    pixelText(this, left + width - PANEL_PAD, titleY, `Skin ${this.skin + 1}/${this.def.skins.length}`, { color: COLOR.muted, centered: false })
      .setOrigin(1, 0.5);

    const x = left + PANEL_PAD;
    const y = top + PANEL_TITLE_H + 18;
    const textW = width - PANEL_PAD * 2;
    const line = (dy: number, text: string, color: number) => pixelText(this, x, y + dy, text, { color, maxWidth: textW, centered: false });
    const weapon = weaponName(this.def.id);
    switch (state) {
      case 'owned': {
        this.add.rectangle(x, y, WEAPON_BOX, WEAPON_BOX, COLOR.bg2).setOrigin(0).setStrokeStyle(2, COLOR.data);
        const icon = this.add.image(x + WEAPON_BOX / 2, y + WEAPON_BOX / 2, ATLAS, WEAPONS[this.def.id].sprite);
        // Weapon sprites differ in size; the biggest whole scale that still fits the box
        icon.setScale(Math.max(1, Math.min(WEAPON_SCALE, Math.floor((WEAPON_BOX - 8) / Math.max(icon.width, icon.height)))));
        pixelText(this, x + WEAPON_BOX + 14, y + 6, 'Starts with', { color: COLOR.muted, centered: false });
        pixelText(this, x + WEAPON_BOX + 14, y + 26, weapon, { color: COLOR.data, centered: false });
        line(64, 'Trait', COLOR.muted);
        line(84, this.def.traitText, COLOR.good);
        line(112, 'Every skin keeps the trait', COLOR.dim);
        break;
      }
      case 'lockedCharacter':
        line(0, '??? : Unlock to', COLOR.muted);
        line(22, `Evolve the ${weapon}`, COLOR.text);
        if (!progress.isUnlocked(this.def.id)) line(66, `Buy the ${weapon} in the Museum first`, COLOR.dim);
        break;
      case 'lockedSkin': {
        line(0, '??? : Unlock to', COLOR.muted);
        line(22, `Reach ${formatTime(SKIN_TASK_SECONDS)} as ${this.def.name}`, COLOR.text);
        line(66, `Your best as ${this.def.name}`, COLOR.muted);
        const best = progress.bestTimeAs(this.def);
        const time = pixelText(this, x + textW, y + 86, formatTime(best), { color: COLOR.muted, centered: false }).setOrigin(1, 0);
        const barW = textW - time.width - 14;
        this.add.rectangle(x, y + 92, barW, BAR_H, COLOR.bg2).setOrigin(0);
        const ratio = Math.min(best / SKIN_TASK_SECONDS, 1);
        if (ratio > 0) this.add.rectangle(x, y + 92, Math.round(barW * ratio), BAR_H, COLOR.data).setOrigin(0);
        line(118, 'Normal or Nightmare', COLOR.dim);
        break;
      }
      case 'premium':
        line(0, `The flashiest look of ${this.def.name}, same trait`, COLOR.text);
        line(56, 'Price', COLOR.muted);
        line(76, `${PREMIUM_SKIN_PRICE} Gem`, GEM_COLOR);
        line(112, FREE_GEMS ? 'Gem is free while testing' : 'Gem is bought in the shop', COLOR.dim);
        break;
    }
  }

  private addAction(state: SkinState, cx: number, y: number, width: number) {
    const base = { width, height: BUTTON_H };
    if (state === 'owned') {
      const selected = progress.character.id === this.def.id && progress.skin === this.skin;
      createButton(this, cx, y, {
        ...base,
        label: selected ? 'Selected' : 'Select',
        primary: !selected,
        color: selected ? COLOR.muted : COLOR.accent,
        disabled: selected,
        size: 18,
        onClick: () => {
          progress.selectCharacter(this.def, this.skin);
          this.layout();
        },
      });
    } else if (state === 'premium') {
      createButton(this, cx, y, {
        ...base,
        label: FREE_GEMS ? 'Get free' : `Buy - ${PREMIUM_SKIN_PRICE} Gem`,
        primary: true,
        color: GEM_COLOR,
        size: 18,
        disabled: progress.gems < PREMIUM_SKIN_PRICE,
        onClick: () => {
          if (!progress.buyPremiumSkin(this.def)) return;
          progress.selectCharacter(this.def, this.skin);
          this.layout();
        },
      });
    } else {
      createButton(this, cx, y, { ...base, label: 'Locked', color: COLOR.muted, disabled: true, size: 18, onClick: () => {} });
    }
  }

  /** Endless: past the last skin comes the first again. */
  private step(dir: number) {
    const count = this.def.skins.length;
    this.skin = (this.skin + dir + count) % count;
    this.layout();
  }

  private onDown(pointer: Phaser.Input.Pointer) {
    const y = pointer.y / DPR;
    this.swiping = y > SCREEN_HEADER_H && y < this.stageBottom;
    this.swipeX = pointer.x / DPR;
    this.swipeY = y;
  }

  private onUp(pointer: Phaser.Input.Pointer) {
    if (!this.swiping) return;
    this.swiping = false;
    const dx = pointer.x / DPR - this.swipeX;
    const dy = pointer.y / DPR - this.swipeY;
    // A swipe left brings the next skin, like turning a page
    if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(dy)) this.step(dx < 0 ? 1 : -1);
  }
}

function weaponName(id: CharacterId): string {
  return EVOLUTIONS.find((evolution) => evolution.base.weapon === id)?.base.name ?? id;
}
