/* Procedural office map generator — creates layout without external assets. */

import { Container, Graphics } from 'pixi.js';
import type { Walkable, Point } from './pathfinding';

export const TILE_SIZE = 16;

export interface DeskInfo {
  tileX: number;
  tileY: number;
  spawnX: number;
  spawnY: number;
  facing: 'down' | 'up' | 'left' | 'right';
}

export interface OfficeLayout {
  width: number;
  height: number;
  desks: DeskInfo[];
  entrance: Point;
  cafeSpots: Point[];
}

// 34 wide x 24 tall office
const MAP_W = 34;
const MAP_H = 24;

function generateLayout(): OfficeLayout {
  const desks: DeskInfo[] = [];

  // 3 rows of 3 desks each, spaced out
  const deskPositions = [
    // row 1 (y=4)
    { x: 5, y: 4 }, { x: 12, y: 4 }, { x: 19, y: 4 },
    // row 2 (y=10)
    { x: 5, y: 10 }, { x: 12, y: 10 }, { x: 19, y: 10 },
    // row 3 (y=16)
    { x: 5, y: 16 }, { x: 12, y: 16 }, { x: 19, y: 16 },
  ];

  for (const pos of deskPositions) {
    desks.push({
      tileX: pos.x,
      tileY: pos.y,
      spawnX: pos.x,
      spawnY: pos.y + 1, // chair right below desk
      facing: 'up',
    });
  }

  return {
    width: MAP_W,
    height: MAP_H,
    desks,
    entrance: { x: 16, y: 22 },
    cafeSpots: [
      { x: 27, y: 6 },
      { x: 29, y: 6 },
      { x: 27, y: 8 },
      { x: 29, y: 8 },
    ],
  };
}

export const OFFICE_LAYOUT = generateLayout();

export class OfficeMap implements Walkable {
  public width = MAP_W;
  public height = MAP_H;
  public container: Container;
  private collisionGrid: boolean[][];
  private floorLayer: Graphics;
  private wallLayer: Graphics;
  private furnitureLayer: Graphics;

  constructor() {
    this.container = new Container();
    this.container.sortableChildren = true;
    this.floorLayer = new Graphics();
    this.wallLayer = new Graphics();
    this.furnitureLayer = new Graphics();
    this.container.addChild(this.floorLayer, this.wallLayer, this.furnitureLayer);

    // init collision grid: everything walkable except walls
    this.collisionGrid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(true));

