# MargaLiquid Framework

Runtime visual experimental para crear campos de partículas interactivos en Canvas y reutilizarlos como JavaScript directo o como Web Component.

La parte estable y reutilizable del proyecto es **MargaParticles v0.2**. Los archivos ceremoniales originales se conservan como antecedentes creativos del concepto, pero no forman parte de la API ejecutable.

## Inicio rápido

No requiere dependencias ni proceso de compilación:

```html
<div id="campo" style="height: 420px"></div>
<script src="./marga-particles.js"></script>
<script>
  const campo = MargaParticles.mount('#campo', {
    particleCount: 120,
    pull: 1.18,
    swirl: 0.48,
    breath: 0.65
  });

  campo.pause();
  campo.resume();
  campo.update({ swirl: 0.7 });
</script>
```

También puede invocarse como una etiqueta HTML:

```html
<script src="./marga-particles.js"></script>
<script src="./marga-particles-element.js"></script>

<marga-particles
  particle-count="130"
  pull="1.22"
  swirl="0.50"
  colors="#7dd3fc,#a78bfa,#f9a8d4">
</marga-particles>
```

## Capacidades de v0.2

- Canvas adaptable a la resolución y al tamaño del contenedor.
- Interacción mediante Pointer Events para mouse, lápiz y tacto.
- Observación de cambios de tamaño con `ResizeObserver`.
- Pausa automática cuando la página deja de estar visible.
- Respeto por `prefers-reduced-motion`.
- Actualización en vivo de paleta, partículas, interacción y fondo.
- Límites de configuración para evitar cargas accidentales excesivas.
- Ciclo de vida explícito: `pause()`, `resume()`, `update()` y `destroy()`.
- Web Component `<marga-particles>` con la misma API.

## API

### `MargaParticles.mount(target, options)`

Monta el motor y devuelve una instancia controlable.

### `engine.update(options)`

Actualiza la configuración sin crear otro Canvas.

### `engine.pause()` / `engine.resume()`

Detiene o reanuda el ciclo de animación.

### `engine.destroy()`

Elimina Canvas, observadores y eventos, y restaura los estilos originales del contenedor.

### `MargaParticles.normalizeOptions(options)`

Normaliza límites numéricos, booleanos y colores antes de crear el motor.

La referencia completa está en [MARGA_PARTICLES.md](./MARGA_PARTICLES.md).

## Ejecutar las demostraciones

```bash
git clone https://github.com/Vonximit/margaliquid-framework.git
cd margaliquid-framework
python3 -m http.server 8080
```

Después abre:

- `http://localhost:8080/examples/marga-particles-demo.html`
- `http://localhost:8080/examples/marga-particles-element-demo.html`

## Desarrollo

```bash
npm test
npm run check
```

## Mapa del repositorio

| Ruta | Estado | Propósito |
| --- | --- | --- |
| `marga-particles.js` | Activo | Motor Canvas embebible |
| `marga-particles-element.js` | Activo | Web Component |
| `examples/` | Activo | Demostraciones ejecutables |
| `index.html` | Legado visual | Experimento original |
| Archivos ceremoniales | Legado conceptual | Historia creativa del proyecto |

## Alcance

MargaLiquid es un runtime visual experimental, no un framework general de aplicaciones. No afirma medir emociones, consciencia ni fenómenos físicos: sus conceptos de “atracción”, “respiración” y “campo” describen parámetros gráficos del sistema de partículas.

## Licencia

El repositorio todavía no define una licencia de reutilización. Hasta que la autora elija una, el código permanece con todos los derechos reservados.
