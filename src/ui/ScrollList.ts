import Phaser from 'phaser';
import { COLOR, DPR } from './Button';

export interface ScrollArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const BAR_W = 4;
const BAR_GAP = 4;

/**
 * A column of rows the finger drags up and down, clipped to its area, with a thin scrollbar at its
 * right. Rows go into `content` with coordinates relative to the area's top-left corner.
 */
export class ScrollList {
  readonly content: Phaser.GameObjects.Container;
  /** Off the display list, so the scene's clear does not reach it; `destroy` does. */
  private readonly maskShape: Phaser.GameObjects.Graphics;
  private readonly thumb: Phaser.GameObjects.Rectangle;
  private contentHeight = 0;
  private offset = 0;
  private dragStartY = 0;
  private dragStartOffset = 0;
  private dragging = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly area: ScrollArea,
    initialOffset = 0,
  ) {
    this.content = scene.add.container(area.x, area.y);
    this.maskShape = scene.make.graphics({}, false).fillRect(area.x, area.y, area.width, area.height);
    this.content.setMask(this.maskShape.createGeometryMask());
    const barX = area.x + area.width + BAR_GAP;
    scene.add.rectangle(barX, area.y, BAR_W, area.height, COLOR.bg2).setOrigin(0);
    this.thumb = scene.add.rectangle(barX, area.y, BAR_W, area.height, COLOR.line).setOrigin(0).setVisible(false);
    this.offset = initialOffset;

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }

  /** How far the list is scrolled down; pass it back in when the screen is rebuilt. */
  get scroll(): number {
    return this.offset;
  }

  /** Call once the rows are in; clamps the scroll and sizes the thumb. */
  setContentHeight(height: number) {
    this.contentHeight = height;
    this.scrollTo(this.offset);
  }

  /** Stops listening; call before the scene rebuilds, since its objects are destroyed with the rest. */
  destroy() {
    const { input } = this.scene;
    input.off('pointerdown', this.onDown, this);
    input.off('pointermove', this.onMove, this);
    input.off('pointerup', this.onUp, this);
    input.off('pointerupoutside', this.onUp, this);
    this.maskShape.destroy();
  }

  private get maxOffset(): number {
    return Math.max(0, this.contentHeight - this.area.height);
  }

  private scrollTo(offset: number) {
    this.offset = Phaser.Math.Clamp(offset, 0, this.maxOffset);
    this.content.setY(this.area.y - this.offset);
    const scrollable = this.maxOffset > 0;
    this.thumb.setVisible(scrollable);
    if (!scrollable) return;
    const thumbH = Math.max(BAR_W * 4, (this.area.height * this.area.height) / this.contentHeight);
    this.thumb.setSize(BAR_W, thumbH);
    this.thumb.setY(this.area.y + (this.area.height - thumbH) * (this.offset / this.maxOffset));
  }

  private onDown(pointer: Phaser.Input.Pointer) {
    // Pointers arrive in device pixels; the screen lays out in CSS pixels
    const x = pointer.x / DPR;
    const y = pointer.y / DPR;
    const { area } = this;
    if (x < area.x || x > area.x + area.width || y < area.y || y > area.y + area.height) return;
    this.dragging = true;
    this.dragStartY = y;
    this.dragStartOffset = this.offset;
  }

  private onMove(pointer: Phaser.Input.Pointer) {
    if (!this.dragging || !pointer.isDown) return;
    this.scrollTo(this.dragStartOffset - (pointer.y / DPR - this.dragStartY));
  }

  private onUp() {
    this.dragging = false;
  }
}
