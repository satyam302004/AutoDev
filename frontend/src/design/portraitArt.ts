/* AutoDEV procedural pixel portrait generator (18×28 bust, 18×32 scene).
 * Modeled after Munder Difflin's portraitArt.ts — composites body, clothing,
 * head, face, hair, and accessories into a tiny pixel buffer, then the
 * SpritePortrait component blits it scaled with nearest-neighbor. */

export const PORTRAIT_W = 18;
export const PORTRAIT_H = 28;
export const SCENE_W = 18;
export const SCENE_H = 32;

/* ── colour palettes ─────────────────────────────────────────────── */

type RGB = [number, number, number];

interface SkinPalette {
  hi: RGB;
  base: RGB;
  shadow: RGB;
  line: RGB;
}

const SKINS: Record<string, SkinPalette> = {
  light: { hi: [255, 230, 200], base: [240, 200, 160], shadow: [210, 160, 120], line: [120, 80, 50] },
  tan:   { hi: [230, 190, 140], base: [200, 160, 110], shadow: [170, 120, 80],  line: [90, 55, 30] },
  brown: { hi: [180, 120, 80],  base: [150, 95, 60],   shadow: [110, 70, 40],  line: [60, 35, 20] },
  dark:  { hi: [130, 85, 55],   base: [100, 65, 40],   shadow: [70, 45, 25],   line: [40, 25, 15] },
};

type HairStyle = (buf: Uint8Array, color: RGB, skinBase: RGB, args: Record<string, number>) => void;

function rect(buf: Uint8Array, x0: number, y0: number, x1: number, y1: number, c: RGB) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x >= 0 && x < PORTRAIT_W && y >= 0 && y < PORTRAIT_H) {
        const i = (y * PORTRAIT_W + x) * 3;
        buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
      }
    }
  }
}

function dot(buf: Uint8Array, x: number, y: number, c: RGB) {
  if (x >= 0 && x < PORTRAIT_W && y >= 0 && y < PORTRAIT_H) {
    const i = (y * PORTRAIT_W + x) * 3;
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
  }
}

/* ── hair styles ──────────────────────────────────────────────────── */

const HX0 = 5, HX1 = 12; // head x range

const styleShort: HairFn = (buf, color, _skin, _a) => {
  rect(buf, HX0, 2, HX1, 4, color);
  dot(buf, HX0 - 1, 3, color);
  dot(buf, HX1 + 1, 3, color);
};

const styleFloppy: HairFn = (buf, color, _skin, a) => {
  const len = a.length ?? 14;
  rect(buf, HX0 - 1, 2, HX1 + 1, 5, color);
  for (let y = 5; y <= len; y++) {
    dot(buf, HX0 - 1, y, color);
    dot(buf, HX1 + 1, y, color);
  }
};

const styleFrame: HairFn = (buf, color, _skin, a) => {
  const len = a.length ?? 17;
  const vol = a.vol ?? 1;
  rect(buf, HX0 - 1, 2, HX1 + 1, 5, color);
  for (let y = 5; y <= len; y++) {
    for (let dx = 0; dx <= vol; dx++) {
      dot(buf, HX0 - 1 - dx, y, color);
      dot(buf, HX1 + 1 + dx, y, color);
    }
  }
};

const styleBun: HairFn = (buf, color, _skin, _a) => {
  rect(buf, HX0, 2, HX1, 4, color);
  rect(buf, HX0 + 2, 0, HX1 - 2, 2, color); // bun on top
};

const styleCurly: HairFn = (buf, color, _skin, _a) => {
  rect(buf, HX0 - 1, 2, HX1 + 1, 5, color);
  // curly bumps
  for (let x = HX0 - 2; x <= HX1 + 2; x += 2) {
    dot(buf, x, 6, color);
    dot(buf, x, 7, color);
  }
};

