/* Animated message envelope flying between agents. */

import { Container, Graphics } from 'pixi.js';

const ARC_LIFT = 30;
const SPEED = 200;
const MIN_DURATION = 0.6;
const MAX_DURATION = 1.8;
const FADE_IN = 0.12;
const FADE_OUT = 0.2;
const ENVELOPE_W = 10;
const ENVELOPE_H = 7;

const ACT_COLORS: Record<string, number> = {
  request: 0x4F9FAF,
  query: 0x9482D3,
  propose: 0xDCAB3C,
  inform: 0xF4E9C7,
  agree: 0x5CA97A,
  done: 0x5CA97A,
  refuse: 0xD96A62,
};

export class MessageEnvelope {
  public container: Container;
  private body: Graphics;
  private flap: Graphics;
  private start: { x: number; y: number };
  private end: { x: number; y: number };
  private elapsed = 0;
  private duration: number;
  private color: number;
  private done = false;

  constructor(
    start: { x: number; y: number },
    end: { x: number; y: number },
    act: string,
  ) {
    this.start = start;
    this.end = end;
    this.color = ACT_COLORS[act] ?? 0xF4E9C7;

    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    this.duration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, dist / SPEED));

    this.container = new Container();
    this.container.y = -22; // above feet

    this.body = new Graphics();
    this.flap = new Graphics();
    this.draw();

    this.container.addChild(this.body, this.flap);
  }

  private draw() {
    // body
    this.body.rect(-ENVELOPE_W / 2, -ENVELOPE_H / 2, ENVELOPE_W, ENVELOPE_H);
    this.body.fill({ color: 0xFFF8E7 });
    this.body.stroke({ color: 0x1A1320, width: 1 });

    // flap chevron
    this.flap.moveTo(-ENVELOPE_W / 2, -ENVELOPE_H / 2);
    this.flap.lineTo(0, ENVELOPE_H / 4);
    this.flap.lineTo(ENVELOPE_W / 2, -ENVELOPE_H / 2);
    this.flap.stroke({ color: this.color, width: 1.5 });
  }

  update(dt: number): boolean {
    if (this.done) return true;

    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / this.duration);

    // quadratic arc
    const x = this.start.x + (this.end.x - this.start.x) * t;
    const baseY = this.start.y + (this.end.y - this.start.y) * t;
    const arc = -ARC_LIFT * 4 * t * (1 - t);
    const y = baseY + arc;

    this.container.x = x;
    this.container.y = y - 22;

    // bob
    this.container.rotation = Math.sin(this.elapsed * 6) * 0.12;

    // fade
    if (t < FADE_IN) {
      this.container.alpha = t / FADE_IN;
    } else if (t > 1 - FADE_OUT) {
      this.container.alpha = (1 - t) / FADE_OUT;
    } else {
      this.container.alpha = 1;
    }

    if (t >= 1) {
      this.done = true;
      this.container.alpha = 0;
      return true;
    }
    return false;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
