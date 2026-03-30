// ─────────────────────────────────────────────────────────
// WORLD DATA, CHUNK GENERATION, MESH BUILDING, CHUNK MGMT
// ─────────────────────────────────────────────────────────
import { BLOCKS, makeMaterialsForBlock, blockTextures } from './blocks.js';
import { smoothNoise, hash2 } from './noise.js';
import { scene } from './renderer.js';
import { player } from './state.js';

export const CHUNK_SIZE   = 16;
export const WORLD_HEIGHT = 64;
export const SEA_LEVEL    = 28;
export const RENDER_DIST  = 4;

// World data: Map<"cx,cz", Uint8Array>
export const chunks     = new Map();
export const chunkMeshes = new Map();
export const dirtyChunks = new Set();

const geo = new THREE.BoxGeometry(1, 1, 1);

// Flat plane for water surfaces — avoids z-fighting between adjacent water cubes
const waterGeo = (() => {
  const g = new THREE.PlaneGeometry(1, 1);
  g.rotateX(-Math.PI / 2);
  return g;
})();

// Water and air are transparent — solid blocks adjacent to them should show their faces
function isTransparent(b) { return b === 0 || b === BLOCKS.WATER; }

export function chunkKey(cx, cz) { return `${cx},${cz}`; }

function blockIndex(lx, y, lz) { return lx + CHUNK_SIZE * (y + WORLD_HEIGHT * lz); }

export function getChunk(cx, cz) {
  const k = chunkKey(cx, cz);
  if (!chunks.has(k)) generateChunk(cx, cz);
  return chunks.get(k);
}

export function getBlock(x, y, z) {
  if (y < 0 || y >= WORLD_HEIGHT) return 0;
  const cx = Math.floor(x / CHUNK_SIZE);
  const cz = Math.floor(z / CHUNK_SIZE);
  const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  return getChunk(cx, cz)[blockIndex(lx, y, lz)];
}

export function setBlock(x, y, z, type) {
  if (y < 0 || y >= WORLD_HEIGHT) return;
  const cx = Math.floor(x / CHUNK_SIZE);
  const cz = Math.floor(z / CHUNK_SIZE);
  const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  getChunk(cx, cz)[blockIndex(lx, y, lz)] = type;
  markChunkDirty(cx, cz);
  if (lx === 0)            markChunkDirty(cx-1, cz);
  if (lx === CHUNK_SIZE-1) markChunkDirty(cx+1, cz);
  if (lz === 0)            markChunkDirty(cx, cz-1);
  if (lz === CHUNK_SIZE-1) markChunkDirty(cx, cz+1);
}

export function markChunkDirty(cx, cz) { dirtyChunks.add(chunkKey(cx, cz)); }

// ─────────────────────────────────────────────────────────
// TERRAIN GENERATION
// ─────────────────────────────────────────────────────────
function generateChunk(cx, cz) {
  const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const h = Math.floor(SEA_LEVEL + smoothNoise(wx, wz, 40, 4) * 12);
      const clampH = Math.max(1, Math.min(WORLD_HEIGHT - 1, h));

      for (let y = 0; y <= clampH; y++) {
        let block;
        if (y === clampH) {
          block = y <= SEA_LEVEL ? BLOCKS.SAND : BLOCKS.GRASS;
        } else if (y >= clampH - 3) {
          block = BLOCKS.DIRT;
        } else {
          block = BLOCKS.STONE;
        }
        data[blockIndex(lx, y, lz)] = block;
      }

      // Water fill
      for (let y = clampH + 1; y <= SEA_LEVEL; y++) {
        data[blockIndex(lx, y, lz)] = BLOCKS.WATER;
      }

      // Trees (on grass, above sea level)
      if (clampH > SEA_LEVEL && Math.abs(hash2(wx, wz)) % 20 === 0) {
        const trunkH = 4 + (Math.abs(hash2(wx+1, wz)) % 3);
        for (let t = 1; t <= trunkH; t++) {
          if (clampH + t < WORLD_HEIGHT) data[blockIndex(lx, clampH + t, lz)] = BLOCKS.WOOD;
        }
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) > 3) continue;
              const lfy = clampH + trunkH + dy;
              const lfx = lx + dx; const lfz = lz + dz;
              if (lfx >= 0 && lfx < CHUNK_SIZE && lfz >= 0 && lfz < CHUNK_SIZE && lfy < WORLD_HEIGHT) {
                if (data[blockIndex(lfx, lfy, lfz)] === 0)
                  data[blockIndex(lfx, lfy, lfz)] = BLOCKS.LEAVES;
              }
            }
          }
        }
      }
    }
  }

  chunks.set(chunkKey(cx, cz), data);
  markChunkDirty(cx, cz);
}

