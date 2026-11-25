// world.js — kitchen state: the chef, the stations, the orders, the shift
// timer, the score and the coins. It owns every rule of the game; render.js
// only draws what is here, and main.js only calls update() and draw().

function stationCenter(s) {
  return { x: s.x, y: s.y };
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function newWorld() {
  return {
    mode: 'title',        // 'title' | 'playing' | 'end'
    timeLeft: CONFIG.shiftSeconds,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    rush: false,
    rushAnnounced: false,
    spawnTimer: CONFIG.firstOrderDelay,
    orderSeq: 0,
    orders: [],           // {id, recipe, patience, maxPatience}
    player: {
      x: 640, y: 620, tx: null, ty: null, // click-to-move target
      carrying: null,                     // {kind:'raw'|'chopped'|'cooked', ing} | {kind:'plate'}
      pendingStation: null,               // station to use on arrival
      facing: 1,
    },
    boards: STATIONS.boards.map((b) => ({ def: b, item: null, progress: 0, chopping: false })),
    woks: STATIONS.woks.map((w) => ({ def: w, item: null, progress: 0, cooking: false })),
    plate: { items: [], sauce: false, loc: 'counter' }, // loc: 'counter' | 'hand'
    particles: [],        // {x,y,vx,vy,life,maxLife,color,size,kind}
    floaters: [],         // {x,y,text,life,color}
    message: '',
    messageTimer: 0,
    messageColor: PALETTE.cream,
    rng: makeRng((Date.now() % 2147483647) || 1),
    shotMode: false,
    stats: { chopped: 0, cooked: 0, plates: 0 },
  };
}

const World = {
  state: newWorld(),

  reset() {
    this.state = newWorld();
    this.state.mode = 'playing';
    AudioSys.startMusic();
  },

  // --- helpers -----------------------------------------------------------

  showMessage(text, color) {
    const s = this.state;
    s.message = text;
    s.messageTimer = 2.2;
    s.messageColor = color || PALETTE.cream;
  },

  addFloater(x, y, text, color) {
    this.state.floaters.push({ x, y, text, life: 1.4, color: color || PALETTE.gold });
  },

  burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (speed || 120) * (0.4 + Math.random() * 0.8);
      this.state.particles.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
        life: 0.7 + Math.random() * 0.5, maxLife: 1.1,
        color, size: 2 + Math.random() * 3, kind: 'dot',
      });
    }
  },

  steam(x, y) {
    this.state.particles.push({
      x: x + (Math.random() - 0.5) * 40, y: y - 8,
      vx: (Math.random() - 0.5) * 12, vy: -34 - Math.random() * 20,
      life: 0.9, maxLife: 0.9, color: 'rgba(255,255,255,0.55)',
      size: 5 + Math.random() * 5, kind: 'steam',
    });
  },

  nearestStation(x, y) {
    const s = this.state;
    let best = null;
    let bestD = CONFIG.interactRadius;
    const all = [
      ...STATIONS.crates,
      ...STATIONS.boards,
      ...STATIONS.woks,
      STATIONS.plating, STATIONS.bin, STATIONS.window,
    ];
    for (const st of all) {
      const c = stationCenter(st);
      // The serving window is used from its front edge.
      const cy = st.kind === 'window' ? st.y : c.y;
      const d = dist(x, y, c.x, cy);
      if (d < bestD) { bestD = d; best = st; }
    }
    return best;
  },

  stationState(st) {
    if (st.kind === 'board') return this.state.boards.find((b) => b.def.id === st.id);
    if (st.kind === 'wok') return this.state.woks.find((w) => w.def.id === st.id);
    return null;
  },

  // --- orders ------------------------------------------------------------

  spawnOrder() {
    const s = this.state;
    if (s.orders.length >= CONFIG.maxOrders) return;
    const recipe = pickFrom(s.rng, RECIPES);
    s.orderSeq += 1;
    s.orders.push({
      id: s.orderSeq,
      recipe,
      patience: CONFIG.orderPatience,
      maxPatience: CONFIG.orderPatience,
    });
  },

  spawnGap() {
    const s = this.state;
    const t = Math.min(1, s.elapsed / CONFIG.shiftSeconds);
    const gap = CONFIG.spawnGapStart + (CONFIG.spawnGapEnd - CONFIG.spawnGapStart) * t;
    return s.rush ? gap * CONFIG.rushSpawnMultiplier : gap;
  },

  // --- interaction -------------------------------------------------------

  interact() {
    const s = this.state;
    const p = s.player;
    const st = this.nearestStation(p.x, p.y);
    if (!st) return;
    const hand = p.carrying;

    if (st.kind === 'crate') {
      if (hand) { this.showMessage('Hands full!', PALETTE.red); return; }
      p.carrying = { kind: 'raw', ing: st.ing };
      AudioSys.pickup();
      return;
    }

    if (st.kind === 'board') {
      const board = this.stationState(st);
      if (!board.item && hand && hand.kind === 'raw' && INGREDIENTS[hand.ing].chopSeconds) {
        board.item = { ing: hand.ing, chopped: false };
        board.progress = 0;
        board.chopping = true;
        p.carrying = null;
        AudioSys.place();
      } else if (board.item && !hand) {
        p.carrying = { kind: board.item.chopped ? 'chopped' : 'raw', ing: board.item.ing };
        if (board.item.chopped) s.stats.chopped += 1;
        board.item = null;
        board.progress = 0;
        board.chopping = false;
        AudioSys.pickup();
      } else if (board.item) {
        this.showMessage('Board is busy', PALETTE.red);
      } else {
        this.showMessage('Needs something to chop', PALETTE.red);
      }
      return;
    }

    if (st.kind === 'wok') {
      const wok = this.stationState(st);
      if (!wok.item && hand && (hand.kind === 'chopped' || (hand.kind === 'raw' && !INGREDIENTS[hand.ing].chopSeconds))) {
        wok.item = { ing: hand.ing, cooked: false };
        wok.progress = 0;
        wok.cooking = true;
        p.carrying = null;
        AudioSys.sizzleStart();
      } else if (wok.item && wok.item.cooked && !hand) {
        p.carrying = { kind: 'cooked', ing: wok.item.ing };
        s.stats.cooked += 1;
        wok.item = null;
        wok.progress = 0;
        wok.cooking = false;
        AudioSys.pickup();
      } else if (wok.item && !wok.item.cooked) {
        this.showMessage('Still sizzling…', PALETTE.gold);
      } else if (wok.item) {
        this.showMessage('Wok is busy', PALETTE.red);
      } else {
        this.showMessage('Chop it first, or use noodles / rice', PALETTE.red);
      }
      return;
    }

    if (st.kind === 'plating') {
      if (hand && hand.kind === 'cooked') {
        if (s.plate.items.length >= 3) { this.showMessage('Plate is full!', PALETTE.red); return; }
        s.plate.items.push(hand.ing);
        p.carrying = null;
        AudioSys.place();
        return;
      }
      if (!hand && s.plate.loc === 'counter') {
        const complete = plateMatchesRecipe(s.plate.items, s.plate.sauce);
        if (complete) {
          s.plate.loc = 'hand';
          p.carrying = { kind: 'plate' };
          AudioSys.pickup();
          return;
        }
        if (s.plate.items.length > 0 && !s.plate.sauce) {
          s.plate.sauce = true;
          AudioSys.ding();
          this.showMessage('Sauce added!', PALETTE.gold);
          return;
        }
        this.showMessage('Plate is empty', PALETTE.red);
      }
      return;
    }

    if (st.kind === 'bin') {
      if (hand) {
        if (hand.kind === 'plate') {
          s.plate.items = [];
          s.plate.sauce = false;
          s.plate.loc = 'counter';
        }
        p.carrying = null;
        AudioSys.place();
        this.showMessage('Binned it', PALETTE.cream);
      }
      return;
    }

    if (st.kind === 'window') {
      if (!hand || hand.kind !== 'plate') {
        this.showMessage('Bring a finished plate!', PALETTE.red);
        return;
      }
      const dish = plateMatchesRecipe(s.plate.items, s.plate.sauce);
      if (!dish) {
        this.showMessage('Not a recipe yet!', PALETTE.red);
        AudioSys.refused();
        s.score = Math.max(0, s.score - CONFIG.wrongServePenalty);
        return;
      }
      const orderIdx = s.orders.findIndex((o) => o.recipe.id === dish.id);
      if (orderIdx === -1) {
        this.showMessage('Nobody ordered that!', PALETTE.red);
        AudioSys.refused();
        return;
      }
      const order = s.orders[orderIdx];
      s.orders.splice(orderIdx, 1);
      const patienceFrac = order.patience / order.maxPatience;
      const points = CONFIG.serveBase + Math.round(CONFIG.patienceBonusMax * patienceFrac);
      s.combo += 1;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      const coins = CONFIG.coinBase + dish.price + CONFIG.coinComboBonus * (s.combo - 1);
      s.score += points;
      s.coins += coins;
      s.served += 1;
      s.stats.plates += 1;
      s.plate.items = [];
      s.plate.sauce = false;
      s.plate.loc = 'counter';
      p.carrying = null;
      const win = stationCenter(STATIONS.window);
      this.burst(win.x - 40, win.y, PALETTE.gold, 22, 170);
      this.addFloater(win.x - 40, win.y - 60, `+${points}  +${coins}c`, PALETTE.gold);
      this.showMessage(`${dish.name} served! Combo x${s.combo}`, PALETTE.green);
      AudioSys.coin();
      AudioSys.ding();
    }
  },

  // --- update ------------------------------------------------------------

  update(dt) {
    const s = this.state;
    if (s.mode !== 'playing') return;

    // Timers and spawning freeze in shot mode so the scene stays composed.
    if (!s.shotMode) {
      s.elapsed += dt;
      s.timeLeft = Math.max(0, CONFIG.shiftSeconds - s.elapsed);
      if (!s.rush && s.timeLeft <= CONFIG.rushSeconds) {
        s.rush = true;
        if (!s.rushAnnounced) {
          s.rushAnnounced = true;
          this.showMessage('RUSH HOUR!', PALETTE.red);
          AudioSys.rushHorn();
          AudioSys.setRush(true);
        }
      }
      if (s.timeLeft <= 0) {
        s.mode = 'end';
        return;
      }
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        this.spawnOrder();
        s.spawnTimer = this.spawnGap();
      }
      for (let i = s.orders.length - 1; i >= 0; i--) {
        const o = s.orders[i];
        o.patience -= dt;
        if (o.patience <= 0) {
          s.orders.splice(i, 1);
          s.lost += 1;
          s.combo = 0;
          s.score = Math.max(0, s.score - CONFIG.latePenalty);
          this.showMessage(`${o.recipe.name} walked away…`, PALETTE.red);
          AudioSys.lost();
        }
      }
    }

    // Chopping progresses on its own once an item is on the board.
    for (const board of s.boards) {
      if (board.item && !board.item.chopped) {
        const need = INGREDIENTS[board.item.ing].chopSeconds;
        board.progress += dt / need;
        if (Math.random() < dt * 6) {
          this.burst(board.def.x, board.def.y - 10, '#e8dcc0', 2, 60);
        }
        if (board.progress >= 1) {
          board.item.chopped = true;
          board.progress = 1;
          board.chopping = false;
          AudioSys.ding();
        }
      }
    }
    // Woks cook on their own; steam rises while they do.
    for (const wok of s.woks) {
      if (wok.item && !wok.item.cooked) {
        const need = INGREDIENTS[wok.item.ing].cookSeconds;
        wok.progress += dt / need;
        if (Math.random() < dt * 8) this.steam(wok.def.x, wok.def.y);
        if (wok.progress >= 1) {
          wok.item.cooked = true;
          wok.progress = 1;
          wok.cooking = false;
          AudioSys.ding();
          this.addFloater(wok.def.x, wok.def.y - 50, 'Ready!', PALETTE.green);
        }
      }
    }

    // Movement: keyboard first, then click-to-move.
    const p = s.player;
    const mv = Input.moveVector();
    if (mv.x !== 0 || mv.y !== 0) {
      p.tx = null; p.ty = null; p.pendingStation = null;
      p.x += mv.x * CONFIG.playerSpeed * dt;
      p.y += mv.y * CONFIG.playerSpeed * dt;
      if (mv.x !== 0) p.facing = mv.x > 0 ? 1 : -1;
    } else if (p.tx !== null && p.ty !== null) {
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        p.tx = null; p.ty = null;
        if (p.pendingStation) {
          const st = p.pendingStation;
          p.pendingStation = null;
          this.interactAt(st);
        }
      } else {
        const step = CONFIG.playerSpeed * dt;
        p.x += (dx / d) * Math.min(step, d);
        p.y += (dy / d) * Math.min(step, d);
        if (dx !== 0) p.facing = dx > 0 ? 1 : -1;
      }
    }

    // Keep the chef inside the kitchen floor.
    p.x = Math.max(150, Math.min(CONFIG.canvasWidth - 30, p.x));
    p.y = Math.max(CONFIG.floorTop + 24, Math.min(CONFIG.canvasHeight - 30, p.y));

    // Mouse click: walk to a station and use it, or just walk there.
    const click = Input.takeClick();
    if (click) {
      const st = this.stationAtPoint(click.x, click.y);
      if (st) {
        const c = stationCenter(st);
        const approachY = st.kind === 'window' ? st.y + 40 : c.y;
        p.tx = st.kind === 'crate' ? c.x + 80 : c.x;
        p.ty = approachY;
        if (st.kind === 'window') p.tx = c.x - 90;
        p.pendingStation = st;
      } else {
        p.tx = click.x;
        p.ty = click.y;
        p.pendingStation = null;
      }
    }

    if (Input.interactPressed()) this.interact();
    if (Input.wasPressed('m')) {
      const muted = AudioSys.toggleMute();
      this.showMessage(muted ? 'Muted' : 'Sound on', PALETTE.cream);
    }

    // Particles and floaters always animate, even in shot mode.
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const pt = s.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind === 'steam') pt.vy -= 12 * dt;
      else pt.vy += 160 * dt;
      if (pt.life <= 0) s.particles.splice(i, 1);
    }
    for (let i = s.floaters.length - 1; i >= 0; i--) {
      const f = s.floaters[i];
      f.life -= dt;
      f.y -= 30 * dt;
      if (f.life <= 0) s.floaters.splice(i, 1);
    }
    if (s.messageTimer > 0) s.messageTimer -= dt;
  },

  stationAtPoint(x, y) {
    const all = [
      ...STATIONS.crates,
      ...STATIONS.boards,
      ...STATIONS.woks,
      STATIONS.plating, STATIONS.bin, STATIONS.window,
    ];
    for (const st of all) {
      if (x >= st.x - st.w / 2 && x <= st.x + st.w / 2 && y >= st.y - st.h / 2 && y <= st.y + st.h / 2) {
        return st;
      }
    }
    return null;
  },

  // Use a station from a click-to-move arrival (same rules as E).
  interactAt(st) {
    const s = this.state;
    const p = s.player;
    const c = stationCenter(st);
    const d = dist(p.x, p.y, c.x, st.kind === 'window' ? st.y + 40 : c.y);
    if (d <= CONFIG.interactRadius + 60) this.interact();
  },
};