const styleMessy: HairFn = (buf, color, _skin, _a) => {
  rect(buf, HX0 - 1, 2, HX1 + 1, 5, color);
  dot(buf, HX0 - 2, 2, color);
  dot(buf, HX1 + 2, 3, color);
  dot(buf, HX0, 1, color);
  dot(buf, HX1, 1, color);
};

const styleRecede: HairFn = (buf, color, _skin, _a) => {
  rect(buf, HX0, 3, HX1, 5, color);
  dot(buf, HX0 - 1, 4, color);
  dot(buf, HX1 + 1, 4, color);
};

const styleSpiky: HairFn = (buf, color, _skin, _a) => {
  rect(buf, HX0, 2, HX1, 4, color);
  dot(buf, HX0, 1, color);
  dot(buf, HX0 + 2, 0, color);
  dot(buf, HX1, 1, color);
  dot(buf, HX1 - 2, 0, color);
};

const styleBald: HairFn = (_buf, _color, _skin, _a) => {};

type HairFn = HairStyle;

const HAIR_STYLES: Record<string, HairFn> = {
  short: styleShort,
  floppy: styleFloppy,
  frame: styleFrame,
  bun: styleBun,
  curly: styleCurly,
  messy: styleMessy,
  recede: styleRecede,
  spiky: styleSpiky,
  bald: styleBald,
};

/* ── clothing ─────────────────────────────────────────────────────── */

type ClothType = 'suit' | 'dressshirt' | 'polo' | 'blouse' | 'cardigan' | 'sweater';

function clothing(buf: Uint8Array, type: ClothType, accent: RGB, shirt: RGB) {
  const bodyY0 = 21, bodyY1 = 27;
  switch (type) {
    case 'suit':
      rect(buf, 3, bodyY0, 14, bodyY1, accent);
      rect(buf, 7, bodyY0, 10, bodyY1, shirt); // shirt showing
      dot(buf, 8, bodyY0, [0, 0, 0]); // tie dot
      dot(buf, 9, bodyY0, [0, 0, 0]);
      break;
    case 'dressshirt':
      rect(buf, 3, bodyY0, 14, bodyY1, shirt);
      rect(buf, 7, bodyY0, 10, bodyY0 + 1, accent); // collar
      break;
    case 'polo':
      rect(buf, 3, bodyY0, 14, bodyY1, accent);
      rect(buf, 7, bodyY0, 10, bodyY0 + 2, shirt);
      break;
    case 'blouse':
      rect(buf, 3, bodyY0, 14, bodyY1, shirt);
      rect(buf, 3, bodyY0, 5, bodyY1, accent); // left panel
      break;
    case 'cardigan':
      rect(buf, 3, bodyY0, 14, bodyY1, accent);
      rect(buf, 7, bodyY0 + 1, 10, bodyY1, shirt);
      break;
    case 'sweater':
      rect(buf, 3, bodyY0, 14, bodyY1, accent);
      rect(buf, 7, bodyY0, 10, bodyY0 + 1, [accent[0] - 20, accent[1] - 20, accent[2] - 20]);
      break;
  }
}

/* ── body shape ───────────────────────────────────────────────────── */

function bodyShape(buf: Uint8Array, skinBase: RGB) {
  // neck
  rect(buf, 7, 18, 10, 20, skinBase);
  // shoulders
  rect(buf, 3, 21, 14, 27, skinBase);
  // arms
  rect(buf, 1, 22, 2, 27, skinBase);
  rect(buf, 15, 22, 16, 27, skinBase);
}

/* ── head ─────────────────────────────────────────────────────────── */

function head(buf: Uint8Array, skin: SkinPalette) {
  rect(buf, 5, 6, 12, 16, skin.base);
  rect(buf, 5, 6, 12, 7, skin.hi);   // forehead highlight
  rect(buf, 5, 15, 12, 16, skin.shadow); // jaw shadow
  // ears
  dot(buf, 4, 10, skin.base);
  dot(buf, 4, 11, skin.shadow);
  dot(buf, 13, 10, skin.base);
  dot(buf, 13, 11, skin.shadow);
}

