// render.js — every pixel of Sizzle Street is drawn in code: the lantern-lit
// night-market stall, the counters, the food, the chef and the HUD. It reads
// World.state and never changes it.

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawIngredientIcon(ctx, ing, x, y, r) {
  const def = INGREDIENTS[ing];
  ctx.save();
  ctx.translate(x, y);
  if (ing === 'noodle') {
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.4 + i * 0.28), i * 1.2, i * 1.2 + Math.PI * 1.4);
      ctx.stroke();
    }
  } else if (ing === 'rice') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 2, r * 0.8, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.dark;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-r * 0.5 + i * r * 0.25, -r * 0.3 + (i % 2) * r * 0.25, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ing === 'chicken') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.85, r * 0.6, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = def.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r * 0.5, -r * 0.4);
    ctx.lineTo(r * 0.9, -r * 0.9);
    ctx.stroke();
    ctx.fillStyle = '#f5f0dc';
    ctx.beginPath();
    ctx.arc(r * 0.95, -r * 0.95, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing === 'veg') {
    ctx.fillStyle = def.color;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i - 1) * 0.7);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.45, r * 0.32, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = def.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.2);
    ctx.lineTo(0, r * 0.8);
    ctx.stroke();
  } else if (ing === 'egg') {
    ctx.fillStyle = '#fff8e6';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.9, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.stroke();
  ctx.restore();
}

function drawProgressBar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x + 1, y + 1, Math.max(h - 2, (w - 2) * frac), h - 2, (h - 2) / 2);
    ctx.fill();
  }
}

