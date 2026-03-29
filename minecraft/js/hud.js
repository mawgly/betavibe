// ─────────────────────────────────────────────────────────
// HUD (hotbar UI, block name display)
// ─────────────────────────────────────────────────────────
import { hotbar, selectedSlot } from './state.js';
import { blockTextures, BLOCK_NAMES } from './blocks.js';
import { makeCanvas } from './textures.js';

// onSlotClick(index) is provided by controls.js to avoid circular deps
export function buildHotbarUI(onSlotClick) {
  const hud = document.getElementById('hud');
  hud.innerHTML = '';
  hotbar.forEach((bt, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot' + (i === selectedSlot ? ' active' : '');
    slot.dataset.idx = i;
    // Mini texture preview (top face)
    const c = makeCanvas(32, 32);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(blockTextures[bt][2].image, 0, 0, 32, 32);
    c.style.width = '36px'; c.style.height = '36px';
    slot.appendChild(c);
    const lbl = document.createElement('span');
    lbl.className = 'slot-label';
    lbl.textContent = i + 1;
    slot.appendChild(lbl);
    slot.addEventListener('click', () => onSlotClick(i));
    hud.appendChild(slot);
  });
}

export function updateHotbarUI(current) {
  document.querySelectorAll('.slot').forEach((s, i) => {
    s.className = 'slot' + (i === current ? ' active' : '');
  });
  document.getElementById('block-name').textContent = BLOCK_NAMES[hotbar[current]] || '';
}
