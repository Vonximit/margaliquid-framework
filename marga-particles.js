(function (global) {
  'use strict';

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
    colors: ['#7dd3fc', '#a78bfa', '#f9a8d4', '#fcd34d', '#5eead4']
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
      this.config = Object.assign({}, DEFAULTS, options || {});
      this.palette = this.config.colors.map(hexToHsl);
      this.t = 0;
      this.particles = [];
      this.center = { x: 0, y: 0 };

      this.container.style.position = this.container.style.position || 'relative';
      this.container.style.overflow = this.container.style.overflow || 'hidden';
      if (this.config.background !== 'transparent') {
        this.container.style.background = this.config.background;
      }

      this.canvas = document.createElement('canvas');
      this.canvas.style.display = 'block';
      this.canvas.style.width = this.config.width;
      this.canvas.style.height = this.config.height;
      this.canvas.style.position = 'absolute';
      this.canvas.style.inset = '0';
      this.canvas.style.pointerEvents = this.config.interactive ? 'auto' : 'none';
      this.container.appendChild(this.canvas);

      this.ctx = this.canvas.getContext('2d');

      this.handleResize = this.resize.bind(this);
      this.handleMouseMove = this.onMouseMove.bind(this);
      this.handleClick = this.onClick.bind(this);
      this.raf = null;
      this.destroyed = false;

      this.resize();
      this.reseed();
      window.addEventListener('resize', this.handleResize);
      if (this.config.interactive) {
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('click', this.handleClick);
      }
      this.animate();
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      this.width = Math.max(1, rect.width || this.container.clientWidth || 600);
      this.height = Math.max(1, rect.height || this.container.clientHeight || 400);
      const dpr = window.devicePixelRatio || 1;
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

    onMouseMove(event) {
      const rect = this.canvas.getBoundingClientRect();
      this.center.x = event.clientX - rect.left;
      this.center.y = event.clientY - rect.top;
    }

    onClick(event) {
      const rect = this.canvas.getBoundingClientRect();
      this.center.x = event.clientX - rect.left;
      this.center.y = event.clientY - rect.top;
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

    animate() {
      if (this.destroyed) return;
      this.t++;
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.drawMist();
      this.drawField();

      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].update();
        this.particles[i].draw(this.ctx);
      }

      this.raf = requestAnimationFrame(this.animate.bind(this));
    }

    update(options) {
      Object.assign(this.config, options || {});
      if (options && options.colors) {
        this.palette = this.config.colors.map(hexToHsl);
        this.reseed();
      }
      if (options && typeof options.particleCount === 'number') {
        this.reseed();
      }
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this.handleResize);
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('click', this.handleClick);
      if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  const api = {
    mount(target, options) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) {
        throw new Error('MargaParticles: container not found');
      }
      return new Engine(container, options);
    }
  };

  global.MargaParticles = api;
})(window);