/* ── face ─────────────────────────────────────────────────────────── */

interface FaceOpts {
  glasses?: boolean;
  facial?: 'mustache' | 'stubble' | 'goatee';
  mouth?: 'smile' | 'neutral' | 'frown';
  heavy?: boolean;
}

function face(buf: Uint8Array, skin: SkinPalette, opts: FaceOpts) {
  const ink = skin.line;
  // eyes
  dot(buf, 7, 10, [255, 255, 255]);
  dot(buf, 10, 10, [255, 255, 255]);
  dot(buf, 8, 10, ink);
  dot(buf, 11, 10, ink);
  // eyebrows
  dot(buf, 7, 9, ink);
  dot(buf, 8, 9, ink);
  dot(buf, 10, 9, ink);
  dot(buf, 11, 9, ink);
  // nose
  dot(buf, 9, 12, skin.shadow);
  dot(buf, 8, 13, skin.shadow);
  // mouth
  const mouthStyle = opts.mouth ?? 'neutral';
  if (mouthStyle === 'smile') {
    dot(buf, 8, 14, ink);
    dot(buf, 9, 15, ink);
    dot(buf, 10, 14, ink);
  } else if (mouthStyle === 'frown') {
    dot(buf, 8, 15, ink);
    dot(buf, 9, 14, ink);
    dot(buf, 10, 15, ink);
  } else {
    dot(buf, 8, 15, ink);
    dot(buf, 9, 15, ink);
    dot(buf, 10, 15, ink);
  }
  // facial hair
  if (opts.facial === 'mustache') {
    rect(buf, 7, 14, 10, 14, ink);
  } else if (opts.facial === 'goatee') {
    rect(buf, 8, 15, 9, 16, ink);
  } else if (opts.facial === 'stubble') {
    for (let x = 7; x <= 10; x++) {
      for (let y = 14; y <= 16; y++) {
        if ((x + y) % 2 === 0) dot(buf, x, y, skin.shadow);
      }
    }
  }
  // glasses
  if (opts.glasses) {
    rect(buf, 6, 10, 8, 11, ink);
    rect(buf, 10, 10, 12, 11, ink);
    dot(buf, 9, 10, ink);
  }
  // heavy build
  if (opts.heavy) {
    rect(buf, 4, 11, 5, 14, skin.base);
    rect(buf, 12, 11, 13, 14, skin.base);
  }
}

/* ── outline pass ─────────────────────────────────────────────────── */

function outlinePass(buf: Uint8Array, line: RGB) {
  for (let y = 0; y < PORTRAIT_H; y++) {
    for (let x = 0; x < PORTRAIT_W; x++) {
      const i = (y * PORTRAIT_W + x) * 3;
      const r = buf[i], g = buf[i + 1], b = buf[i + 2];
      if (r === 0 && g === 0 && b === 0) continue; // already outline
      // check if on edge
      const above = y > 0 ? ((y - 1) * PORTRAIT_W + x) * 3 : -1;
      const below = y < PORTRAIT_H - 1 ? ((y + 1) * PORTRAIT_W + x) * 3 : -1;
      const left = x > 0 ? (y * PORTRAIT_W + (x - 1)) * 3 : -1;
      const right = x < PORTRAIT_W - 1 ? (y * PORTRAIT_W + (x + 1)) * 3 : -1;
      const isEmpty = (idx: number) => idx >= 0 && buf[idx] === 0 && buf[idx + 1] === 0 && buf[idx + 2] === 0;
      if (isEmpty(above) || isEmpty(below) || isEmpty(left) || isEmpty(right)) {
        buf[i] = line[0]; buf[i + 1] = line[1]; buf[i + 2] = line[2];
      }
    }
  }
}

/* ── compose ──────────────────────────────────────────────────────── */

