// input.js — keyboard + mouse input, shared by world.js and main.js.
// Keyboard: WASD / arrows move, E or Space interacts, Enter starts,
// M mutes. Mouse: click to walk there; clicking a station walks to it and
// uses it on arrival. Nothing here touches the canvas directly.

const Input = {
  keys: {},          // currently held keys, by KeyboardEvent.key
  pressed: {},       // keys pressed since the last frame (edge-triggered)
  click: null,       // {x, y} of the latest mouse click, consumed by world
  canvas: null,

  attach(canvas) {
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!e.repeat) this.pressed[e.key.toLowerCase()] = true;
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.click = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
      AudioSys.unlock();
    });
    window.addEventListener('keydown', () => AudioSys.unlock(), { once: true });
  },

  // Movement direction from held keys, normalised to length 1 or 0.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) x += 1;
    if (this.keys['w'] || this.keys['arrowup']) y -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.sqrt(2);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  },

  // True once for a key pressed since the last endFrame() call.
  wasPressed(key) {
    return !!this.pressed[key.toLowerCase()];
  },

  interactPressed() {
    return this.wasPressed('e') || this.wasPressed(' ');
  },

  takeClick() {
    const c = this.click;
    this.click = null;
    return c;
  },

  endFrame() {
    this.pressed = {};
  },
};
