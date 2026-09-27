<template>
  <main class="page home">
    <!-- Capa negro plomo que cubre la pantalla al pasar el cursor por una sección -->
    <div class="preview" :class="{ 'is-active': active }"></div>

    <div class="scatter" :class="intro && `intro-${intro}`">
      <component
        :is="item.to ? 'RouterLink' : 'div'"
        v-for="(item, index) in items"
        :key="item.name"
        :to="item.to"
        class="item"
        :class="{ 'is-hidden': active && active !== item.name }"
        :style="itemStyle(item, index)"
        @mouseenter="active = item.name"
        @mouseleave="active = null"
      >
        <span :ref="(el) => (frames[item.name] = el)" class="item-frame">
          <img class="item-img" :src="item.img" :alt="item.name">
        </span>
        <img class="item-label" :src="`/labels/${item.name}.png`" :alt="item.name">
      </component>
    </div>
  </main>
</template>

<script>
import sections from '../sections'

// Intro al entrar: cada imagen, pequeña, sube desde abajo de la pantalla
// hasta su lugar (una tras otra, STAGGER_MS de diferencia) y ahí se expande.
const START_DELAY_MS = 400 // espera tras terminar el welcome
const STAGGER_MS = 120
const INTRO_TOTAL_MS = 3200 // cuando termina todo, se quitan las clases de la intro

export default {
  name: 'HomeView',
  inject: { welcomeDone: { default: null } },
  data() {
    return {
      items: sections,
      // Sección que tiene el cursor encima
      active: null,
      // Intro: null (sin intro), 'pending' (cuadrados en el centro) o 'run'
      intro: null,
      // Distancia desde la posición de cada imagen hasta abajo de la pantalla, en px
      offsets: {}
    }
  },
  created() {
    this.frames = {}
  },
  mounted() {
    // La intro solo corre en la primera carga, mientras el welcome sigue visible
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // (welcomeDone llega ya desenvuelto: true/false, o null si no hay welcome)
    if (this.welcomeDone === false && !reduceMotion) {
      this.measureOffsets()
      this.intro = 'pending'
      const stop = this.$watch(() => this.welcomeDone, (done) => {
        if (!done) return
        stop()
        this.runIntro()
      })
    }
  },
  methods: {
    itemStyle(item, index) {
      const offset = this.offsets[item.name] || { dy: 0 }
      return {
        '--x': item.x + 'vw',
        '--y': item.y + 'vh',
        // Orden de salida: de izquierda a derecha según la lista
        '--i': index,
        '--dy': offset.dy + 'px'
      }
    },
    // Cuánto hay que bajar cada imagen para que arranque debajo de la pantalla.
    // El inicio arranca acercado (zoom out del welcome), así que se descuenta la escala.
    measureOffsets() {
      const page = this.$el
      const pageRect = page.getBoundingClientRect()
      const scale = pageRect.width / page.offsetWidth
      const offsets = {}
      this.items.forEach((item) => {
        const rect = this.frames[item.name].getBoundingClientRect()
        const top = (rect.top - pageRect.top) / scale
        offsets[item.name] = { dy: page.offsetHeight - top + 40 }
      })
      this.offsets = offsets
    },
    runIntro() {
      setTimeout(() => {
        this.intro = 'run'
        setTimeout(() => {
          this.intro = null
        }, INTRO_TOTAL_MS + STAGGER_MS * this.items.length)
      }, START_DELAY_MS)
    }
  }
}
</script>

<style>
/* Inicio: blanco hueso liso */
.home {
  background-color: #f4f1ea;
}

