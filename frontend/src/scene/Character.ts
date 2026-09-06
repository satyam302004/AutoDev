/* Full agent character — movement, state machine, effects. */

import { Container, Graphics } from 'pixi.js';
import { CharacterSprite, type Direction } from './CharacterSprite';
import { ThoughtBubble } from './ThoughtBubble';
import { ToolBubble } from './ToolBubble';
import { findPath, type Walkable, type Point } from './pathfinding';
import { TILE_SIZE } from './OfficeMap';
import type { AgentKey } from './cast';
import type { Texture } from 'pixi.js';

const SPEED = 48;
const ROAM_PAUSE_MIN = 1.5;
const ROAM_PAUSE_MAX = 4;

type CharState = 'idle' | 'walk' | 'sit';

export class Character {
  public key: AgentKey;
  public label: string;
  public px: number;
  public py: number;
  public container: Container;
  public sprite: CharacterSprite;
  public thought: ThoughtBubble;
  public tool: ToolBubble;
  public workGlow: Graphics;
  public statusGlyph: Graphics;

  private map: Walkable;
  private state: CharState = 'idle';
  private direction: Direction = 'down';
  private path: Point[] = [];
  private pathIndex = 0;
  private deskTile: Point | null = null;
  private working = false;
  private glowElapsed = 0;
  private roamPauseTimer = 0;
  private roamPaused = true;

  constructor(key: AgentKey, label: string, frames: Texture[][], map: Walkable, px: number, py: number) {
    this.key = key;
    this.label = label;
    this.map = map;
    this.px = px * TILE_SIZE;
    this.py = py * TILE_SIZE;

    this.container = new Container();
    this.sprite = new CharacterSprite(frames);
    this.thought = new ThoughtBubble();
    this.tool = new ToolBubble();
    this.workGlow = new Graphics();
    this.statusGlyph = new Graphics();

    this.container.addChild(this.workGlow);
    this.container.addChild(this.sprite.getContainer());
    this.container.addChild(this.thought.container);
    this.container.addChild(this.tool.container);
    this.container.addChild(this.statusGlyph);

    this.container.x = this.px;
    this.container.y = this.py;
    this.container.zIndex = this.py;
  }

  setDesk(tileX: number, tileY: number) {
    this.deskTile = { x: tileX, y: tileY };
  }

  setWorking(w: boolean) {
    if (this.working === w) return;
    this.working = w;

    if (w) {
      this.thought.showWorking();
      this.roamPaused = false;
      this.walkToDesk();
    } else {
      this.thought.hide();
      this.sprite.clearCrop();
      this.path = [];
      this.pathIndex = 0;
      this.state = 'idle';
      this.sprite.setState('idle');
      this.roamPaused = true;
      this.roamPauseTimer = 0;
    }
  }

