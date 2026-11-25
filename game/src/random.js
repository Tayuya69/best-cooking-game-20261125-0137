// random.js — a small seeded random generator (mulberry32).
// Shot mode and order spawning both draw from it so a scene can be replayed
// exactly from a seed instead of depending on Math.random.

function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one element of an array using the seeded generator.
function pickFrom(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Integer in [min, max] using the seeded generator.
function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