/* En hover la pantalla se funde a negro plomo */
.preview {
  position: absolute;
  inset: 0;
  background: #2b2d2f;
  opacity: 0;
  will-change: opacity;
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.preview.is-active {
  opacity: 1;
}

/* Secciones repartidas de forma irregular por la pantalla.
   --item-w: ancho de cada sección. --hover-scale: cuánto crece la imagen.
   --margin: espacio mínimo entre la imagen agrandada y el borde. */
.scatter {
  --item-w: min(12vw, 22vh);
  --hover-scale: 2.1;
  --margin: 16px;
  /* Lo que la imagen agrandada sobresale desde su centro */
  --half-big: calc(var(--item-w) * var(--hover-scale) / 2);
  /* Lo que ocupa hacia abajo desde el centro de la imagen en hover:
     media imagen agrandada + 10px + el texto (a lo sumo 0.75 × ancho) */
  --below: calc(var(--half-big) + 10px + var(--item-w) * 0.75);
  /* Límites para el centro de cada imagen */
  --min-x: calc(var(--half-big) + var(--margin));
  --max-x: calc(100vw - var(--half-big) - var(--margin));
  --min-y: calc(var(--half-big) + var(--margin));
  --max-y: calc(100vh - var(--below) - var(--margin));
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* --x, --y (de sections.js) ubican el centro de la imagen; clamp los
   limita para que la imagen agrandada y su texto no salgan de la pantalla */
.item {
  position: absolute;
  left: clamp(var(--min-x), var(--x), var(--max-x));
  top: clamp(var(--min-y), var(--y), var(--max-y));
  /* left/top apuntan al centro de la imagen; esto lleva la esquina ahí */
  margin-top: calc(var(--item-w) / -2);
  transform: translateX(-50%);
  width: var(--item-w);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Las demás secciones se desvanecen mientras una está en hover */
.item.is-hidden {
  opacity: 0;
}

.item-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
  transform-origin: center;
  /* translateZ(0) deja cada imagen siempre en su propia capa, así el hover
     no crea ni destruye capas y las demás imágenes no se redibujan */
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  transition: transform 0.25s ease-out;
}

.item-label {
  width: 100%;
  display: block;
  transform: translateZ(0);
  transition: transform 0.25s ease-out, filter 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Sobre el negro plomo, el texto negro pasa a blanco para que se lea */
.item:hover .item-label {
  filter: invert(1);
}

/* Marco de la imagen: es lo que se mueve y se expande en la intro,
   así no interfiere con el zoom del hover (que va en la imagen) */
.item-frame {
  display: block;
  width: 100%;
}

/* --- Intro --- */
.intro-pending,
.intro-run {
  pointer-events: none;
}

.intro-pending .item-frame,
.intro-run .item-frame {
  will-change: translate, scale;
}

/* Antes de empezar: cada imagen, pequeña, debajo de la pantalla y sin texto */
.intro-pending .item-frame {
  translate: 0 var(--dy);
  scale: 0.35;
}

.intro-pending .item-label {
  opacity: 0;
}

/* 1. Sube hasta su lugar, una tras otra.  2. Al llegar, se expande */
.intro-run .item-frame {
  transition:
    translate 1s cubic-bezier(0.22, 1, 0.36, 1) calc(var(--i) * 120ms),
    scale 0.8s cubic-bezier(0.65, 0, 0.35, 1) calc(var(--i) * 120ms + 900ms);
}

/* 3. Aparece el texto */
.intro-run .item-label {
  transition:
    transform 0.25s ease-out,
    opacity 0.6s ease calc(var(--i) * 120ms + 1400ms);
}

/* Hover: solo la imagen se expande, parejo desde su centro */
.item:hover {
  z-index: 2;
}

.item:hover .item-img {
  transform: translateZ(0) scale(var(--hover-scale));
}

/* El texto baja justo lo que crece la imagen hacia abajo, para no quedar tapado */
.item:hover .item-label {
  transform: translateZ(0) translateY(calc(var(--item-w) * (var(--hover-scale) - 1) / 2 + 10px));
}

@media (prefers-reduced-motion: reduce) {
  .item,
  .item-img,
  .item-label,
  .preview { transition: none; }
}
</style>
