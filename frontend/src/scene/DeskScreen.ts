/* Desk monitor overlay — shows lit screen when agent is seated. */

import { Container, Graphics } from 'pixi.js';

const SCREEN = { x: 2, y: 3, w: 12, h: 8 };

export class DeskScreen {
  public container: Container;
  private g: Graphics;
  private t = 0;
  private active = false;

  constructor() {
    this.container = new Container();
    this.g = new Graphics();
    this.container.addChild(this.g);
    this.drawOff();
  }

  setActive(active: boolean) {
    this.active = active;
    if (!active) this.drawOff();
  }

  private drawOff() {
    this.g.clear();
    this.g.rect(0, 0, 16, 16);
    this.g.fill({ color: 0x2A2530 });
    // dark screen
    this.g.rect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    this.g.fill({ color: 0x1A1320 });
  }

  private drawOn() {
    this.g.clear();
    // monitor frame
    this.g.rect(0, 0, 16, 16);
    this.g.fill({ color: 0x3A3540 });
    // screen
    this.g.rect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    this.g.fill({ color: 0x1A2030 });
    // scrolling text lines
    for (let i = 0; i < 2; i++) {
      const phase = (this.t * 3.2 + i * (SCREEN.h / 2)) % SCREEN.h;
      const w = 4 + ((i * 7 + Math.floor(this.t / 1.7)) % 8);
      this.g.rect(SCREEN.x + 2, Math.round(SCREEN.y + phase), w, 1);
      this.g.fill({ color: 0xCFE6FF, alpha: 0.5 });
    }
    // cursor
    if (Math.floor(this.t / 0.53) % 2 === 0) {
      this.g.rect(SCREEN.x + 2, SCREEN.y + SCREEN.h - 3, 2, 2);
      this.g.fill({ color: 0xFFFFFF, alpha: 0.9 });
    }
  }

  update(dt: number) {
    if (!this.active) return;
    this.t += dt;
    this.drawOn();
  }
}