const Render = {
  draw(ctx) {
    const s = World.state;
    this.drawFloor(ctx);
    if (s.mode === 'title') { this.drawTitle(ctx); return; }
    this.drawOrderBoard(ctx);
    this.drawStations(ctx);
    this.drawPlayer(ctx);
    this.drawParticles(ctx);
    this.drawHud(ctx);
    if (s.mode === 'end') this.drawEnd(ctx);
    if (s.rush && s.mode === 'playing') this.drawRushGlow(ctx);
  },

  drawFloor(ctx) {
    const s = World.state;
    ctx.fillStyle = PALETTE.night;
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    // Checker floor tiles.
    const tile = 64;
    for (let ty = CONFIG.floorTop; ty < CONFIG.canvasHeight; ty += tile) {
      for (let tx = 0; tx < CONFIG.canvasWidth; tx += tile) {
        const even = ((tx / tile) + (ty / tile)) % 2 === 0;
        ctx.fillStyle = even ? PALETTE.night : PALETTE.nightAlt;
        ctx.fillRect(tx, ty, tile, tile);
      }
    }
    // Red-and-cream awning stripe along the top of the kitchen.
    const stripeW = 80;
    for (let x = 0; x < CONFIG.canvasWidth; x += stripeW) {
      ctx.fillStyle = (x / stripeW) % 2 === 0 ? PALETTE.awningRed : PALETTE.awningCream;
      ctx.fillRect(x, CONFIG.floorTop, stripeW, 16);
    }
    // Hanging lanterns with a warm glow.
    for (const lx of [240, 520, 800, 1080]) {
      ctx.fillStyle = PALETTE.lanternGlow;
      ctx.beginPath();
      ctx.arc(lx, CONFIG.floorTop + 52, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7a4a12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, CONFIG.floorTop + 16);
      ctx.lineTo(lx, CONFIG.floorTop + 30);
      ctx.stroke();
      ctx.fillStyle = PALETTE.lantern;
      ctx.beginPath();
      ctx.ellipse(lx, CONFIG.floorTop + 48, 16, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.awningRed;
      ctx.fillRect(lx - 16, CONFIG.floorTop + 40, 32, 5);
      ctx.fillRect(lx - 16, CONFIG.floorTop + 51, 32, 5);
    }
  },

  drawOrderBoard(ctx) {
    const s = World.state;
    ctx.fillStyle = '#1b3a44';
    ctx.fillRect(0, CONFIG.boardTop, CONFIG.canvasWidth, CONFIG.boardHeight);
    ctx.fillStyle = PALETTE.counterWood;
    ctx.fillRect(0, CONFIG.boardTop + CONFIG.boardHeight - 6, CONFIG.canvasWidth, 6);

    // Order cards fan out left and right of the timer in the middle.
    const cardW = 196;
    const cardH = 76;
    const gap = 12;
    const leftX = 24;
    const rightX = CONFIG.canvasWidth - 24 - cardW;
    s.orders.forEach((order, i) => {
      const left = i % 2 === 0;
      const slot = Math.floor(i / 2);
      const x = left ? leftX + slot * (cardW + gap) : rightX - slot * (cardW + gap);
      const y = 24;
      const frac = Math.max(0, order.patience / order.maxPatience);
      ctx.fillStyle = frac < 0.3 ? '#5a2320' : '#fdf3d8';
      roundRect(ctx, x, y, cardW, cardH, 10);
      ctx.fill();
      ctx.fillStyle = frac < 0.3 ? PALETTE.cream : PALETTE.ink;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(order.recipe.name, x + 10, y + 20);
      // Ingredient dots.
      order.recipe.needs.forEach((ing, j) => {
        drawIngredientIcon(ctx, ing, x + 22 + j * 30, y + 40, 10);
      });
      if (order.recipe.sauce) {
        ctx.fillStyle = '#c0392b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('+ sauce', x + 22 + order.recipe.needs.length * 30, y + 44);
      }
      drawProgressBar(ctx, x + 10, y + 58, cardW - 20, 10, frac, frac < 0.3 ? PALETTE.red : PALETTE.green);
    });
    if (s.orders.length === 0) {
      ctx.fillStyle = 'rgba(253,243,216,0.6)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('No orders yet — the night is young…', 24, 66);
    }

    // Big round shift timer in the centre.
    const cx = CONFIG.canvasWidth / 2;
    const cy = CONFIG.boardTop + 52;
    const tFrac = s.timeLeft / CONFIG.shiftSeconds;
    ctx.fillStyle = s.rush ? PALETTE.red : '#0e2a33';
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(cx, cy, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tFrac);
    ctx.stroke();
    const mins = Math.floor(s.timeLeft / 60);
    const secs = Math.floor(s.timeLeft % 60);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, cx, cy + 8);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(s.rush ? 'RUSH HOUR' : 'SHIFT', cx, cy - 52 + 30);
  },

  drawStations(ctx) {
    const s = World.state;
    // Ingredient crates down the left wall.
    for (const crate of STATIONS.crates) {
      const def = INGREDIENTS[crate.ing];
      ctx.fillStyle = PALETTE.counterTop;
      roundRect(ctx, crate.x - crate.w / 2, crate.y - crate.h / 2, crate.w, crate.h, 8);
      ctx.fill();
      ctx.strokeStyle = PALETTE.counterWood;
      ctx.lineWidth = 3;
      roundRect(ctx, crate.x - crate.w / 2, crate.y - crate.h / 2, crate.w, crate.h, 8);
      ctx.stroke();
      drawIngredientIcon(ctx, crate.ing, crate.x, crate.y - 12, 24);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(def.name, crate.x, crate.y + 28);
      if (def.chopSeconds) {
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#5a4632';
        ctx.fillText('chop first', crate.x, crate.y + 44);
      }
    }
    // Chopping boards.
    for (const board of s.boards) {
      const b = board.def;
      ctx.fillStyle = PALETTE.boardWood;
      roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#a67c52';
      ctx.lineWidth = 3;
      roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHOP', b.x, b.y - b.h / 2 + 16);
      if (board.item) {
        drawIngredientIcon(ctx, board.item.ing, b.x, b.y + 6, 22);
        if (!board.item.chopped) {
          drawProgressRing(ctx, b.x, b.y + 6, 24, board.progress, PALETTE.gold);
        } else {
          ctx.fillStyle = PALETTE.green;
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('CHOPPED ✓', b.x, b.y + b.h / 2 - 12);
        }
      }
    }
    // Woks.
    for (const wok of s.woks) {
      const w = wok.def;
      ctx.fillStyle = '#6b4a2f';
      roundRect(ctx, w.x - w.w / 2, w.y - w.h / 2, w.w, w.h, 8);
      ctx.fill();
      ctx.fillStyle = PALETTE.wokIron;
      ctx.beginPath();
      ctx.ellipse(w.x, w.y + 6, 50, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22262a';
      ctx.beginPath();
      ctx.ellipse(w.x, w.y + 6, 42, 21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WOK', w.x, w.y - w.h / 2 + 16);
      if (wok.item) {
        drawIngredientIcon(ctx, wok.item.ing, w.x, w.y + 6, 18);
        if (!wok.item.cooked) {
          drawProgressBar(ctx, w.x - 40, w.y + 22, 80, 8, wok.progress, '#ff8c42');
        } else {
          ctx.fillStyle = PALETTE.green;
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('READY ✓', w.x, w.y + w.h / 2 - 12);
        }
      }
    }
    // Plating counter with the plate.
    const pl = STATIONS.plating;
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, pl.x - pl.w / 2, pl.y - pl.h / 2, pl.w, pl.h, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.counterWood;
    ctx.lineWidth = 3;
    roundRect(ctx, pl.x - pl.w / 2, pl.y - pl.h / 2, pl.w, pl.h, 10);
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PLATING', pl.x, pl.y - pl.h / 2 + 20);
    if (s.plate.loc === 'counter') this.drawPlate(ctx, pl.x, pl.y + 12, 30);
    // Sauce bottle on the plating counter.
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, pl.x + pl.w / 2 - 26, pl.y - pl.h / 2 + 30, 16, 30, 5);
    ctx.fill();
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('SAUCE', pl.x + pl.w / 2 - 18, pl.y - pl.h / 2 + 48);
    // Bin.
    const bin = STATIONS.bin;
    ctx.fillStyle = PALETTE.steel;
    roundRect(ctx, bin.x - bin.w / 2, bin.y - bin.h / 2, bin.w, bin.h, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('BIN', bin.x, bin.y + 4);
    // Serving window with a customer.
    const win = STATIONS.window;
    ctx.fillStyle = '#7a2e1d';
    roundRect(ctx, win.x - win.w / 2, win.y - win.h / 2, win.w, win.h, 10);
    ctx.fill();
    ctx.fillStyle = '#f5e6c8';
    roundRect(ctx, win.x - win.w / 2 + 8, win.y - win.h / 2 + 8, win.w - 16, 74, 8);
    ctx.fill();
    if (s.orders.length > 0) {
      // A waiting customer, face and all.
      ctx.fillStyle = '#f2c89b';
      ctx.beginPath();
      ctx.arc(win.x, win.y - 48, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2a1a';
      ctx.beginPath();
      ctx.arc(win.x, win.y - 56, 22, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(win.x - 8, win.y - 48, 2.5, 0, Math.PI * 2);
      ctx.arc(win.x + 8, win.y - 48, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(win.x, win.y - 42, 8, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SERVE!', win.x, win.y + 52);
    } else {
      ctx.fillStyle = '#8a7a5a';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('no queue', win.x, win.y - 20);
      ctx.fillText('…yet', win.x, win.y - 2);
    }
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('WINDOW', win.x, win.y + win.h / 2 - 12);
  },

  drawPlate(ctx, x, y, r) {
    const s = World.state;
    ctx.fillStyle = '#fdfdfd';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9bd93';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    s.plate.items.forEach((ing, i) => {
      drawIngredientIcon(ctx, ing, x - (s.plate.items.length - 1) * 14 + i * 28, y - 2, 12);
    });
    if (s.plate.sauce) {
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(x + r * 0.55, y - r * 0.4, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    const dish = plateMatchesRecipe(s.plate.items, s.plate.sauce);
    if (dish) {
      ctx.fillStyle = PALETTE.green;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dish.name + ' ✓', x, y + r * 0.85 + 12);
    }
  },

  drawPlayer(ctx) {
    const s = World.state;
    const p = s.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body (apron).
    ctx.fillStyle = '#f5f0dc';
    roundRect(ctx, -16, -6, 32, 26, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.awningRed;
    ctx.fillRect(-16, 6, 32, 6);
    // Head.
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath();
    ctx.arc(0, -16, 13, 0, Math.PI * 2);
    ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -26, 8, 0, Math.PI * 2);
    ctx.arc(0, -30, 9, 0, Math.PI * 2);
    ctx.arc(8, -26, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-14, -28, 28, 6);
    // Eyes look where the chef walks.
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(p.facing * 3 - 4, -16, 2, 0, Math.PI * 2);
    ctx.arc(p.facing * 3 + 4, -16, 2, 0, Math.PI * 2);
    ctx.fill();
    // What the chef carries, held up high.
    if (p.carrying) {
      if (p.carrying.kind === 'plate') {
        this.drawPlate(ctx, 0, -52, 22);
      } else {
        drawIngredientIcon(ctx, p.carrying.ing, 0, -50, 16);
        ctx.fillStyle = PALETTE.cream;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        const label = p.carrying.kind === 'raw' ? 'raw' : p.carrying.kind === 'chopped' ? 'chopped' : 'cooked';
        ctx.fillText(label, 0, -66);
      }
    }
    ctx.restore();
    // Click-to-move target marker.
    if (p.tx !== null) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.tx, p.ty, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  drawParticles(ctx) {
    const s = World.state;
    for (const pt of s.particles) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (pt.kind === 'steam' ? (1.6 - alpha * 0.6) : 1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    for (const f of s.floaters) {
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  },

  drawHud(ctx) {
    const s = World.state;
    // Score / coins / combo, bottom-left.
    ctx.fillStyle = 'rgba(14,42,51,0.85)';
    roundRect(ctx, 16, CONFIG.canvasHeight - 64, 300, 48, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${s.score}`, 30, CONFIG.canvasHeight - 38);
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(160, CONFIG.canvasHeight - 44, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a4a12';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('c', 160, CONFIG.canvasHeight - 40);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`${s.coins}`, 176, CONFIG.canvasHeight - 38);
    if (s.combo >= 2) {
      ctx.fillStyle = '#ff8c42';
      ctx.fillText(`COMBO x${s.combo}`, 240, CONFIG.canvasHeight - 38);
    }
    // Served / lost, bottom-right.
    ctx.fillStyle = 'rgba(14,42,51,0.85)';
    roundRect(ctx, CONFIG.canvasWidth - 316, CONFIG.canvasHeight - 64, 300, 48, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Served ${s.served}   Lost ${s.lost}`, CONFIG.canvasWidth - 300, CONFIG.canvasHeight - 38);
    ctx.fillStyle = 'rgba(253,243,216,0.7)';
    ctx.font = '13px sans-serif';
    ctx.fillText('WASD move · E interact · M mute', CONFIG.canvasWidth - 300, CONFIG.canvasHeight - 18);
    // Centre message, low on the floor so it never covers the lanterns.
    if (s.messageTimer > 0) {
      ctx.globalAlpha = Math.min(1, s.messageTimer);
      ctx.fillStyle = s.messageColor;
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.message, CONFIG.canvasWidth / 2, 745);
      ctx.globalAlpha = 1;
    }
    if (s.rush && s.mode === 'playing') {
      ctx.fillStyle = PALETTE.red;
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RUSH HOUR', CONFIG.canvasWidth / 2, 205);
    }
  },

  drawRushGlow(ctx) {
    const g = ctx.createRadialGradient(
      CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2, CONFIG.canvasHeight * 0.35,
      CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2, CONFIG.canvasHeight * 0.75,
    );
    g.addColorStop(0, 'rgba(231,76,60,0)');
    g.addColorStop(1, 'rgba(231,76,60,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  },

  drawTitle(ctx) {
    const s = World.state;
    ctx.fillStyle = 'rgba(10,26,32,0.82)';
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    // Lantern row.
    for (const lx of [200, 440, 640, 840, 1080]) {
      ctx.fillStyle = PALETTE.lanternGlow;
      ctx.beginPath();
      ctx.arc(lx, 150, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.lantern;
      ctx.beginPath();
      ctx.ellipse(lx, 150, 24, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.awningRed;
      ctx.fillRect(lx - 24, 138, 48, 6);
      ctx.fillRect(lx - 24, 158, 48, 6);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('SIZZLE STREET', CONFIG.canvasWidth / 2, 290);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('Night Market Kitchen', CONFIG.canvasWidth / 2, 340);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(253,243,216,0.9)';
    ctx.fillText('Grab it. Chop it. Wok it. Plate it. Serve it before patience runs out!', CONFIG.canvasWidth / 2, 400);
    ctx.fillText('WASD / arrows to move  ·  E or click to use a station  ·  M to mute', CONFIG.canvasWidth / 2, 436);
    // How-to icons: crate → board → wok → plate → window.
    const steps = ['Grab from a crate', 'Chop on a board', 'Sizzle in a wok', 'Plate + sauce', 'Serve at the window'];
    steps.forEach((label, i) => {
      const x = 190 + i * 225;
      ctx.fillStyle = 'rgba(253,243,216,0.12)';
      roundRect(ctx, x - 95, 480, 190, 86, 12);
      ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`${i + 1}`, x, 512);
      ctx.fillStyle = PALETTE.cream;
      ctx.font = '15px sans-serif';
      ctx.fillText(label, x, 544);
    });
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 28px sans-serif';
    const blink = Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) ctx.fillText('Press ENTER to start the shift', CONFIG.canvasWidth / 2, 640);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(253,243,216,0.7)';
    ctx.fillText('3-minute shift · 4 recipes · the last 30 seconds are RUSH HOUR', CONFIG.canvasWidth / 2, 680);
  },

  drawEnd(ctx) {
    const s = World.state;
    ctx.fillStyle = 'rgba(10,26,32,0.85)';
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText('SHIFT OVER!', CONFIG.canvasWidth / 2, 260);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`Dishes served: ${s.served}    Coins earned: ${s.coins}`, CONFIG.canvasWidth / 2, 340);
    ctx.fillText(`Score: ${s.score}    Best combo: x${s.bestCombo}`, CONFIG.canvasWidth / 2, 390);
    ctx.font = '20px sans-serif';
    ctx.fillText(`Orders lost: ${s.lost}   ·   Chopped ${s.stats.chopped} · Cooked ${s.stats.cooked}`, CONFIG.canvasWidth / 2, 440);
    const verdict = s.served >= 12 ? 'The street is talking about your stall!' : s.served >= 6 ? 'A solid night at the market.' : 'The wok is still warm — go again!';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(verdict, CONFIG.canvasWidth / 2, 500);
    const blink = Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PALETTE.cream;
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Press ENTER to work another shift', CONFIG.canvasWidth / 2, 580);
    }
  },
};
