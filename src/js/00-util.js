const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* Gameplay randomness runs through one saveable stream, so a loaded run picks up
   exactly where it left off and a reported seed reproduces. Visuals use vrnd()
   instead: a window resize must never perturb the gameplay stream. */
let rngState = (Math.random() * 4294967296) >>> 0;
const seedRng = s => { rngState = s >>> 0; };
const rngSnapshot = () => rngState;
function rnd(){
  rngState = rngState + 0x6D2B79F5 | 0;
  let t = Math.imul(rngState ^ rngState >>> 15, 1 | rngState);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
const vrnd = Math.random;
const pick = arr => arr[Math.floor(rnd() * arr.length)];
function gauss(){ let u = 0, v = 0; while(!u) u = rnd(); while(!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const f2 = v => v.toFixed(2);
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let R = mulberry(1);
const rp = arr => arr[Math.floor(R() * arr.length)];
const rr = (a, b) => a + R() * (b - a);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
