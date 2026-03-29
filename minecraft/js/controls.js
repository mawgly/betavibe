// ─────────────────────────────────────────────────────────
// INPUT HANDLING + BLOCK INTERACTION
// ─────────────────────────────────────────────────────────
import { player, keys, hotbar, selectedSlot, setSelectedSlot, started } from './state.js';
import { getBlock, setBlock, markChunkDirty, CHUNK_SIZE } from './world.js';
import { camera } from './renderer.js';
import { updateHotbarUI } from './hud.js';

const REACH = 5;

// ── Input event listeners ──────────────────────────────
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup',   e => { keys[e.code] = false; });

document.addEventListener('keydown', e => {
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.key) - 1;
    if (n >= 0 && n < hotbar.length) selectSlot(n);
  }
});

document.addEventListener('mousemove', e => {
  if (!started) return;
  player.yaw   -= e.movementX * 0.002;
  player.pitch -= e.movementY * 0.002;
  player.pitch  = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, player.pitch));
});

document.addEventListener('wheel', e => {
  selectSlot((selectedSlot + (e.deltaY > 0 ? 1 : -1) + hotbar.length) % hotbar.length);
});

document.addEventListener('mousedown', e => {
  if (!started) return;
  if (e.button === 0) breakBlock();
  if (e.button === 2) placeBlock();
});

document.addEventListener('contextmenu', e => e.preventDefault());

// ── Slot selection ─────────────────────────────────────
export function selectSlot(i) {
  setSelectedSlot(i);
  updateHotbarUI(i);
}

// ── Block targeting & interaction ─────────────────────
function getTargetBlock() {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  let px = player.pos.x, py = player.pos.y + 0.5, pz = player.pos.z;
  const step = 0.05;
  let prevX = Math.floor(px), prevY = Math.floor(py), prevZ = Math.floor(pz);
  for (let d = 0; d < REACH; d += step) {
    const cx = Math.floor(px), cy = Math.floor(py), cz = Math.floor(pz);
    if (getBlock(cx, cy, cz) !== 0) {
      return { hit: { x: cx, y: cy, z: cz }, prev: { x: prevX, y: prevY, z: prevZ } };
    }
    prevX = cx; prevY = cy; prevZ = cz;
    px += dir.x * step; py += dir.y * step; pz += dir.z * step;
  }
  return null;
}

function breakBlock() {
  const t = getTargetBlock();
  if (t) { setBlock(t.hit.x, t.hit.y, t.hit.z, 0); rebuildNearby(t.hit.x, t.hit.z); }
}

function placeBlock() {
  const t = getTargetBlock();
  if (!t) return;
  const { x, y, z } = t.prev;
  // Don't place inside player
  const px = Math.floor(player.pos.x), py = Math.floor(player.pos.y), pz = Math.floor(player.pos.z);
  if (x === px && z === pz && (y === py || y === py + 1)) return;
  setBlock(x, y, z, hotbar[selectedSlot]);
  rebuildNearby(x, z);
}

function rebuildNearby(wx, wz) {
  const cx = Math.floor(wx / CHUNK_SIZE);
  const cz = Math.floor(wz / CHUNK_SIZE);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      markChunkDirty(cx + dx, cz + dz);
}
