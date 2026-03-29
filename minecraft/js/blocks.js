// ─────────────────────────────────────────────────────────
// BLOCK DEFINITIONS, TEXTURES, MATERIALS
// ─────────────────────────────────────────────────────────
import {
  makeTexture, makeCanvas,
  drawGrassTop, drawGrassSide, drawDirt, drawStone,
  drawWoodSide, drawWoodTop, drawLeaves, drawWater, drawSand,
} from './textures.js';

export const BLOCKS = {
  GRASS:  1,
  STONE:  2,
  DIRT:   3,
  WOOD:   4,
  LEAVES: 5,
  WATER:  6,
  SAND:   7,
};

export const BLOCK_NAMES = {
  1: 'Grass', 2: 'Stone', 3: 'Dirt',
  4: 'Wood',  5: 'Leaves', 6: 'Water', 7: 'Sand',
};

// [+x, -x, +y, -y, +z, -z] = [right, left, top, bottom, front, back]
export let blockTextures = {};

export function buildTextures() {
  const grassTop  = makeTexture(drawGrassTop);
  const grassSide = makeTexture(drawGrassSide);
  const grassBot  = makeTexture(drawDirt);
  const dirt      = makeTexture(drawDirt);
  const stone     = makeTexture(drawStone);
  const woodSide  = makeTexture(drawWoodSide);
  const woodTop   = makeTexture(drawWoodTop);
  const leaves    = makeTexture(drawLeaves);
  const water     = makeTexture(drawWater);
  const sand      = makeTexture(drawSand);

  blockTextures = {
    [BLOCKS.GRASS]:  [grassSide, grassSide, grassTop, grassBot, grassSide, grassSide],
    [BLOCKS.STONE]:  [stone,  stone,  stone,  stone,  stone,  stone],
    [BLOCKS.DIRT]:   [dirt,   dirt,   dirt,   dirt,   dirt,   dirt],
    [BLOCKS.WOOD]:   [woodSide, woodSide, woodTop, woodTop, woodSide, woodSide],
    [BLOCKS.LEAVES]: [leaves, leaves, leaves, leaves, leaves, leaves],
    [BLOCKS.WATER]:  [water,  water,  water,  water,  water,  water],
    [BLOCKS.SAND]:   [sand,   sand,   sand,   sand,   sand,   sand],
  };
}

export function makeMaterialsForBlock(blockType) {
  const texs = blockTextures[blockType];
  return texs.map(t => {
    const mat = new THREE.MeshLambertMaterial({ map: t });
    if (blockType === BLOCKS.LEAVES) { mat.transparent = true; mat.alphaTest = 0.1; }
    if (blockType === BLOCKS.WATER)  { mat.transparent = true; mat.opacity = 0.75; }
    return mat;
  });
}
