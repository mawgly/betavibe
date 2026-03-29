// ─────────────────────────────────────────────────────────
// NOISE / MATH UTILITIES FOR TERRAIN GENERATION
// ─────────────────────────────────────────────────────────

export function smoothNoise(x, z, scale, octaves) {
  let val = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    val += simplexLike(x * freq / scale, z * freq / scale) * amp;
    max += amp; amp *= 0.5; freq *= 2;
  }
  return val / max;
}

function simplexLike(x, z) {
  const ix = Math.floor(x); const iz = Math.floor(z);
  const fx = x - ix;        const fz = z - iz;
  const ux = fx*fx*(3-2*fx); const uz = fz*fz*(3-2*fz);
  return lerp(
    lerp(dot2(ix,   iz,   fx,   fz),   dot2(ix+1, iz,   fx-1, fz),   ux),
    lerp(dot2(ix,   iz+1, fx,   fz-1), dot2(ix+1, iz+1, fx-1, fz-1), ux),
    uz
  );
}

function lerp(a, b, t) { return a + (b - a) * t; }

function dot2(ix, iz, fx, fz) {
  const h = hash2(ix, iz) & 7;
  const gx = [1,-1,1,-1,1,-1,0,0][h];
  const gz = [1,1,-1,-1,0,0,1,-1][h];
  return gx*fx + gz*fz;
}

export function hash2(x, z) {
  let h = (x * 374761393 + z * 668265263);
  h = (h ^ (h >> 13)) * 1274126177;
  return h ^ (h >> 16);
}
