# MargaParticles v0.2

Motor embebible de partículas por atracción para invocarlo desde otras páginas.

## 1) Uso directo con JavaScript

```html
<script src="./marga-particles.js"></script>
<div id="field" style="width:100%;height:100vh;"></div>
<script>
  const field = MargaParticles.mount('#field', {
    particleCount: 120,
    pull: 1.18,
    swirl: 0.48,
    friction: 0.978,
    breath: 0.65,
    colors: ['#7dd3fc', '#a78bfa', '#f9a8d4', '#fcd34d', '#5eead4']
  });

  // Ciclo de vida
  field.pause();
  field.resume();
  field.update({ particleCount: 160 });
  field.destroy();
</script>
```

## 2) Uso como etiqueta viva

```html
<script src="./marga-particles.js"></script>
<script src="./marga-particles-element.js"></script>

<marga-particles
  pull="1.22"
  swirl="0.50"
  friction="0.978"
  breath="0.68"
  particle-count="130"
  colors="#7dd3fc,#a78bfa,#f9a8d4,#fcd34d,#5eead4">
</marga-particles>
```

## Configuración disponible

| JavaScript | Atributo HTML | Valor inicial | Límites / propósito |
| --- | --- | --- | --- |
| `particleCount` | `particle-count` | `90` | Entre 1 y 500 |
| `pull` | `pull` | `1.15` | Atracción, entre 0 y 5 |
| `swirl` | `swirl` | `0.42` | Giro, entre -3 y 3 |
| `friction` | `friction` | `0.979` | Entre 0.8 y 1 |
| `breath` | `breath` | `0.55` | Pulsación, entre 0 y 2 |
| `interactive` | `interactive` | `true` | Sigue mouse, lápiz o tacto |
| `fieldVisible` | `field-visible` | `true` | Muestra el campo central |
| `centerX` | `center-x` | `0.5` | Posición horizontal entre 0 y 1 |
| `centerY` | `center-y` | `0.5` | Posición vertical entre 0 y 1 |
| `colors` | `colors` | paleta Marga | Colores hexadecimales |
| `background` | `background` | `transparent` | Fondo del contenedor |
| `respectReducedMotion` | `respect-reduced-motion` | `true` | Detiene la animación si el sistema solicita menos movimiento |

El motor limita automáticamente valores extremos y descarta colores que no sean hexadecimales válidos.

## API del motor

- `pause()` detiene `requestAnimationFrame`.
- `resume()` reanuda el movimiento.
- `update(options)` cambia opciones sin reemplazar el Canvas.
- `destroy()` elimina Canvas, eventos y observadores.

## API del Web Component

La etiqueta `<marga-particles>` expone `pause()`, `resume()`, `update(options)` y la propiedad `engine`. Al terminar de montarse emite el evento `margaparticles-ready`.

```js
const element = document.querySelector('marga-particles');
element.addEventListener('margaparticles-ready', event => {
  console.log(event.detail.version);
});
element.update({ swirl: 0.8 });
```

## Rendimiento y accesibilidad

- El Canvas es decorativo y se marca con `aria-hidden="true"`.
- La densidad de píxeles se limita para evitar consumo excesivo en pantallas de alta resolución.
- La animación se pausa cuando la pestaña queda oculta.
- `ResizeObserver` mantiene el Canvas sincronizado con su contenedor.

## Idea

El mismo motor puede vivir en muchas páginas, pero cada página define su propio campo.
No empuja: llama.