    this.drawFloor();
    this.drawWalls();
    this.drawFurniture();
    this.buildCollision();
  }

  private drawFloor() {
    const g = this.floorLayer;
    g.clear();

    // main floor — sage green with alternating tile shading
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const shade = (tx + ty) % 2 === 0 ? 0xA0B090 : 0x98A888;
        g.rect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        g.fill({ color: shade });
      }
    }

    // subtle grid lines
    for (let x = 0; x <= MAP_W; x++) {
      g.moveTo(x * TILE_SIZE, 0);
      g.lineTo(x * TILE_SIZE, MAP_H * TILE_SIZE);
      g.stroke({ color: 0x90A078, width: 1, alpha: 0.3 });
    }
    for (let y = 0; y <= MAP_H; y++) {
      g.moveTo(0, y * TILE_SIZE);
      g.lineTo(MAP_W * TILE_SIZE, y * TILE_SIZE);
      g.stroke({ color: 0x90A078, width: 1, alpha: 0.3 });
    }

    // cafe area rug
    g.roundRect(25 * TILE_SIZE, 4 * TILE_SIZE, 7 * TILE_SIZE, 6 * TILE_SIZE, 4);
    g.fill({ color: 0x8BA898, alpha: 0.5 });
  }

  private drawWalls() {
    const g = this.wallLayer;
    g.clear();

    // top wall
    g.rect(0, 0, MAP_W * TILE_SIZE, TILE_SIZE);
    g.fill({ color: 0x3D2E4A });
    // bottom wall
    g.rect(0, (MAP_H - 1) * TILE_SIZE, MAP_W * TILE_SIZE, TILE_SIZE);
    g.fill({ color: 0x3D2E4A });
    // left wall
    g.rect(0, 0, TILE_SIZE, MAP_H * TILE_SIZE);
    g.fill({ color: 0x3D2E4A });
    // right wall
    g.rect((MAP_W - 1) * TILE_SIZE, 0, TILE_SIZE, MAP_H * TILE_SIZE);
    g.fill({ color: 0x3D2E4A });

    // baseboard
    g.rect(TILE_SIZE, TILE_SIZE, (MAP_W - 2) * TILE_SIZE, 2);
    g.fill({ color: 0x6B5878 });
    g.rect(TILE_SIZE, (MAP_H - 2) * TILE_SIZE, (MAP_W - 2) * TILE_SIZE, 2);
    g.fill({ color: 0x6B5878 });

    // windows on top wall
    const windowPositions = [6, 14, 22];
    for (const wx of windowPositions) {
      const x = wx * TILE_SIZE;
      // window frame
      g.rect(x, 0, TILE_SIZE * 2, TILE_SIZE);
      g.fill({ color: 0x6B5878 });
      // window glass
      g.rect(x + 2, 2, TILE_SIZE * 2 - 4, TILE_SIZE - 4);
      g.fill({ color: 0xC8D8E8 });
      // window divider
      g.rect(x + TILE_SIZE - 1, 1, 2, TILE_SIZE - 2);
      g.fill({ color: 0x6B5878 });
    }
  }

  private drawFurniture() {
    const g = this.furnitureLayer;
    g.clear();

    // desks with chairs
    for (const desk of OFFICE_LAYOUT.desks) {
      this.drawDesk(g, desk.tileX, desk.tileY);
      // chair below desk
      const cx = desk.tileX * TILE_SIZE + 4;
      const cy = (desk.tileY + 1) * TILE_SIZE + 10;
      g.roundRect(cx, cy, 8, 5, 1);
      g.fill({ color: 0x6B5040 });
      g.stroke({ color: 0x4A3528, width: 0.5 });
    }

    // cafe table
    this.drawCafeTable(g, 27, 6);

    // filing cabinets against left wall
    this.drawCabinet(g, 1, 3);
    this.drawCabinet(g, 1, 5);

    // plants
    this.drawPlant(g, 1, 1);
    this.drawPlant(g, 32, 1);
    this.drawPlant(g, 32, 22);

    // whiteboard on right wall
    g.rect(31 * TILE_SIZE, 10 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE);
    g.fill({ color: 0xF0F0F0 });
    g.stroke({ color: 0x6B5878, width: 1 });
    // marker tray
    g.rect(31 * TILE_SIZE + 4, 10 * TILE_SIZE + TILE_SIZE - 3, TILE_SIZE * 2 - 8, 2);
    g.fill({ color: 0x6B5878 });

    // water cooler near cafe
    g.rect(25 * TILE_SIZE, 10 * TILE_SIZE, 6, 10);
    g.fill({ color: 0x4F9FAF });
    g.stroke({ color: 0x3A7A88, width: 0.5 });
    // water bottle
    g.rect(25 * TILE_SIZE + 1, 10 * TILE_SIZE - 4, 4, 5);
    g.fill({ color: 0xA0D8E8 });
    g.stroke({ color: 0x3A7A88, width: 0.5 });

    // bookshelf bottom-right
    g.rect(31 * TILE_SIZE, 18 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
    g.fill({ color: 0x8B7355 });
    g.stroke({ color: 0x5A4A35, width: 1 });
    // shelf dividers
    g.rect(31 * TILE_SIZE, 19 * TILE_SIZE, TILE_SIZE * 2, 1);
    g.fill({ color: 0x5A4A35 });
    // books (colored spines)
    const bookColors = [0xD96A62, 0x5CA97A, 0x4F9FAF, 0xDCAB3C, 0x9482D3];
    for (let i = 0; i < 5; i++) {
      g.rect(31 * TILE_SIZE + 2 + i * 5, 18 * TILE_SIZE + 2, 4, 7);
      g.fill({ color: bookColors[i] });
    }
    for (let i = 0; i < 4; i++) {
      g.rect(31 * TILE_SIZE + 4 + i * 6, 19 * TILE_SIZE + 2, 5, 7);
      g.fill({ color: bookColors[(i + 2) % 5] });
    }

    // trash bins
    this.drawTrashBin(g, 3, 22);
    this.drawTrashBin(g, 30, 22);

    // wall clock center top
    g.circle(16 * TILE_SIZE + 8, TILE_SIZE / 2, 5);
    g.fill({ color: 0xF0F0F0 });
    g.stroke({ color: 0x1A1320, width: 1 });
    // clock hands
    g.moveTo(16 * TILE_SIZE + 8, TILE_SIZE / 2);
    g.lineTo(16 * TILE_SIZE + 8, TILE_SIZE / 2 - 3);
    g.stroke({ color: 0x1A1320, width: 1 });
    g.moveTo(16 * TILE_SIZE + 8, TILE_SIZE / 2);
    g.lineTo(16 * TILE_SIZE + 10, TILE_SIZE / 2);
    g.stroke({ color: 0x1A1320, width: 1 });
  }

  private drawCabinet(g: Graphics, tx: number, ty: number) {
    const x = tx * TILE_SIZE;
    const y = ty * TILE_SIZE;
    g.rect(x, y, TILE_SIZE, TILE_SIZE);
    g.fill({ color: 0x8A8A90 });
    g.stroke({ color: 0x6A6A70, width: 1 });
    // drawers
    g.rect(x + 2, y + 2, TILE_SIZE - 4, 5);
    g.fill({ color: 0x9A9AA0 });
    g.rect(x + 2, y + 9, TILE_SIZE - 4, 5);
    g.fill({ color: 0x9A9AA0 });
    // handles
    g.rect(x + 6, y + 4, 3, 1);
    g.fill({ color: 0x5A5A60 });
    g.rect(x + 6, y + 11, 3, 1);
    g.fill({ color: 0x5A5A60 });
  }

  private drawPlant(g: Graphics, tx: number, ty: number) {
    const x = tx * TILE_SIZE;
    const y = ty * TILE_SIZE;
    // pot
    g.rect(x + 3, y + 8, 10, 7);
    g.fill({ color: 0x8B7355 });
    g.stroke({ color: 0x5A4A35, width: 0.5 });
    // leaves
    g.circle(x + 8, y + 6, 5);
    g.fill({ color: 0x5CA97A });
    g.circle(x + 5, y + 4, 3);
    g.fill({ color: 0x6BBA88 });
    g.circle(x + 11, y + 4, 3);
    g.fill({ color: 0x6BBA88 });
  }

  private drawTrashBin(g: Graphics, tx: number, ty: number) {
    const x = tx * TILE_SIZE;
    const y = ty * TILE_SIZE;
    g.rect(x + 3, y + 4, 10, 10);
    g.fill({ color: 0x4A4550 });
    g.stroke({ color: 0x3A3540, width: 0.5 });
    // rim
    g.rect(x + 2, y + 3, 12, 2);
    g.fill({ color: 0x5A5560 });
  }

  private drawDesk(g: Graphics, tx: number, ty: number) {
    const x = tx * TILE_SIZE;
    const y = ty * TILE_SIZE;

    // desk surface (2x1)
    g.rect(x, y, TILE_SIZE * 2, TILE_SIZE);
    g.fill({ color: 0x8B7355 });
    g.stroke({ color: 0x5A4A35, width: 1 });

    // monitor (on desk)
    g.rect(x + 4, y + 2, 10, 8);
    g.fill({ color: 0x2A2530 });
    g.stroke({ color: 0x1A1320, width: 1 });
    // screen
    g.rect(x + 5, y + 3, 8, 6);
    g.fill({ color: 0x1A2030 });

    // keyboard
    g.rect(x + 3, y + 11, 8, 3);
    g.fill({ color: 0x4A4550 });
  }

  private drawCafeTable(g: Graphics, tx: number, ty: number) {
    const x = tx * TILE_SIZE;
    const y = ty * TILE_SIZE;

    // table
    g.roundRect(x, y, TILE_SIZE * 2, TILE_SIZE * 2, 3);
    g.fill({ color: 0xA899B5 });
    g.stroke({ color: 0x6B5878, width: 1 });

    // cups
    g.circle(x + 6, y + 6, 2);
    g.fill({ color: 0xFFFFFF });
    g.stroke({ color: 0x1A1320, width: 0.5 });

    g.circle(x + 20, y + 18, 2);
    g.fill({ color: 0xFFFFFF });
    g.stroke({ color: 0x1A1320, width: 0.5 });
  }

  private buildCollision() {
    // walls are not walkable
    for (let x = 0; x < MAP_W; x++) {
      this.collisionGrid[0][x] = false;
      this.collisionGrid[MAP_H - 1][x] = false;
    }
    for (let y = 0; y < MAP_H; y++) {
      this.collisionGrid[y][0] = false;
      this.collisionGrid[y][MAP_W - 1] = false;
    }

    // desks are not walkable
    for (const desk of OFFICE_LAYOUT.desks) {
      this.collisionGrid[desk.tileY][desk.tileX] = false;
      this.collisionGrid[desk.tileY][desk.tileX + 1] = false;
    }

    // cafe table
    this.collisionGrid[6][27] = false;
    this.collisionGrid[6][28] = false;
    this.collisionGrid[7][27] = false;
    this.collisionGrid[7][28] = false;
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
    return this.collisionGrid[y][x];
  }

  getPixelWidth(): number {
    return MAP_W * TILE_SIZE;
  }

  getPixelHeight(): number {
    return MAP_H * TILE_SIZE;
  }
}
