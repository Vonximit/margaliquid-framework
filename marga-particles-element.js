(function () {
  'use strict';

  if (!window.MargaParticles) {
    throw new Error('marga-particles-element.js requires marga-particles.js first');
  }

  class MargaParticlesElement extends HTMLElement {
    static get observedAttributes() {
      return [
        'pull',
        'swirl',
        'friction',
        'breath',
        'particle-count',
        'interactive',
        'field-visible',
        'center-x',
        'center-y',
        'colors',
        'background'
      ];
    }

    constructor() {
      super();
      this._engine = null;
      this._mount = document.createElement('div');
      this._mount.style.width = '100%';
      this._mount.style.height = '100%';
      this._mount.style.position = 'relative';
    }

    connectedCallback() {
      if (!this.style.display) this.style.display = 'block';
      if (!this.style.width) this.style.width = '100%';
      if (!this.style.height) this.style.height = '400px';
      if (!this.contains(this._mount)) {
        this.appendChild(this._mount);
      }
      this.mount();
    }

    disconnectedCallback() {
      if (this._engine) {
        this._engine.destroy();
        this._engine = null;
      }
    }

    attributeChangedCallback() {
      if (this._engine) {
        this._engine.update(this.readOptions());
      }
    }

    readBool(name, fallback) {
      const value = this.getAttribute(name);
      if (value === null) return fallback;
      return !(value === 'false' || value === '0' || value === 'no');
    }

    readNumber(name, fallback) {
      const value = this.getAttribute(name);
      if (value === null || value === '') return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    readOptions() {
      const colorsAttr = this.getAttribute('colors');
      return {
        pull: this.readNumber('pull', 1.15),
        swirl: this.readNumber('swirl', 0.42),
        friction: this.readNumber('friction', 0.979),
        breath: this.readNumber('breath', 0.55),
        particleCount: this.readNumber('particle-count', 90),
        interactive: this.readBool('interactive', true),
        fieldVisible: this.readBool('field-visible', true),
        centerX: this.readNumber('center-x', 0.5),
        centerY: this.readNumber('center-y', 0.5),
        background: this.getAttribute('background') || 'transparent',
        colors: colorsAttr
          ? colorsAttr.split(',').map(v => v.trim()).filter(Boolean)
          : ['#7dd3fc', '#a78bfa', '#f9a8d4', '#fcd34d', '#5eead4']
      };
    }

    mount() {
      if (this._engine) {
        this._engine.destroy();
      }
      this._engine = window.MargaParticles.mount(this._mount, this.readOptions());
    }
  }

  if (!customElements.get('marga-particles')) {
    customElements.define('marga-particles', MargaParticlesElement);
  }
})();
