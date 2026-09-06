/* AutoDEV agent cast roster + procedural frame generation. */

import { Texture } from 'pixi.js';
import { composeScene, PORTRAIT_W, SCENE_H, type PortraitRecipe } from '../design/portraitArt';

export type AgentKey =
  | 'project_manager'
  | 'requirements'
  | 'architecture'
  | 'planning'
  | 'backend'
  | 'frontend'
  | 'qa'
  | 'documentation'
  | 'report';

export interface CastMember {
  key: AgentKey;
  label: string;
  shirt: string;
  recipe: PortraitRecipe;
}

export const CAST: CastMember[] = [
  {
    key: 'project_manager',
    label: 'PM',
    shirt: '#5a6b8c',
    recipe: {
      skin: 'tan', hair: 'frame', hairColor: [100, 60, 30],
      cloth: 'dressshirt', clothAccent: [80, 120, 180], clothShirt: [255, 255, 255],
      face: { mouth: 'smile' },
    },
  },
  {
    key: 'requirements',
    label: 'REQ',
    shirt: '#9caf88',
    recipe: {
      skin: 'brown', hair: 'bun', hairColor: [30, 20, 10],
      cloth: 'blouse', clothAccent: [160, 80, 120], clothShirt: [240, 230, 220],
      face: { mouth: 'smile' },
    },
  },
  {
    key: 'architecture',
    label: 'ARCH',
    shirt: '#b89b3e',
    recipe: {
      skin: 'dark', hair: 'spiky', hairColor: [20, 15, 10],
      cloth: 'sweater', clothAccent: [80, 80, 100], clothShirt: [200, 200, 210],
      face: { glasses: true, mouth: 'neutral' },
    },
  },
  {
    key: 'planning',
    label: 'PLAN',
    shirt: '#8a86a6',
    recipe: {
      skin: 'light', hair: 'recede', hairColor: [100, 80, 60],
      cloth: 'suit', clothAccent: [60, 60, 70], clothShirt: [200, 210, 220],
      face: { glasses: true, mouth: 'neutral', heavy: true },
    },
  },
  {
    key: 'backend',
    label: 'BACK',
    shirt: '#4a7ab5',
    recipe: {
      skin: 'tan', hair: 'messy', hairColor: [50, 35, 25],
      cloth: 'polo', clothAccent: [70, 130, 90], clothShirt: [240, 240, 240],
      face: { facial: 'stubble', mouth: 'neutral' },
    },
  },
  {
    key: 'frontend',
    label: 'FRONT',
    shirt: '#7a4b6b',
    recipe: {
      skin: 'light', hair: 'floppy', hairColor: [140, 100, 60],
      cloth: 'cardigan', clothAccent: [120, 100, 160], clothShirt: [250, 245, 240],
      face: { mouth: 'smile' },
    },
  },
  {
    key: 'qa',
    label: 'QA',
    shirt: '#8c5a4b',
    recipe: {
      skin: 'brown', hair: 'short', hairColor: [25, 18, 12],
      cloth: 'dressshirt', clothAccent: [180, 60, 60], clothShirt: [255, 255, 255],
      face: { facial: 'goatee', mouth: 'neutral' },
    },
  },
  {
    key: 'documentation',
    label: 'DOCS',
    shirt: '#b08bbf',
    recipe: {
      skin: 'light', hair: 'curly', hairColor: [80, 50, 30],
      cloth: 'blouse', clothAccent: [100, 150, 180], clothShirt: [245, 240, 235],
      face: { glasses: true, mouth: 'smile' },
    },
  },
  {
    key: 'report',
    label: 'RPT',
    shirt: '#9a8c5a',
    recipe: {
      skin: 'dark', hair: 'bald', hairColor: [30, 25, 20],
      cloth: 'suit', clothAccent: [50, 50, 60], clothShirt: [255, 255, 255],
      face: { facial: 'mustache', mouth: 'neutral' },
    },
  },
];

const SCENE_W = PORTRAIT_W; // 18
const PHASE_COUNT = 3;

const frameCache = new Map<string, Texture[][]>();

function bufToTexture(buf: Uint8Array): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = SCENE_W;
  canvas.height = SCENE_H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(SCENE_W, SCENE_H);
  for (let i = 0; i < SCENE_W * SCENE_H; i++) {
    const r = buf[i * 3], g = buf[i * 3 + 1], b = buf[i * 3 + 2];
    if (r === 0 && g === 0 && b === 0) {
      img.data[i * 4 + 3] = 0;
    } else {
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  return tex;
}

/**
 * Returns 3 rows (down, up, right) x 7 frames per row.
 * Frames: [walk1, walk2, walk3, type1, type2, read1, read2]
 */
export function getCastFrames(key: AgentKey): Texture[][] {
  const cached = frameCache.get(key);
  if (cached) return cached;

  const member = CAST.find((c) => c.key === key);
  if (!member) return frameCache.get('project_manager')!;

  const rows: Texture[][] = [];

  for (let dir = 0; dir < 3; dir++) {
    const frames: Texture[] = [];
    for (let phase = 0; phase < PHASE_COUNT; phase++) {
      const buf = composeScene(member.recipe, dir, phase);
      frames.push(bufToTexture(buf));
    }
    // Duplicate phase 0 for type/read/idle frames
    frames.push(frames[0], frames[0], frames[0], frames[0]);
    rows.push(frames);
  }

  frameCache.set(key, rows);
  return rows;
}

export function getCastMember(key: AgentKey): CastMember | undefined {
  return CAST.find((c) => c.key === key);
}
