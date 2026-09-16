const test = require('node:test');
const assert = require('node:assert/strict');
const MargaParticles = require('../marga-particles.js');

test('expone una API versionada', () => {
  assert.equal(MargaParticles.version, '0.2.0');
  assert.equal(typeof MargaParticles.mount, 'function');
  assert.equal(typeof MargaParticles.normalizeOptions, 'function');
});

test('normaliza límites y descarta colores inválidos', () => {
  const options = MargaParticles.normalizeOptions({
    particleCount: 9999,
    pull: -4,
    swirl: 99,
    friction: 'no-numérico',
    colors: ['rojo', '#abc', '#123456']
  });

  assert.equal(options.particleCount, 500);
  assert.equal(options.pull, 0);
  assert.equal(options.swirl, 3);
  assert.equal(options.friction, MargaParticles.defaults.friction);
  assert.deepEqual(options.colors, ['#abc', '#123456']);
});

test('usa una paleta segura cuando no recibe colores válidos', () => {
  const options = MargaParticles.normalizeOptions({ colors: ['red', 'rgb(0,0,0)'] });
  assert.deepEqual(options.colors, MargaParticles.defaults.colors);
  assert.notEqual(options.colors, MargaParticles.defaults.colors);
});

test('monta, actualiza, pausa y destruye el motor', () => {
  const original = new Map();
  const keys = [
    'document', 'devicePixelRatio', 'requestAnimationFrame', 'cancelAnimationFrame',
    'addEventListener', 'removeEventListener', 'ResizeObserver', 'matchMedia'
  ];
  for (const key of keys) original.set(key, global[key]);

  let frameId = 0;
  const frames = new Map();
  const windowListeners = new Map();
  const documentListeners = new Map();

  function addListener(store, type, handler) {
    if (!store.has(type)) store.set(type, new Set());
    store.get(type).add(handler);
  }

  function removeListener(store, type, handler) {
    if (store.has(type)) store.get(type).delete(handler);
  }

  const gradient = { addColorStop() {} };
  const context = {
    setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
    stroke() {}, arc() {}, fill() {}, fillRect() {},
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient
  };
  const canvasListeners = new Map();
  const canvas = {
    style: {},
    parentNode: null,
    setAttribute(name, value) { this[name] = value; },
    getContext: () => context,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 360 }),
    addEventListener: (type, handler) => addListener(canvasListeners, type, handler),
    removeEventListener: (type, handler) => removeListener(canvasListeners, type, handler)
  };
  const fakeDocument = {
    hidden: false,
    createElement: type => {
      assert.equal(type, 'canvas');
      return canvas;
    },
    querySelector: () => null,
    addEventListener: (type, handler) => addListener(documentListeners, type, handler),
    removeEventListener: (type, handler) => removeListener(documentListeners, type, handler)
  };
  const children = [];
  const container = {
    style: { position: '', overflow: '', background: '' },
    clientWidth: 640,
    clientHeight: 360,
    getBoundingClientRect: () => ({ width: 640, height: 360 }),
    appendChild(node) { node.parentNode = this; children.push(node); },
    removeChild(node) {
      const index = children.indexOf(node);
      if (index >= 0) children.splice(index, 1);
      node.parentNode = null;
    }
  };

  global.document = fakeDocument;
  global.devicePixelRatio = 3;
  global.requestAnimationFrame = callback => {
    frameId += 1;
    frames.set(frameId, callback);
    return frameId;
  };
  global.cancelAnimationFrame = id => frames.delete(id);
  global.addEventListener = (type, handler) => addListener(windowListeners, type, handler);
  global.removeEventListener = (type, handler) => removeListener(windowListeners, type, handler);
  global.ResizeObserver = class {
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  global.matchMedia = () => ({ matches: false });

  try {
    assert.throws(() => MargaParticles.mount('#missing'), /container not found/);
    const engine = MargaParticles.mount(container, {
      particleCount: 12,
      interactive: true,
      background: '#050510',
      maxDpr: 1
    });

    assert.equal(children.length, 1);
    assert.equal(engine.particles.length, 12);
    assert.equal(canvas.width, 640);
    assert.equal(canvas['aria-hidden'], 'true');
    assert.equal(canvasListeners.get('pointermove').size, 1);

    engine.update({ particleCount: 20, interactive: false, background: '#111122' });
    assert.equal(engine.particles.length, 20);
    assert.equal(canvasListeners.get('pointermove').size, 0);
    assert.equal(container.style.background, '#111122');

    engine.pause();
    assert.equal(engine.paused, true);
    engine.resume();
    assert.equal(engine.paused, false);

    engine.destroy();
    assert.equal(children.length, 0);
    assert.equal(engine.destroyed, true);
    assert.deepEqual(container.style, { position: '', overflow: '', background: '' });
  } finally {
    for (const [key, value] of original) {
      if (value === undefined) delete global[key];
      else global[key] = value;
    }
  }
});
