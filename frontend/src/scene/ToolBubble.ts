/* Tool/speech bubble for agent actions. */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const PADDING_X = 5;
const PADDING_Y = 3;
const MAX_WIDTH = 100;
const OFFSET_Y = -36;
const FONT_SIZE = 9;
const FADE_IN_DURATION = 0.12;
const FADE_OUT_DURATION = 0.2;
const LINGER_DURATION = 2.0;

type BubbleState = 'hidden' | 'fading-in' | 'visible' | 'lingering' | 'fading-out';

const TOOL_ICONS: Record<string, string> = {
  Read: '<',
  Edit: '>',
  Write: '>',
  Bash: '$',
  Grep: '?',
  Glob: '?',
  WebFetch: '@',
  WebSearch: '@',
  TodoWrite: '=',
};

export class ToolBubble {
  public container: Container;
  private bg: Graphics;
  private text: Text;
  private state: BubbleState = 'hidden';
  private timer = 0;
  private lingerTimer = 0;

  constructor() {
    this.container = new Container();
    this.container.alpha = 0;
    this.container.y = OFFSET_Y;

    this.bg = new Graphics();
    this.text = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: FONT_SIZE,
        fill: 0xFFFFFF,
        wordWrap: true,
        wordWrapWidth: MAX_WIDTH - PADDING_X * 2,
      }),
    });

    this.container.addChild(this.bg, this.text);
  }

  showTool(tool: string, target?: string) {
    const icon = TOOL_ICONS[tool] ?? '?';
    const label = target ? `${icon} ${target}` : icon;
    this.showText(label);
  }

  showText(text: string) {
    this.text.text = text.length > 80 ? text.slice(0, 80) + '…' : text;
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
    const th = this.text.height || 12;
    const w = tw + PADDING_X * 2;
    const h = th + PADDING_Y * 2;

    this.bg.clear();
    this.bg.roundRect(-w / 2, -h, w, h, 2);
    this.bg.fill({ color: 0x1A1320, alpha: 0.95 });

    this.text.x = -tw / 2;
    this.text.y = -h + PADDING_Y;
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
        if (this.lingerTimer >= LINGER_DURATION) {
          this.state = 'lingering';
        }
        break;
      case 'lingering':
        break;
      case 'fading-out':
        this.container.alpha = Math.max(0, 1 - this.timer / FADE_OUT_DURATION);
        if (this.timer >= FADE_OUT_DURATION) {
          this.state = 'hidden';
          this.container.alpha = 0;
        }
        break;
    }
  }
}
