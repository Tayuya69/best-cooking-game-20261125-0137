// main.js — the game loop and the state machine (title / playing / end),
// plus shot mode: ?shot=cover|orders|cooking|serve composes a fixed scene
// and sets window.__shotReady once it has rendered, which is what the
// screenshot tool waits for.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

Input.attach(canvas);

let lastTime = performance.now();
let shotReadySignalled = false;

// Shot mode: ?shot=<name> (and an optional &seed=, ignored — the presets
// are fixed). The scene is composed, timers are frozen, and we report ready
// after a couple of frames so particles and steam have appeared.
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  applyShot(shotName);
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  const s = World.state;
  if (s.mode === 'title' && Input.wasPressed('enter')) {
    World.reset();
  } else if (s.mode === 'end' && Input.wasPressed('enter')) {
    World.reset();
  }
  // Clicking the title / end screen also starts the game.
  if ((s.mode === 'title' || s.mode === 'end') && Input.takeClick()) {
    World.reset();
  }

  World.update(dt);
  Render.draw(ctx);
  Input.endFrame();

  if (shotName && !shotReadySignalled) {
    shotReadySignalled = true;
    // One more painted frame, then tell the screenshot tool we are ready.
    requestAnimationFrame(() => {
      Render.draw(ctx);
      window.__shotReady = true;
    });
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
