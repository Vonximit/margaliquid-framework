# MargaParticles

Motor embebible de partículas por atracción para invocarlo desde otras páginas.

## 1) Uso directo con JavaScript

```html
<script src="./marga-particles.js"></script>
<div id="field" style="width:100%;height:100vh;"></div>
<script>
  MargaParticles.mount('#field', {
    particleCount: 120,
    pull: 1.18,
    swirl: 0.48,
    friction: 0.978,
    breath: 0.65,
    colors: ['#7dd3fc', '#a78bfa', '#f9a8d4', '#fcd34d', '#5eead4']
  });
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

- `particleCount` / `particle-count`
- `pull`
- `swirl`
- `friction`
- `breath`
- `interactive`
- `fieldVisible` / `field-visible`
- `centerX` / `center-x`
- `centerY` / `center-y`
- `colors`
- `background`

## Idea

El mismo motor puede vivir en muchas páginas, pero cada página define su propio campo.
No empuja: llama.