export interface PortraitRecipe {
  skin: 'light' | 'tan' | 'brown' | 'dark';
  hair: string;
  hairColor: RGB;
  cloth: ClothType;
  clothAccent: RGB;
  clothShirt: RGB;
  face: FaceOpts;
}

export function compose(recipe: PortraitRecipe): Uint8Array {
  const buf = new Uint8Array(PORTRAIT_W * PORTRAIT_H * 3);
  const skin = SKINS[recipe.skin];
  const hairFn = HAIR_STYLES[recipe.hair] ?? styleShort;

  bodyShape(buf, skin.base);
  clothing(buf, recipe.cloth, recipe.clothAccent, recipe.clothShirt);
  head(buf, skin);
  face(buf, skin, recipe.face);
  hairFn(buf, recipe.hairColor, skin.base, {});
  outlinePass(buf, skin.line);

  return buf;
}

/* ── scene legs ──────────────────────────────────────────────────── */

function sceneLegs(buf: Uint8Array, _skinBase: RGB, pants: RGB, phase: number) {
  const y0 = 28, y1 = 31;
  // pants
  rect(buf, 5, y0, 7, y1, pants);
  rect(buf, 10, y0, 12, y1, pants);
  // shoes
  dot(buf, 5, y1, [40, 30, 20]);
  dot(buf, 6, y1, [40, 30, 20]);
  dot(buf, 11, y1, [40, 30, 20]);
  dot(buf, 12, y1, [40, 30, 20]);
  // walk phase leg lift
  if (phase === 1) {
    dot(buf, 5, y1, pants);
    dot(buf, 6, y1, pants);
    dot(buf, 11, y1 - 1, [40, 30, 20]);
    dot(buf, 12, y1 - 1, [40, 30, 20]);
  } else if (phase === 2) {
    dot(buf, 11, y1, pants);
    dot(buf, 12, y1, pants);
    dot(buf, 5, y1 - 1, [40, 30, 20]);
    dot(buf, 6, y1 - 1, [40, 30, 20]);
  }
}

/* ── scene back view ─────────────────────────────────────────────── */

function sceneBack(buf: Uint8Array, skin: SkinPalette, hairColor: RGB, clothType: ClothType, clothAccent: RGB, clothShirt: RGB) {
  // neck
  rect(buf, 7, 18, 10, 20, skin.base);
  // shoulders
  rect(buf, 3, 21, 14, 27, skin.base);
  // arms
  rect(buf, 1, 22, 2, 27, skin.base);
  rect(buf, 15, 22, 16, 27, skin.base);
  // clothing back
  clothing(buf, clothType, clothAccent, clothShirt);
  // head back (hair covered)
  rect(buf, 5, 6, 12, 16, hairColor);
  rect(buf, 5, 6, 12, 7, [hairColor[0] + 20, hairColor[1] + 20, hairColor[2] + 20]);
  // nape
  rect(buf, 7, 16, 10, 17, skin.base);
}

/* ── compose scene frame ─────────────────────────────────────────── */

/**
 * Compose a full 18x32 scene sprite.
 * @param recipe - Character appearance
 * @param direction - 0=down, 1=up, 2=right
 * @param phase - 0=stand, 1=step-left, 2=step-right
 */
export function composeScene(recipe: PortraitRecipe, direction: number, phase: number): Uint8Array {
  const buf = new Uint8Array(SCENE_W * SCENE_H * 3);
  const skin = SKINS[recipe.skin];
  const hairFn = HAIR_STYLES[recipe.hair] ?? styleShort;
  const pants: RGB = [40, 40, 50];

  if (direction === 1) {
    // back view
    sceneBack(buf, skin, recipe.hairColor, recipe.cloth, recipe.clothAccent, recipe.clothShirt);
    sceneLegs(buf, skin.base, pants, phase);
  } else {
    // front view (direction 0) or right (direction 2, same as front for now)
    bodyShape(buf, skin.base);
    clothing(buf, recipe.cloth, recipe.clothAccent, recipe.clothShirt);
    head(buf, skin);
    face(buf, skin, recipe.face);
    hairFn(buf, recipe.hairColor, skin.base, {});
    sceneLegs(buf, skin.base, pants, phase);
    outlinePass(buf, skin.line);
  }

  return buf;
}

