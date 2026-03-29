// ─────────────────────────────────────────────────────────
// SHARED GAME STATE (player, input, hotbar)
// ─────────────────────────────────────────────────────────
import { BLOCKS } from './blocks.js';

export const player = {
  pos: new THREE.Vector3(8, 40, 8),
  vel: new THREE.Vector3(),
  yaw: 0, pitch: 0,
  onGround: false,
  height: 1.75,
  radius: 0.3,
  speed: 5,
  jumpSpeed: 8,
};

export const keys = {};

export const hotbar = [
  BLOCKS.GRASS, BLOCKS.STONE, BLOCKS.DIRT,
  BLOCKS.WOOD,  BLOCKS.LEAVES, BLOCKS.SAND, BLOCKS.WATER,
];

export let selectedSlot = 0;
export function setSelectedSlot(i) { selectedSlot = i; }

export let started = false;
export function setStarted(val) { started = val; }
