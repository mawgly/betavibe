// ─────────────────────────────────────────────────────────
// PROCEDURAL TEXTURE GENERATION (Canvas 2D pixel art)
// ─────────────────────────────────────────────────────────
export const TEX_SIZE = 16;

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function makeTexture(drawFn) {
  const c = makeCanvas(TEX_SIZE, TEX_SIZE);
  const ctx = c.getContext('2d');
  drawFn(ctx, c);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return t;
}

export function rng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// Grass Top — green with variation
export function drawGrassTop(ctx) {
  const rand = rng(1);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const v = Math.floor(rand() * 30);
      const r = 80 + v; const g = 160 + v; const b = 40 + v;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Grass Side — top green strip, brown/dirt below
export function drawGrassSide(ctx) {
  const rand = rng(2);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const v = Math.floor(rand() * 20);
      let r, g, b;
      if (y < 3) { r = 85+v; g = 150+v; b = 40+v; }
      else       { r = 134+v; g = 96+v; b = 67+v; }
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Dirt
export function drawDirt(ctx) {
  const rand = rng(3);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const v = Math.floor(rand() * 25);
      ctx.fillStyle = `rgb(${134+v},${96+v},${67+v})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Stone — gray with crack lines
export function drawStone(ctx) {
  const rand = rng(4);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const v = Math.floor(rand() * 30);
      const c = 120 + v;
      ctx.fillStyle = `rgb(${c},${c},${c})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // crack lines
  ctx.fillStyle = 'rgba(80,80,80,0.6)';
  ctx.fillRect(4, 0, 1, 7);
  ctx.fillRect(0, 6, 5, 1);
  ctx.fillRect(11, 5, 1, 8);
  ctx.fillRect(8, 13, 8, 1);
  ctx.fillRect(8, 0, 1, 5);
}

// Wood trunk side — brown with vertical grain
export function drawWoodSide(ctx) {
  const rand = rng(5);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const v = Math.floor(rand() * 15);
      const stripe = Math.abs(x - 8) < 2 ? -20 : 0;
      ctx.fillStyle = `rgb(${100+v+stripe},${70+v+stripe},${40+v})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.fillStyle = 'rgba(60,40,20,0.3)';
  for (let x = 0; x < TEX_SIZE; x+=3) ctx.fillRect(x, 0, 1, TEX_SIZE);
}

// Wood trunk top — rings
export function drawWoodTop(ctx) {
  const rand = rng(6);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const v = Math.floor(rand() * 10);
      const dx = x - 7.5; const dy = y - 7.5;
      const d = Math.sqrt(dx*dx + dy*dy);
      const ring = Math.floor(d / 2.5) % 2;
      const base = ring ? 90 : 110;
      ctx.fillStyle = `rgb(${base+v},${base*0.7+v},${base*0.4+v})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Leaves — dithered green
export function drawLeaves(ctx) {
  const rand = rng(7);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      if (rand() < 0.15) {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(x, y, 1, 1);
      } else {
        const v = Math.floor(rand() * 40);
        ctx.fillStyle = `rgb(${30+v},${100+v},${20+v})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

// Water — blue animated (will reuse for now)
export function drawWater(ctx) {
  const rand = rng(8);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const v = Math.floor(rand() * 30);
      ctx.fillStyle = `rgba(30,${100+v},${200+v},0.8)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // wave lines
  ctx.fillStyle = 'rgba(100,180,255,0.5)';
  ctx.fillRect(0, 5, 16, 1);
  ctx.fillRect(0, 11, 16, 1);
}

// Sand
export function drawSand(ctx) {
  const rand = rng(9);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const v = Math.floor(rand() * 25);
      ctx.fillStyle = `rgb(${220+v},${200+v},${130+v})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