/* ── render to canvas ─────────────────────────────────────────────── */

export function renderPortrait(
  ctx: CanvasRenderingContext2D,
  recipe: PortraitRecipe,
  scale: number = 2,
) {
  const buf = compose(recipe);
  const offscreen = document.createElement('canvas');
  offscreen.width = PORTRAIT_W;
  offscreen.height = PORTRAIT_H;
  const offCtx = offscreen.getContext('2d')!;
  const imageData = offCtx.createImageData(PORTRAIT_W, PORTRAIT_H);
  for (let i = 0; i < PORTRAIT_W * PORTRAIT_H; i++) {
    const r = buf[i * 3], g = buf[i * 3 + 1], b = buf[i * 3 + 2];
    if (r === 0 && g === 0 && b === 0) {
      imageData.data[i * 4 + 3] = 0; // transparent
    } else {
      imageData.data[i * 4] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = 255;
    }
  }
  offCtx.putImageData(imageData, 0, 0);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, PORTRAIT_W * scale, PORTRAIT_H * scale);
  ctx.drawImage(offscreen, 0, 0, PORTRAIT_W * scale, PORTRAIT_H * scale);
}

/* ── agent recipes ────────────────────────────────────────────────── */

export const AGENT_RECIPES: Record<string, PortraitRecipe> = {
  project_manager: {
    skin: 'tan', hair: 'frame', hairColor: [100, 60, 30],
    cloth: 'dressshirt', clothAccent: [80, 120, 180], clothShirt: [255, 255, 255],
    face: { mouth: 'smile' },
  },
  requirements: {
    skin: 'brown', hair: 'bun', hairColor: [30, 20, 10],
    cloth: 'blouse', clothAccent: [160, 80, 120], clothShirt: [240, 230, 220],
    face: { mouth: 'smile' },
  },
  architecture: {
    skin: 'dark', hair: 'spiky', hairColor: [20, 15, 10],
    cloth: 'sweater', clothAccent: [80, 80, 100], clothShirt: [200, 200, 210],
    face: { glasses: true, mouth: 'neutral' },
  },
  planning: {
    skin: 'light', hair: 'recede', hairColor: [100, 80, 60],
    cloth: 'suit', clothAccent: [60, 60, 70], clothShirt: [200, 210, 220],
    face: { glasses: true, mouth: 'neutral', heavy: true },
  },
  backend: {
    skin: 'tan', hair: 'messy', hairColor: [50, 35, 25],
    cloth: 'polo', clothAccent: [70, 130, 90], clothShirt: [240, 240, 240],
    face: { facial: 'stubble', mouth: 'neutral' },
  },
  frontend: {
    skin: 'light', hair: 'floppy', hairColor: [140, 100, 60],
    cloth: 'cardigan', clothAccent: [120, 100, 160], clothShirt: [250, 245, 240],
    face: { mouth: 'smile' },
  },
  qa: {
    skin: 'brown', hair: 'short', hairColor: [25, 18, 12],
    cloth: 'dressshirt', clothAccent: [180, 60, 60], clothShirt: [255, 255, 255],
    face: { facial: 'goatee', mouth: 'neutral' },
  },
  documentation: {
    skin: 'light', hair: 'curly', hairColor: [80, 50, 30],
    cloth: 'blouse', clothAccent: [100, 150, 180], clothShirt: [245, 240, 235],
    face: { glasses: true, mouth: 'smile' },
  },
  report: {
    skin: 'dark', hair: 'bald', hairColor: [30, 25, 20],
    cloth: 'suit', clothAccent: [50, 50, 60], clothShirt: [255, 255, 255],
    face: { facial: 'mustache', mouth: 'neutral' },
  },
};
