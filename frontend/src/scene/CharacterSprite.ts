/* Animated sprite wrapper for character walk/idle cycles. */

import { Container, Graphics, Sprite, Texture } from 'pixi.js';

export type Direction = 'down' | 'up' | 'right' | 'left';
export type AnimState = 'walk' | 'type' | 'read' | 'idle';

const DIRECTION_ROW: Record<Direction, number> = { down: 0, up: 1, right: 2, left: 2 };

const ANIM_FRAMES: Record<AnimState, number[]> = {
  walk: [0, 1, 2, 1],
  type: [0, 1, 2, 1],
  read: [0, 1, 2, 1],
  idle: [0],
};

const ANIM_SPEED: Record<AnimState, number> = {
  walk: 0.15,
  idle: 0.08,
  type: 0.06,
  read: 0.06,
};

const CHAR_SCALE = 1.8;

export class CharacterSprite {
  public container: Container;
  public sprite: Sprite;
  private cropMask: Graphics;
  private frames: Texture[][];
  private direction: Direction = 'down';
  private state: AnimState = 'idle';
  private frameIndex = 0;
  private frameTimer = 0;
  private flipped = false;

  constructor(frames: Texture[][]) {
    this.frames = frames;
    this.container = new Container();
    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(CHAR_SCALE);
    this.cropMask = new Graphics();
    this.container.addChild(this.sprite);
    this.showFrame(0);
  }

  setState(state: AnimState) {
    if (this.state !== state) {
      this.state = state;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  setDirection(dir: Direction) {
    this.direction = dir;
    this.flipped = dir === 'left';
    this.sprite.scale.x = this.flipped ? -CHAR_SCALE : CHAR_SCALE;
  }

  setSeatedCrop(cropPx: number) {
    const w = this.sprite.width;
    const h = this.sprite.height;
    this.cropMask.rect(-w / 2 - 2, -h - 2, w + 4, h - cropPx + 2).fill(0xffffff);
    this.sprite.mask = this.cropMask;
    if (!this.container.children.includes(this.cropMask)) {
      this.container.addChild(this.cropMask);
    }
  }

  clearCrop() {
    this.sprite.mask = null;
    if (this.container.children.includes(this.cropMask)) {
      this.container.removeChild(this.cropMask);
    }
  }

  private showFrame(index: number) {
    const row = this.frames[DIRECTION_ROW[this.direction]];
    if (row && row[index]) {
      this.sprite.texture = row[index];
    }
  }

  update(dt: number) {
    const sequence = ANIM_FRAMES[this.state];
    const speed = ANIM_SPEED[this.state];

    this.frameTimer += dt;
    if (this.frameTimer >= speed) {
      this.frameTimer -= speed;
      this.frameIndex = (this.frameIndex + 1) % sequence.length;
      this.showFrame(sequence[this.frameIndex]);
    }
  }

  getContainer(): Container {
    return this.container;
  }
}
