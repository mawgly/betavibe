// ─────────────────────────────────────────────────────────
// PHYSICS (simple AABB collision + gravity)
// ─────────────────────────────────────────────────────────
import { player, keys } from './state.js';
import { getBlock } from './world.js';
import { BLOCKS } from './blocks.js';

const GRAVITY = -20;

export function physicsUpdate(dt) {
  // Apply gravity
  player.vel.y += GRAVITY * dt;
  if (keys['ShiftLeft'] || keys['ShiftRight']) player.vel.y = Math.max(-10, player.vel.y);

  // Movement direction
  const forward = new THREE.Vector3(-Math.sin(player.yaw),  0, -Math.cos(player.yaw));
  const right   = new THREE.Vector3( Math.cos(player.yaw),  0, -Math.sin(player.yaw));
  const moveDir = new THREE.Vector3();
  if (keys['KeyW']) moveDir.addScaledVector(forward,  1);
  if (keys['KeyS']) moveDir.addScaledVector(forward, -1);
  if (keys['KeyA']) moveDir.addScaledVector(right,   -1);
  if (keys['KeyD']) moveDir.addScaledVector(right,    1);
  if (moveDir.lengthSq() > 0) moveDir.normalize();
  player.vel.x = moveDir.x * player.speed;
  player.vel.z = moveDir.z * player.speed;

  if (keys['Space'] && player.onGround) player.vel.y = player.jumpSpeed;

  const dx = player.vel.x * dt;
  const dy = player.vel.y * dt;
  const dz = player.vel.z * dt;

  player.pos.x += dx; resolveAxis('x', dx);
  player.pos.y += dy; resolveAxis('y', dy);
  player.pos.z += dz; resolveAxis('z', dz);
}

function resolveAxis(axis, delta) {
  const r = player.radius;
  const bx = [player.pos.x - r, player.pos.x + r];
  const by = [player.pos.y,     player.pos.y + player.height];
  const bz = [player.pos.z - r, player.pos.z + r];

  for (let x = Math.floor(bx[0]); x <= Math.floor(bx[1]); x++) {
    for (let y = Math.floor(by[0]); y <= Math.floor(by[1]); y++) {
      for (let z = Math.floor(bz[0]); z <= Math.floor(bz[1]); z++) {
        const b = getBlock(x, y, z);
        if (b === 0 || b === BLOCKS.WATER) continue;
        if (axis === 'x') {
          if (delta > 0) player.pos.x = x - r - 0.001;
          else           player.pos.x = x + 1 + r + 0.001;
          player.vel.x = 0;
        } else if (axis === 'y') {
          if (delta < 0) { player.pos.y = y + 1; player.vel.y = 0; player.onGround = true; }
          else           { player.pos.y = y - player.height; player.vel.y = 0; }
        } else {
          if (delta > 0) player.pos.z = z - r - 0.001;
          else           player.pos.z = z + 1 + r + 0.001;
          player.vel.z = 0;
        }
        // Recalculate bounds after correction
        bx[0] = player.pos.x - r; bx[1] = player.pos.x + r;
        by[0] = player.pos.y;     by[1] = player.pos.y + player.height;
        bz[0] = player.pos.z - r; bz[1] = player.pos.z + r;
      }
    }
  }

  if (axis === 'y' && delta !== 0) {
    const below = getBlock(
      Math.floor(player.pos.x),
      Math.floor(player.pos.y) - 1,
      Math.floor(player.pos.z)
    );
    if (below === 0 || below === BLOCKS.WATER) player.onGround = false;
  }
}
