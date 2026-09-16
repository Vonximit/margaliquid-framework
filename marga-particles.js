(function (global) {
  'use strict';

  const VERSION = '0.2.0';

  const DEFAULTS = {
    width: '100%',
    height: '100%',
    background: 'transparent',
    particleCount: 90,
    pull: 1.15,
    swirl: 0.42,
    friction: 0.979,
    breath: 0.55,
    interactive: true,
    fieldVisible: true,
    centerX: 0.5,
    centerY: 0.5,
    maxRadius: 0.38,
    maxDpr: 2,
    respectReducedMotion: true,
    colors: ['#7dd3fc', '#a78bfa', '#f9a8d4', '#fcd34d', '#5eead4']
  };

  const NUMBER_LIMITS = {
    particleCount: [1, 500],
    pull: [0, 5],
    swirl: [-3, 3],
    friction: [0.8, 1],
    breath: [0, 2],
    centerX: [0, 1],
    centerY: [0, 1],
    maxRadius: [0.05, 1],
    maxDpr: [1, 3]
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeColors(colors) {
    if (!Array.isArray(colors)) return DEFAULTS.colors.slice();
    const valid = colors
      .map(color => String(color).trim())
      .filter(color => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
    return valid.length ? valid : DEFAULTS.colors.slice();
  }

  function normalizeOptions(options) {
    const input = options && typeof options === 'object' ? options : {};
    const normalized = Object.assign({}, DEFAULTS);

    for (const key of Object.keys(NUMBER_LIMITS)) {
      const number = Number(input[key] ?? DEFAULTS[key]);
      const fallback = DEFAULTS[key];
      const [min, max] = NUMBER_LIMITS[key];
      normalized[key] = Number.isFinite(number) ? clamp(number, min, max) : fallback;
    }
    normalized.particleCount = Math.round(normalized.particleCount);
    normalized.width = typeof input.width === 'string' ? input.width : DEFAULTS.width;
    normalized.height = typeof input.height === 'string' ? input.height : DEFAULTS.height;
    normalized.background = typeof input.background === 'string'
      ? input.background
      : DEFAULTS.background;
    normalized.interactive = input.interactive === undefined
      ? DEFAULTS.interactive
      : Boolean(input.interactive);
    normalized.fieldVisible = input.fieldVisible === undefined
      ? DEFAULTS.fieldVisible
      : Boolean(input.fieldVisible);
    normalized.respectReducedMotion = input.respectReducedMotion === undefined
      ? DEFAULTS.respectReducedMotion
      : Boolean(input.respectReducedMotion);
    normalized.colors = normalizeColors(input.colors ?? DEFAULTS.colors);
    return normalized;
  }

  function hexToHsl(hex) {
    hex = String(hex).replace('#', '').trim();
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  class Particle {
    constructor(engine) {
      this.engine = engine;
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * Math.min(engine.width, engine.height) * engine.config.maxRadius;
      this.x = engine.center.x + Math.cos(angle) * radius;
      this.y = engine.center.y + Math.sin(angle) * radius;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
      this.r = 2 + Math.random() * 6;
      const chosen = engine.palette[Math.floor(Math.random() * engine.palette.length)];
      this.h = chosen.h;
      this.s = chosen.s;
      this.l = chosen.l;
      this.alpha = 0.30 + Math.random() * 0.45;
    }

    update() {
      const state = this.engine.config;
      const dx = this.engine.center.x - this.x;
      const dy = this.engine.center.y - this.y;
      const distSq = dx * dx + dy * dy + 0.0001;
      const dist = Math.sqrt(distSq);

      const pulse = 1 + Math.sin(this.engine.t * 0.02 + dist * 0.02) * 0.18 * state.breath;
      const force = (state.pull * pulse) / (dist * 0.18 + 14);

      this.vx += dx * force * 0.022;
      this.vy += dy * force * 0.022;

      if (dist > 0) {
        const tx = -dy / dist;
        const ty = dx / dist;
        this.vx += tx * state.swirl * 0.038;
        this.vy += ty * state.swirl * 0.038;
      }

      this.vx *= state.friction;
      this.vy *= state.friction;

      this.x += this.vx;
      this.y += this.vy;

      if (this.x < -80) this.x = this.engine.width + 80;
      if (this.x > this.engine.width + 80) this.x = -80;
      if (this.y < -80) this.y = this.engine.height + 80;
      if (this.y > this.engine.height + 80) this.y = -80;
    }

    draw(ctx) {
      const speed = Math.hypot(this.vx, this.vy);
      const hueShift = speed * 10;

      ctx.beginPath();
      ctx.strokeStyle = `hsla(${this.h + hueShift + 14}, ${this.s}%, ${this.l}%, ${this.alpha * 0.18})`;
      ctx.lineWidth = this.r * 1.1;
      ctx.lineCap = 'round';
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 7, this.y - this.vy * 7);
      ctx.stroke();

      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3.8);
      g.addColorStop(0, `hsla(${this.h + hueShift}, ${this.s}%, ${clamp(this.l + 16, 0, 100)}%, ${this.alpha})`);
      g.addColorStop(0.28, `hsla(${this.h + 14 + hueShift}, ${clamp(this.s + 4, 0, 100)}%, ${this.l}%, ${this.alpha * 0.76})`);
      g.addColorStop(0.64, `hsla(${this.h + 38 + hueShift}, ${clamp(this.s + 8, 0, 100)}%, ${clamp(this.l - 10, 0, 100)}%, ${this.alpha * 0.30})`);
      g.addColorStop(1, `hsla(${this.h + 64 + hueShift}, ${this.s}%, ${clamp(this.l - 16, 0, 100)}%, 0)`);

      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.arc(this.x, this.y, this.r * 3.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `hsla(${this.h + hueShift}, ${clamp(this.s + 8, 0, 100)}%, ${clamp(this.l + 18, 0, 100)}%, ${Math.min(1, this.alpha + 0.16)})`;
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class Engine {
    constructor(container, options) {
      this.container = container;
      this.config = normalizeOptions(options);
      this.palette = this.config.colors.map(hexToHsl);
      this.t = 0;
      this.particles = [];
      this.center = { x: 0, y: 0 };

      this.initialStyles = {
        position: this.container.style.position,
        overflow: this.container.style.overflow,
        background: this.container.style.background
      };
      this.container.style.position = this.container.style.position || 'relative';
      this.container.style.overflow = this.container.style.overflow || 'hidden';
      this.applyBackground();

      this.canvas = global.document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.setAttribute('role', 'presentation');
      this.canvas.style.display = 'block';
      this.canvas.style.width = this.config.width;
      this.canvas.style.height = this.config.height;
      this.canvas.style.position = 'absolute';
      this.canvas.style.inset = '0';
      this.container.appendChild(this.canvas);

      this.ctx = this.canvas.getContext('2d');

      this.handleResize = this.resize.bind(this);
      this.handlePointer = this.onPointer.bind(this);
      this.handleVisibility = this.onVisibilityChange.bind(this);
      this.handleAnimationFrame = this.animate.bind(this);
      this.raf = null;
      this.destroyed = false;
      this.paused = true;
      this.visibilityPaused = false;

      this.resize();
      this.reseed();
      global.addEventListener('resize', this.handleResize);
      global.document.addEventListener('visibilitychange', this.handleVisibility);
      this.configureInteraction();
      this.resizeObserver = typeof global.ResizeObserver === 'function'
        ? new global.ResizeObserver(this.handleResize)
        : null;
      if (this.resizeObserver) this.resizeObserver.observe(this.container);

      const reduceMotion = this.config.respectReducedMotion
        && typeof global.matchMedia === 'function'
        && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        this.drawFrame();
      } else {
        this.resume();
      }
    }

    applyBackground() {
      this.container.style.background = this.config.background;
    }

    configureInteraction() {
      this.canvas.removeEventListener('pointermove', this.handlePointer);
      this.canvas.removeEventListener('pointerdown', this.handlePointer);
      this.canvas.style.pointerEvents = this.config.interactive ? 'auto' : 'none';
      if (this.config.interactive) {
        this.canvas.addEventListener('pointermove', this.handlePointer);
        this.canvas.addEventListener('pointerdown', this.handlePointer);
      }
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      this.width = Math.max(1, rect.width || this.container.clientWidth || 600);
      this.height = Math.max(1, rect.height || this.container.clientHeight || 400);
      const dpr = Math.min(global.devicePixelRatio || 1, this.config.maxDpr);
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.center.x = this.width * this.config.centerX;
      this.center.y = this.height * this.config.centerY;
    }

    reseed() {
      this.particles = [];
      for (let i = 0; i < this.config.particleCount; i++) {
        this.particles.push(new Particle(this));
      }
    }

    onPointer(event) {
      const rect = this.canvas.getBoundingClientRect();
      this.center.x = event.clientX - rect.left;
      this.center.y = event.clientY - rect.top;
    }

    onVisibilityChange() {
      if (global.document.hidden && !this.paused) {
        this.visibilityPaused = true;
        this.pause();
      } else if (!global.document.hidden && this.visibilityPaused) {
        this.visibilityPaused = false;
        this.resume();
      }
    }

    drawField() {
      if (!this.config.fieldVisible) return;
      const pulseRadius = 80 + 26 * (1 + Math.sin(this.t * 0.03)) * this.config.breath;
      const outer = 180 + 40 * this.config.breath;

      const g = this.ctx.createRadialGradient(this.center.x, this.center.y, 0, this.center.x, this.center.y, outer);
      g.addColorStop(0, 'rgba(160, 210, 255, 0.20)');
      g.addColorStop(0.22, 'rgba(120, 255, 210, 0.10)');
      g.addColorStop(0.48, 'rgba(255, 120, 210, 0.06)');
      g.addColorStop(1, 'rgba(255,255,255,0)');

      this.ctx.beginPath();
      this.ctx.fillStyle = g;
      this.ctx.arc(this.center.x, this.center.y, outer, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.strokeStyle = 'rgba(220,230,255,0.18)';
      this.ctx.lineWidth = 1;
      this.ctx.arc(this.center.x, this.center.y, pulseRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    drawMist() {
      if (this.config.background === 'transparent') return;
      const g = this.ctx.createLinearGradient(0, 0, 0, this.height);
      g.addColorStop(0, 'rgba(10,20,40,0.10)');
      g.addColorStop(1, 'rgba(10,10,20,0.22)');
      this.ctx.fillStyle = g;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawFrame() {
      this.t++;
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.drawMist();
      this.drawField();

      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].update();
        this.particles[i].draw(this.ctx);
      }
    }

    animate() {
      if (this.destroyed || this.paused) return;
      this.drawFrame();
      this.raf = global.requestAnimationFrame(this.handleAnimationFrame);
    }

    pause() {
      if (this.destroyed || this.paused) return;
      this.paused = true;
      if (this.raf !== null) global.cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    resume() {
      if (this.destroyed || !this.paused) return;
      this.paused = false;
      this.raf = global.requestAnimationFrame(this.handleAnimationFrame);
    }

    update(options) {
      if (!options || typeof options !== 'object') return this;
      const previous = this.config;
      this.config = normalizeOptions(Object.assign({}, previous, options));

      const colorsChanged = this.config.colors.join(',') !== previous.colors.join(',');
      const countChanged = this.config.particleCount !== previous.particleCount;
      if (colorsChanged) this.palette = this.config.colors.map(hexToHsl);
      if (colorsChanged || countChanged) {
        this.reseed();
      }
      if (this.config.interactive !== previous.interactive) this.configureInteraction();
      if (this.config.background !== previous.background) this.applyBackground();
      if (this.config.width !== previous.width) this.canvas.style.width = this.config.width;
      if (this.config.height !== previous.height) this.canvas.style.height = this.config.height;
      this.resize();
      if (this.paused) this.drawFrame();
      return this;
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      if (this.raf !== null) global.cancelAnimationFrame(this.raf);
      global.removeEventListener('resize', this.handleResize);
      global.document.removeEventListener('visibilitychange', this.handleVisibility);
      this.canvas.removeEventListener('pointermove', this.handlePointer);
      this.canvas.removeEventListener('pointerdown', this.handlePointer);
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
      this.container.style.position = this.initialStyles.position;
      this.container.style.overflow = this.initialStyles.overflow;
      this.container.style.background = this.initialStyles.background;
    }
  }

  const api = {
    version: VERSION,
    defaults: Object.freeze(Object.assign({}, DEFAULTS, { colors: DEFAULTS.colors.slice() })),
    normalizeOptions,
    mount(target, options) {
      const container = typeof target === 'string' ? global.document.querySelector(target) : target;
      if (!container) {
        throw new Error('MargaParticles: container not found');
      }
      return new Engine(container, options);
    }
  };

  global.MargaParticles = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