// ─────────────────────────────────────────────────────────
// CHUNK MESH BUILDING (per-face culling, instanced rendering)
// ─────────────────────────────────────────────────────────
export function buildChunkMesh(cx, cz) {
  const k = chunkKey(cx, cz);
  if (chunkMeshes.has(k)) {
    const old = chunkMeshes.get(k);
    old.forEach(m => { scene.remove(m); m.geometry.dispose(); });
    chunkMeshes.delete(k);
  }

  const data = getChunk(cx, cz);
  const positions = {}; // blockType -> [x,y,z, ...]
  const waterPos  = []; // water surface top-face positions only

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const b = data[blockIndex(lx, y, lz)];
        if (b === 0) continue;
        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;

        if (b === BLOCKS.WATER) {
          // Only render the water surface (top face) where air is directly above.
          // Using a flat plane avoids coplanar z-fighting between adjacent water cubes.
          if (getBlock(wx, y + 1, wz) === 0) {
            waterPos.push(wx, y + 0.45, wz);
          }
          continue;
        }

        // Solid block: expose if any neighbour is air or transparent (water/leaves)
        const exposed = (
          isTransparent(getBlock(wx+1, y, wz)) || isTransparent(getBlock(wx-1, y, wz)) ||
          isTransparent(getBlock(wx, y+1, wz)) || isTransparent(getBlock(wx, y-1, wz)) ||
          isTransparent(getBlock(wx, y, wz+1)) || isTransparent(getBlock(wx, y, wz-1))
        );
        if (!exposed) continue;
        if (!positions[b]) positions[b] = [];
        positions[b].push(wx, y, wz);
      }
    }
  }

  const meshes = [];
  for (const [blockType, pos] of Object.entries(positions)) {
    if (!pos.length) continue;
    const count = pos.length / 3;
    const materials = makeMaterialsForBlock(Number(blockType));
    const iMesh = new THREE.InstancedMesh(geo, materials, count);
    iMesh.castShadow = false;
    iMesh.receiveShadow = false;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.setPosition(pos[i*3], pos[i*3+1], pos[i*3+2]);
      iMesh.setMatrixAt(i, matrix);
    }
    iMesh.instanceMatrix.needsUpdate = true;
    scene.add(iMesh);
    meshes.push(iMesh);
  }

  // Water surface mesh: flat planes, single material, no z-fighting
  if (waterPos.length > 0) {
    const count = waterPos.length / 3;
    const mat = new THREE.MeshLambertMaterial({
      map: blockTextures[BLOCKS.WATER][2], // top-face texture
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const waterMesh = new THREE.InstancedMesh(waterGeo, mat, count);
    waterMesh.castShadow = false;
    waterMesh.receiveShadow = false;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.setPosition(waterPos[i*3], waterPos[i*3+1], waterPos[i*3+2]);
      waterMesh.setMatrixAt(i, matrix);
    }
    waterMesh.instanceMatrix.needsUpdate = true;
    scene.add(waterMesh);
    meshes.push(waterMesh);
  }

  chunkMeshes.set(k, meshes);
}

// ─────────────────────────────────────────────────────────
// CHUNK MANAGEMENT (load, unload, rebuild)
// ─────────────────────────────────────────────────────────
export function updateChunks() {
  const pcx = Math.floor(player.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(player.pos.z / CHUNK_SIZE);

  // Generate needed chunks
  for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) {
    for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) {
      const cx = pcx + dx, cz = pcz + dz;
      if (!chunks.has(chunkKey(cx, cz))) generateChunk(cx, cz);
    }
  }

  // Rebuild dirty chunks in view
  for (const k of [...dirtyChunks]) {
    const [cx, cz] = k.split(',').map(Number);
    if (Math.abs(cx - pcx) <= RENDER_DIST && Math.abs(cz - pcz) <= RENDER_DIST) {
      buildChunkMesh(cx, cz);
      dirtyChunks.delete(k);
    }
  }

  // Remove far chunks
  for (const [k, meshes] of chunkMeshes) {
    const [cx, cz] = k.split(',').map(Number);
    if (Math.abs(cx - pcx) > RENDER_DIST + 1 || Math.abs(cz - pcz) > RENDER_DIST + 1) {
      meshes.forEach(m => { scene.remove(m); m.geometry.dispose(); });
      chunkMeshes.delete(k);
    }
  }
}
