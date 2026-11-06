import Phaser from 'phaser';
import { ATLAS } from '../art/atlas';
import { characterFrame } from '../art/characters';
import { CHARACTERS, type CharacterDef } from '../data/characters';
import { progress } from '../systems/Progress';
import { addDarkBackdrop, addScreenHeader, clearScene, COLOR, createButton, fitCamera, pixelText, SCREEN_HEADER_H } from '../ui/Button';
import { pedestal } from '../ui/Pedestal';
import { ScrollList } from '../ui/ScrollList';
import type { CharacterSceneData } from './CharacterScene';

const SIDE_MARGIN = 12;
const MAX_COLUMN_W = 420;
const SUMMARY_Y = SCREEN_HEADER_H + 12;
const LIST_TOP = SUMMARY_Y + 28;
const COLUMNS = 2;
const TILE_GAP = 11;
const TILE_H = 168;
const NAME_H = 40;
const SPRITE_SCALE = 4;
/** From the tile's bottom up to the line the character stands on. */
const FLOOR_FROM_BOTTOM = 34;
const PEDESTAL_W = 96;
const BADGE_W = 52;
const BADGE_H = 18;
const SILHOUETTE = 0x000000;

/** Every character in a grid of tiles; tapping one opens its own page. */
export class CharactersScene extends Phaser.Scene {
  private scroll = 0;
  private list: ScrollList | null = null;

  constructor() {
    super('CharactersScene');
  }

  create() {
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
      this.scroll = this.list?.scroll ?? 0;
      this.list?.destroy();
    });
  }

  /** Rebuilds the screen; only runs on entry and on resize. */
  private layout() {
    this.list?.destroy();
    clearScene(this);
    const { width, height } = fitCamera(this);
    addDarkBackdrop(this);
    const columnW = Math.min(width - SIDE_MARGIN * 2, MAX_COLUMN_W);
    const left = (width - columnW) / 2;
    const tileW = (columnW - TILE_GAP * (COLUMNS - 1)) / COLUMNS;

    // The list first, so the header draws over tiles scrolled beneath it
    const list = new ScrollList(this, { x: left, y: LIST_TOP, width: columnW, height: height - LIST_TOP }, this.scroll);
    this.list = list;
    CHARACTERS.forEach((def, i) => {
      const x = (i % COLUMNS) * (tileW + TILE_GAP);
      const y = Math.floor(i / COLUMNS) * (TILE_H + TILE_GAP);
      list.content.add(this.createTile(def, x, y, tileW));
    });
    const rows = Math.ceil(CHARACTERS.length / COLUMNS);
    list.setContentHeight(rows * (TILE_H + TILE_GAP) - TILE_GAP + SIDE_MARGIN);

    addScreenHeader(this, 'Characters', null, left, left + columnW, () => this.scene.start('MenuScene'));
    const unlocked = CHARACTERS.filter((def) => progress.characterUnlocked(def)).length;
    pixelText(this, width / 2, SUMMARY_Y, `${unlocked}/${CHARACTERS.length} unlocked`, { color: COLOR.muted }).setOrigin(0.5, 0);
  }

  /** Name on top, the base skin on a small platform; the one in use has a gold frame and a badge. */
  private createTile(def: CharacterDef, x: number, y: number, width: number): Phaser.GameObjects.Container {
    const unlocked = progress.characterUnlocked(def);
    const used = progress.character.id === def.id;
    const cx = width / 2;
    const parts: Phaser.GameObjects.GameObject[] = [
      createButton(this, cx, TILE_H / 2, {
        width,
        height: TILE_H,
        label: '',
        color: used ? COLOR.accent : COLOR.line,
        onClick: () => this.open(def),
      }),
      this.add.rectangle(2, 2, width - 4, NAME_H, COLOR.panelHi).setOrigin(0),
      pixelText(this, cx, 2 + NAME_H / 2, unlocked ? def.name : '???', {
        color: used ? COLOR.accent : unlocked ? COLOR.text : COLOR.dim,
        maxWidth: width - 16,
      }).setOrigin(0.5),
    ];
    const floor = TILE_H - FLOOR_FROM_BOTTOM;
    parts.push(...pedestal(this, cx, floor, PEDESTAL_W, used ? COLOR.accent : COLOR.line, true));
    const skin = used ? progress.skin : 0;
    const hero = this.add.image(cx, floor + 1, ATLAS, characterFrame(def.id, skin, 'stand')).setOrigin(0.5, 1).setScale(SPRITE_SCALE);
    if (!unlocked) hero.setTintFill(SILHOUETTE);
    parts.push(hero);
    if (used) {
      parts.push(
        this.add.rectangle(8, NAME_H + 10, BADGE_W, BADGE_H, COLOR.accent).setOrigin(0),
        pixelText(this, 8 + BADGE_W / 2, NAME_H + 10 + BADGE_H / 2, 'Used', { color: COLOR.ink }).setOrigin(0.5),
      );
    }
    return this.add.container(x, y, parts);
  }

  private open(def: CharacterDef) {
    const data: CharacterSceneData = { id: def.id, skin: progress.character.id === def.id ? progress.skin : 0 };
    this.scene.start('CharacterScene', data);
  }
}
