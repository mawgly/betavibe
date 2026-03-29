// ─────────────────────────────────────────────────────────
// ENTRY POINT — game loop, start/pause, initialization
// ─────────────────────────────────────────────────────────
import { buildTextures } from './blocks.js';
import { player, setStarted } from './state.js';
import { initScene, scene, camera, renderer } from './renderer.js';
import { getBlock, updateChunks, WORLD_HEIGHT } from './world.js';
import { physicsUpdate } from './physics.js';
import { buildHotbarUI } from './hud.js';
import { selectSlot } from './controls.js';

// ── Game loop vars ─────────────────────────────────────
let lastTime   = 0;
let frameCount = 0;
let fpsTime    = 0;
let fps        = 0;

function gameLoop(now) {
  requestAnimationFrame(gameLoop);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  frameCount++;
  fpsTime += dt;
  if (fpsTime >= 1) { fps = frameCount; frameCount = 0; fpsTime = 0; }

  physicsUpdate(dt);
  updateChunks();

  // Update camera from player state
  camera.position.set(player.pos.x, player.pos.y + player.height - 0.1, player.pos.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  renderer.render(scene, camera);

  document.getElementById('fps').textContent  = `FPS: ${fps}`;
  document.getElementById('pos').textContent  =
    `Pos: ${player.pos.x.toFixed(1)}, ${player.pos.y.toFixed(1)}, ${player.pos.z.toFixed(1)}`;
  document.getElementById('look').textContent =
    `Yaw: ${(player.yaw * 180 / Math.PI).toFixed(0)}°`;
}

// ── Exposed to HTML onclick ────────────────────────────
window.startGame = function startGame() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('game-canvas').requestPointerLock();
  setStarted(true);
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
};

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement) {
    setStarted(false);
    document.getElementById('overlay').style.display = 'flex';
  }
});

// ── Initialization ─────────────────────────────────────
buildTextures();
initScene();

// Spawn player above terrain
(function findSpawn() {
  for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
    if (getBlock(8, y, 8) !== 0) { player.pos.set(8.5, y + 1, 8.5); break; }
  }
})();

buildHotbarUI(i => selectSlot(i));
updateChunks();
