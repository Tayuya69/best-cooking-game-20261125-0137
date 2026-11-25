// shots.js — the four deterministic screenshot scenes.
// Each preset rebuilds the world from a fixed seed so the shot is the same
// every time, then freezes the timers: the picture is still a real render of
// the game's own code, only the starting state is fixed so the scene is
// composed. main.js calls applyShot(name) and then sets window.__shotReady.

function applyShot(name) {
  const s = World.state;
  s.shotMode = true;
  s.mode = 'playing';
  s.rng = makeRng(20261125);
  s.orders = [];
  s.particles = [];
  s.floaters = [];
  s.message = '';
  s.messageTimer = 0;
  s.combo = 0;
  for (const b of s.boards) { b.item = null; b.progress = 0; b.chopping = false; }
  for (const w of s.woks) { w.item = null; w.progress = 0; w.cooking = false; }
  s.plate = { items: [], sauce: false, loc: 'counter' };
  s.player.carrying = null;
  s.player.tx = null;
  s.player.ty = null;
  s.player.pendingStation = null;

  const order = (recipeId, patienceFrac) => {
    const recipe = recipeById(recipeId);
    return { id: s.orders.length + 1, recipe, patience: CONFIG.orderPatience * patienceFrac, maxPatience: CONFIG.orderPatience };
  };

  if (name === 'cover') {
    // The full stall at its best: three orders, a wok sizzling, a board
    // mid-chop, a finished plate waiting on the counter, timer running.
    s.timeLeft = 151;
    s.elapsed = 29;
    s.score = 450;
    s.coins = 120;
    s.served = 4;
    s.combo = 3;
    s.bestCombo = 3;
    s.orders = [order('lantern-noodles', 0.8), order('golden-rice', 0.55), order('street-box', 0.9)];
    s.boards[0].item = { ing: 'veg', chopped: false };
    s.boards[0].progress = 0.55;
    s.boards[0].chopping = true;
    s.woks[0].item = { ing: 'chicken', cooked: false };
    s.woks[0].progress = 0.6;
    s.woks[0].cooking = true;
    s.woks[1].item = { ing: 'noodle', cooked: true };
    s.woks[1].progress = 1;
    s.plate = { items: ['noodle', 'veg'], sauce: true, loc: 'counter' };
    s.player.x = 470;
    s.player.y = 380;
    s.player.carrying = { kind: 'chopped', ing: 'veg' };
    s.player.facing = 1;
    s.message = 'Lantern Noodles ready to serve!';
    s.messageTimer = 99;
    s.messageColor = PALETTE.green;
    World.steam(590, 250);
    World.steam(590, 250);
  } else if (name === 'orders') {
    // A full order board: four customers waiting, patience bars draining.
    s.timeLeft = 125;
    s.elapsed = 55;
    s.score = 210;
    s.coins = 58;
    s.served = 2;
    s.orders = [
      order('lantern-noodles', 0.9), order('golden-rice', 0.7),
      order('street-box', 0.45), order('sunrise-rice', 0.25),
    ];
    s.boards[1].item = { ing: 'chicken', chopped: false };
    s.boards[1].progress = 0.3;
    s.boards[1].chopping = true;
    s.woks[0].item = { ing: 'rice', cooked: false };
    s.woks[0].progress = 0.4;
    s.woks[0].cooking = true;
    s.player.x = 210;
    s.player.y = 300;
    s.player.carrying = { kind: 'raw', ing: 'rice' };
    s.player.facing = 1;
    s.message = 'Four orders on the board!';
    s.messageTimer = 99;
  } else if (name === 'cooking') {
    // Mid-assembly: chopping, sizzling and a half-built plate at once.
    s.timeLeft = 72;
    s.elapsed = 108;
    s.score = 780;
    s.coins = 210;
    s.served = 7;
    s.combo = 2;
    s.bestCombo = 4;
    s.orders = [order('street-box', 0.6), order('sunrise-rice', 0.75)];
    s.boards[0].item = { ing: 'chicken', chopped: false };
    s.boards[0].progress = 0.75;
    s.boards[0].chopping = true;
    s.woks[0].item = { ing: 'noodle', cooked: false };
    s.woks[0].progress = 0.8;
    s.woks[0].cooking = true;
    s.woks[1].item = { ing: 'veg', cooked: true };
    s.woks[1].progress = 1;
    s.plate = { items: ['rice', 'chicken'], sauce: false, loc: 'counter' };
    s.player.x = 590;
    s.player.y = 360;
    s.player.carrying = { kind: 'chopped', ing: 'chicken' };
    s.player.facing = -1;
    World.burst(330, 240, '#e8dcc0', 8, 70);
    World.steam(590, 250);
    World.steam(590, 250);
    World.steam(590, 250);
    s.message = 'Wok it while it sizzles!';
    s.messageTimer = 99;
    s.messageColor = PALETTE.gold;
  } else if (name === 'serve') {
    // RUSH HOUR: a finished plate in hand at the serving window, coins flying.
    s.timeLeft = 24;
    s.elapsed = 156;
    s.rush = true;
    s.rushAnnounced = true;
    s.score = 1150;
    s.coins = 340;
    s.served = 10;
    s.combo = 5;
    s.bestCombo = 5;
    s.orders = [order('golden-rice', 0.5), order('lantern-noodles', 0.35)];
    s.woks[0].item = { ing: 'egg', cooked: true };
    s.woks[0].progress = 1;
    s.plate = { items: ['rice', 'chicken'], sauce: true, loc: 'hand' };
    s.player.x = 1010;
    s.player.y = 380;
    s.player.carrying = { kind: 'plate' };
    s.player.facing = 1;
    World.burst(1110, 300, PALETTE.gold, 22, 170);
    World.addFloater(1110, 250, '+160  +26c', PALETTE.gold);
    s.message = 'Golden Chicken Rice served! Combo x5';
    s.messageTimer = 99;
    s.messageColor = PALETTE.green;
  } else {
    // Unknown shot name: fall back to the cover scene.
    applyShot('cover');
  }
}
