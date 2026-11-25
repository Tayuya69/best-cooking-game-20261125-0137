// Sizzle Street — Night Market Kitchen
// config.js — every tunable number, recipe, ingredient and colour in one place.
// Nothing in here knows about the canvas or the game loop; world.js reads it.

const CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 800,
  boardTop: 8,          // order board strip height
  boardHeight: 104,
  floorTop: 120,        // playable kitchen starts below the order board

  shiftSeconds: 180,    // a 3-minute shift
  rushSeconds: 30,      // last 30 seconds are RUSH HOUR

  playerSpeed: 260,     // pixels per second
  interactRadius: 78,   // how close the chef must be to use a station
  playerRadius: 22,

  // Orders: first one after 4s, then the gap shrinks as the shift goes on.
  firstOrderDelay: 4,
  spawnGapStart: 14,
  spawnGapEnd: 7,
  rushSpawnMultiplier: 0.55,
  maxOrders: 4,
  orderPatience: 60,    // seconds before a customer walks away

  // Scoring.
  serveBase: 100,
  patienceBonusMax: 50, // extra points for serving with patience left
  coinBase: 10,
  coinComboBonus: 2,    // +2 coins per combo step
  latePenalty: 25,      // score lost when an order walks away
  wrongServePenalty: 10,
};

// The five ingredients on the crates. chopSeconds is null when the ingredient
// goes straight to the wok; cookSeconds is how long it sizzles.
const INGREDIENTS = {
  noodle:  { name: 'Noodles',  color: '#f2c14e', dark: '#c98f1b', chopSeconds: null, cookSeconds: 4,   key: 'N' },
  rice:    { name: 'Rice',     color: '#f5f0dc', dark: '#c9bd93', chopSeconds: null, cookSeconds: 4,   key: 'R' },
  chicken: { name: 'Chicken',  color: '#e8a87c', dark: '#b96a3a', chopSeconds: 2.5,  cookSeconds: 5,   key: 'C' },
  veg:     { name: 'Veg',      color: '#7dc383', dark: '#3f7d46', chopSeconds: 2,    cookSeconds: 3.5, key: 'V' },
  egg:     { name: 'Egg',      color: '#ffd94d', dark: '#d9a400', chopSeconds: 2,    cookSeconds: 3,   key: 'E' },
};

// Four dishes. `needs` lists the ingredients on the plate; `sauce` says the
// dish is only finished once the sauce bottle has been tipped over it.
const RECIPES = [
  { id: 'lantern-noodles', name: 'Lantern Noodles',   needs: ['noodle', 'veg'],     sauce: true,  color: '#f2c14e', price: 14 },
  { id: 'golden-rice',     name: 'Golden Chicken Rice', needs: ['rice', 'chicken'], sauce: true,  color: '#e8a87c', price: 16 },
  { id: 'street-box',      name: 'Street Noodle Box', needs: ['noodle', 'chicken', 'veg'], sauce: false, color: '#d96a4a', price: 18 },
  { id: 'sunrise-rice',    name: 'Sunrise Veg Rice',  needs: ['rice', 'veg', 'egg'], sauce: false, color: '#ffd94d', price: 15 },
];

// Station layout, in canvas pixels. Crates run down the left wall, boards and
// woks fill the middle, plating sits bottom-centre, the serving window is on
// the right wall and the bin stands beside the plating counter.
const STATIONS = {
  crates: [
    { id: 'crate-noodle',  kind: 'crate', ing: 'noodle',  x: 88,  y: 190, w: 116, h: 92 },
    { id: 'crate-rice',    kind: 'crate', ing: 'rice',    x: 88,  y: 300, w: 116, h: 92 },
    { id: 'crate-chicken', kind: 'crate', ing: 'chicken', x: 88,  y: 410, w: 116, h: 92 },
    { id: 'crate-veg',     kind: 'crate', ing: 'veg',     x: 88,  y: 520, w: 116, h: 92 },
    { id: 'crate-egg',     kind: 'crate', ing: 'egg',     x: 88,  y: 630, w: 116, h: 92 },
  ],
  boards: [
    { id: 'board-1', kind: 'board', x: 330, y: 250, w: 140, h: 88 },
    { id: 'board-2', kind: 'board', x: 330, y: 460, w: 140, h: 88 },
  ],
  woks: [
    { id: 'wok-1', kind: 'wok', x: 590, y: 250, w: 140, h: 88 },
    { id: 'wok-2', kind: 'wok', x: 590, y: 460, w: 140, h: 88 },
  ],
  plating: { id: 'plating', kind: 'plating', x: 850, y: 330, w: 170, h: 120 },
  bin:     { id: 'bin',     kind: 'bin',     x: 850, y: 540, w: 90,  h: 80 },
  window:  { id: 'window',  kind: 'window',  x: 1150, y: 330, w: 110, h: 190 },
};

const PALETTE = {
  night: '#0e2a33',       // deep teal night floor
  nightAlt: '#123540',
  awningRed: '#c0392b',
  awningCream: '#f5e6c8',
  lantern: '#ffb347',
  lanternGlow: 'rgba(255,179,71,0.35)',
  counterWood: '#8a5a2b',
  counterTop: '#b07a3e',
  boardWood: '#d9b380',
  wokIron: '#3a3f44',
  steel: '#9aa5ad',
  cream: '#fdf3d8',
  ink: '#1d2b2e',
  green: '#7dc383',
  red: '#e74c3c',
  gold: '#f2c14e',
  white: '#ffffff',
};

function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// True when a plate's contents are exactly a recipe (ingredients + sauce).
function plateMatchesRecipe(items, sauce) {
  for (const r of RECIPES) {
    if (r.sauce !== sauce) continue;
    if (r.needs.length !== items.length) continue;
    const sortedNeeds = [...r.needs].sort();
    const sortedItems = [...items].sort();
    if (sortedNeeds.every((ing, i) => ing === sortedItems[i])) return r;
  }
  return null;
}