  private walkToDesk() {
    if (!this.deskTile) return;

    const dx = Math.round(this.px / TILE_SIZE) - this.deskTile.x;
    const dy = Math.round(this.py / TILE_SIZE) - this.deskTile.y;

    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      this.sprite.setSeatedCrop(6);
      this.state = 'sit';
      this.sprite.setState('idle');
    } else {
      const start: Point = { x: Math.round(this.px / TILE_SIZE), y: Math.round(this.py / TILE_SIZE) };
      const goal: Point = { x: this.deskTile.x, y: this.deskTile.y };
      const path = findPath(this.map, start, goal);
      if (path && path.length > 0) {
        this.path = path;
        this.pathIndex = 0;
        this.state = 'walk';
        this.sprite.setState('walk');
      } else {
        this.state = 'idle';
        this.sprite.setState('idle');
        this.roamPaused = true;
        this.roamPauseTimer = 0;
      }
    }
  }

  private pickRoamDestination() {
    for (let attempts = 0; attempts < 30; attempts++) {
      const rx = 3 + Math.floor(Math.random() * (this.map.width - 6));
      const ry = 3 + Math.floor(Math.random() * (this.map.height - 6));
      if (this.map.isWalkable(rx, ry)) {
        this.moveTo(rx, ry);
        return;
      }
    }
  }

  setStatus(status: string) {
    this.statusGlyph.clear();
    if (status === 'blocked') {
      this.statusGlyph.circle(0, -30, 5);
      this.statusGlyph.fill({ color: 0xD96A62 });
      const text = new Graphics();
      text.rect(-1, -33, 2, 4);
      text.fill({ color: 0xFFFFFF });
      text.rect(-1, -28, 2, 2);
      text.fill({ color: 0xFFFFFF });
      this.statusGlyph.addChild(text);
    } else if (status === 'success') {
      this.drawSparkle();
    }
  }

  setThought(text: string) {
    this.thought.showText(text);
  }

  showWorking() {
    this.thought.showWorking();
  }

  showDots() {
    this.thought.showDots();
  }

  hideThought() {
    this.thought.hide();
  }

  showTool(tool: string, target?: string) {
    this.tool.showTool(tool, target);
  }

  hideTool() {
    this.tool.hide();
  }

  moveTo(tileX: number, tileY: number) {
    const start: Point = { x: Math.round(this.px / TILE_SIZE), y: Math.round(this.py / TILE_SIZE) };
    const goal: Point = { x: tileX, y: tileY };
    const path = findPath(this.map, start, goal);
    if (path && path.length > 0) {
      this.path = path;
      this.pathIndex = 0;
      this.state = 'walk';
      this.sprite.setState('walk');
    }
  }

  sitAtDesk(tileX: number, tileY: number) {
    this.deskTile = { x: tileX, y: tileY };
    this.moveTo(tileX, tileY + 1);
  }

  private drawSparkle() {
    const g = this.statusGlyph;
    g.clear();
    const points = [
      { x: 0, y: -34 }, { x: 3, y: -31 }, { x: 0, y: -28 }, { x: -3, y: -31 },
    ];
    g.moveTo(points[0].x, points[0].y);
    for (const p of points) g.lineTo(p.x, p.y);
    g.closePath();
    g.fill({ color: 0x5CA97A });
  }

  private updatePath(dt: number) {
    if (this.pathIndex >= this.path.length) {
      this.path = [];

      if (this.working && this.deskTile) {
        const dx = Math.round(this.px / TILE_SIZE) - this.deskTile.x;
        const dy = Math.round(this.py / TILE_SIZE) - this.deskTile.y;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
          this.sprite.setSeatedCrop(6);
          this.state = 'sit';
          this.sprite.setState('idle');
          return;
        } else {
          this.walkToDesk();
          return;
        }
      }

      if (!this.working) {
        this.state = 'idle';
        this.sprite.setState('idle');
        this.roamPaused = true;
        this.roamPauseTimer = 0;
        return;
      }

      this.state = 'idle';
      this.sprite.setState('idle');
      return;
    }

    const target = this.path[this.pathIndex];
    const targetPx = target.x * TILE_SIZE;
    const targetPy = target.y * TILE_SIZE;
    const dx = targetPx - this.px;
    const dy = targetPy - this.py;
    const dist = Math.hypot(dx, dy);

    if (dist < 1) {
      this.pathIndex++;
      return;
    }

    const step = Math.min(SPEED * dt, dist);
    this.px += (dx / dist) * step;
    this.py += (dy / dist) * step;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left';
    } else {
      this.direction = dy > 0 ? 'down' : 'up';
    }
    this.sprite.setDirection(this.direction);

    this.container.x = this.px;
    this.container.y = this.py;
    this.container.zIndex = this.py;
  }

  private updateIdle(dt: number) {
    if (this.roamPaused) {
      this.roamPauseTimer += dt;
      const pauseDuration = ROAM_PAUSE_MIN + Math.random() * (ROAM_PAUSE_MAX - ROAM_PAUSE_MIN);
      if (this.roamPauseTimer >= pauseDuration) {
        this.roamPaused = false;
        this.pickRoamDestination();
      }
    }
  }

  private updateWorkGlow(dt: number) {
    if (!this.working || this.state !== 'sit') {
      this.workGlow.clear();
      return;
    }

    this.glowElapsed += dt;
    const phase = (Math.sin((this.glowElapsed * Math.PI) / 0.6) + 1) / 2;
    const alpha = 0.15 + 0.25 * phase;

    this.workGlow.clear();
    this.workGlow.ellipse(0, 4, 14, 6);
    this.workGlow.fill({ color: 0x4F9FAF, alpha });
  }

  update(dt: number) {
    if (this.state === 'walk') {
      this.updatePath(dt);
    } else if (this.state === 'idle' && !this.working) {
      this.updateIdle(dt);
    }

    this.sprite.update(dt);
    this.thought.update(dt);
    this.tool.update(dt);
    this.updateWorkGlow(dt);

    if (this.statusGlyph.children.length > 0) {
      this.statusGlyph.alpha = 0.7 + Math.sin(Date.now() / 200) * 0.3;
    }
  }
}
