/* Thought bubble above character heads. */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const PADDING_X = 6;
const PADDING_Y = 3;
const CORNER_RADIUS = 3;
const MAX_WIDTH = 120;
const OFFSET_Y = -38;
const FONT_SIZE = 10;
const FADE_IN_DURATION = 0.15;
const FADE_OUT_DURATION = 0.3;
const LINGER_DURATION = 1.5;
const DOTS_CYCLE_SPEED = 0.45;

type BubbleState = 'hidden' | 'fading-in' | 'visible' | 'lingering' | 'fading-out';

export class ThoughtBubble {
  public container: Container;
  private bg: Graphics;
  private text: Text;
  private tail1: Graphics;
  private tail2: Graphics;
  private state: BubbleState = 'hidden';
  private timer = 0;
  private lingerTimer = 0;
  private currentText = '';
  private dotPhase = 0;

  constructor() {
    this.container = new Container();
    this.container.alpha = 0;
    this.container.y = OFFSET_Y;

    this.bg = new Graphics();
    this.text = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Inter, sans-serif',
        fontSize: FONT_SIZE,
        fill: 0x1A1320,
        wordWrap: true,
        wordWrapWidth: MAX_WIDTH - PADDING_X * 2,
        breakWords: true,
      }),
    });
    this.tail1 = new Graphics();
    this.tail2 = new Graphics();

    this.container.addChild(this.bg, this.text, this.tail1, this.tail2);
  }

  showText(text: string) {
    if (text === this.currentText && (this.state === 'visible' || this.state === 'lingering')) return;
    this.currentText = text;
    this.text.text = text.length > 160 ? text.slice(0, 160) + '…' : text;
    this.dotPhase = 0;
    this.layout();
    this.state = 'fading-in';
    this.timer = 0;
  }

  showDots() {
    if (this.currentText === '...' && (this.state === 'visible' || this.state === 'lingering')) return;
    this.currentText = '...';
    this.text.text = '';
    this.dotPhase = 0;
    this.layout();
    this.state = 'fading-in';
    this.timer = 0;
  }

  showWorking() {
    if (this.currentText === 'working' && (this.state === 'visible' || this.state === 'lingering')) return;
    this.currentText = 'working';
    this.text.text = 'Working.';
    this.dotPhase = 0;
    this.layout();
    this.state = 'fading-in';
    this.timer = 0;
  }

  hide() {
    if (this.state === 'hidden' || this.state === 'fading-out') return;
    this.state = 'fading-out';
    this.timer = 0;
  }

  private layout() {
    const tw = Math.min(this.text.width || MAX_WIDTH, MAX_WIDTH);
    const th = this.text.height || 14;
    const w = tw + PADDING_X * 2;
    const h = th + PADDING_Y * 2;

    this.bg.clear();
    this.bg.roundRect(-w / 2, -h, w, h, CORNER_RADIUS);
    this.bg.fill({ color: 0xFFFDF5, alpha: 0.95 });
    this.bg.stroke({ color: 0x1A1320, width: 1, alpha: 0.8 });

    this.text.x = -tw / 2;
    this.text.y = -h + PADDING_Y;

    // tail puffs
    this.tail1.clear();
    this.tail1.circle(0, 4, 3);
    this.tail1.fill({ color: 0xFFFDF5, alpha: 0.95 });
    this.tail1.stroke({ color: 0x1A1320, width: 1, alpha: 0.8 });

    this.tail2.clear();
    this.tail2.circle(2, 8, 2);
    this.tail2.fill({ color: 0xFFFDF5, alpha: 0.95 });
    this.tail2.stroke({ color: 0x1A1320, width: 1, alpha: 0.8 });
  }

  update(dt: number) {
    if (this.state === 'hidden') return;

    this.timer += dt;

    switch (this.state) {
      case 'fading-in':
        this.container.alpha = Math.min(1, this.timer / FADE_IN_DURATION);
        if (this.timer >= FADE_IN_DURATION) {
          this.state = 'visible';
          this.timer = 0;
        }
        break;
      case 'visible':
        this.lingerTimer += dt;
        if (this.currentText === '...') {
          this.dotPhase += dt;
          const dots = '.'.repeat(1 + (Math.floor(this.dotPhase / DOTS_CYCLE_SPEED) % 3));
          this.text.text = dots;
          this.layout();
        } else if (this.currentText === 'working') {
          this.dotPhase += dt;
          const dots = '.'.repeat(1 + (Math.floor(this.dotPhase / DOTS_CYCLE_SPEED) % 3));
          this.text.text = 'Working' + dots;
          this.layout();
        }
        if (this.lingerTimer >= LINGER_DURATION) {
          this.state = 'lingering';
        }
        break;
      case 'lingering':
        if (this.currentText === '...') {
          this.dotPhase += dt;
          const dots = '.'.repeat(1 + (Math.floor(this.dotPhase / DOTS_CYCLE_SPEED) % 3));
          this.text.text = dots;
          this.layout();
        } else if (this.currentText === 'working') {
          this.dotPhase += dt;
          const dots = '.'.repeat(1 + (Math.floor(this.dotPhase / DOTS_CYCLE_SPEED) % 3));
          this.text.text = 'Working' + dots;
          this.layout();
        }
        break;
      case 'fading-out':
        this.container.alpha = Math.max(0, 1 - this.timer / FADE_OUT_DURATION);
        if (this.timer >= FADE_OUT_DURATION) {
          this.state = 'hidden';
          this.container.alpha = 0;
          this.currentText = '';
        }
        break;
    }
  }
}
