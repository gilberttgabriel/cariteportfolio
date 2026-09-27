<template>
  <main class="page mobile-home" :class="`phase-${phase}`">
    <!-- Feed vertical: las imágenes de las secciones, de distintos anchos y con su
         texto debajo. Se van agregando rondas al bajar, así no se acaba -->
    <div ref="feed" class="m-feed" @scroll.passive="onScroll">
      <template v-for="round in rounds" :key="round">
        <component
          :is="item.to ? 'RouterLink' : 'div'"
          v-for="(item, i) in items"
          :key="`${round}-${item.name}`"
          :to="item.to"
          class="m-card"
          :class="`m-card-${item.shape}`"
          :style="cardStyle(round - 1, i)"
        >
          <img class="m-card-img" :src="item.img" :alt="item.name">
          <img class="m-card-label" :src="`/labels/${item.name}.png`" alt="">
        </component>
      </template>
    </div>

    <!-- Intro: un cuadrado negro en el centro que se abre en una fila de miniaturas -->
    <div class="m-intro" aria-hidden="true">
      <span class="m-dot"></span>
      <img
        v-for="(thumb, k) in thumbs"
        :key="k"
        class="m-thumb"
        :src="thumb"
        alt=""
        :style="{ '--tx': (k - (thumbs.length - 1) / 2) * THUMB_GAP + 'px' }"
      >
    </div>
  </main>
</template>

<script>
import sections from '../sections'

// Anchos de las imágenes del feed, en % de la pantalla, según su forma; se
// repiten en este orden. Ninguna llega a los bordes, y su alto se limita en CSS
const WIDTHS = {
  wide: [86, 80, 90],
  tall: [52, 44, 58, 48]
}
const THUMB_GAP = 26 // separación entre miniaturas de la fila, en px
const MAX_ROUNDS = 40

// Intro: cuadrado que sube (DOT) → fila de miniaturas (STRIP) → feed (FEED) → listo
const DOT_MS = 300 // espera tras el welcome antes de que suba el cuadrado
const STRIP_MS = 1300 // el cuadrado, ya en el centro, se abre en la fila
const FEED_MS = 2100 // la fila se va y aparecen las imágenes
const DONE_MS = 3500 // fin de la intro: se quitan sus clases

export default {
  name: 'MobileHome',
  inject: { welcomeDone: { default: null } },
  data() {
    return {
      items: sections,
      rounds: 4,
      // 'idle' | 'dot' | 'strip' | 'feed' | 'done'
      phase: 'done',
      THUMB_GAP
    }
  },
  computed: {
    // Una miniatura por sección para la fila de la intro
    thumbs() {
      return this.items.map((item) => item.img)
    }
  },
  mounted() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Igual que en escritorio: la intro solo corre en la primera carga
    if (this.welcomeDone === false && !reduceMotion) {
      this.phase = 'idle'
      const stop = this.$watch(() => this.welcomeDone, (done) => {
        if (!done) return
        stop()
        this.runIntro()
      })
    }
  },
  beforeUnmount() {
    (this.timers || []).forEach(clearTimeout)
  },
  methods: {
    runIntro() {
      const at = (ms, phase) => setTimeout(() => { this.phase = phase }, ms)
      this.timers = [
        at(DOT_MS, 'dot'),
        at(STRIP_MS, 'strip'),
        at(FEED_MS, 'feed'),
        at(DONE_MS, 'done')
      ]
    },
    cardStyle(round, i) {
      const n = round * this.items.length + i
      const widths = WIDTHS[this.items[i].shape] || WIDTHS.tall
      return {
        width: widths[n % widths.length] + '%',
        // Solo las primeras imágenes aparecen escalonadas en la intro
        '--k': n < 6 ? n : 0
      }
    },
    // Al acercarse al final, agrega otra ronda de imágenes
    onScroll() {
      const el = this.$refs.feed
      if (this.rounds < MAX_ROUNDS && el.scrollTop + el.clientHeight * 2.5 > el.scrollHeight) {
        this.rounds++
      }
    }
  }
}
</script>

<style>
.mobile-home {
  background: #f4f1ea;
}

/* --- Feed --- */
.m-feed {
  position: absolute;
  inset: 0;
  /* Arriba deja espacio para el ícono; abajo, para poder subir la última imagen */
  padding-block: 96px 40vh;
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.m-feed::-webkit-scrollbar {
  display: none;
}

.m-card {
  display: block;
  /* Además del % de ancho, ninguna imagen pasa del 58% del alto de la pantalla
     (las imágenes son verticales: alto ≈ 1.5 × ancho) */
  margin: 0 auto 36px;
  transform-origin: center;
  transition:
    opacity 0.7s ease calc(var(--k) * 90ms),
    transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) calc(var(--k) * 90ms);
}

.m-card-img {
  display: block;
  width: 100%;
  object-fit: cover;
}

/* Horizontales: más anchas, recortadas a 4:3 */
.m-card-wide {
  max-width: 70dvh;
}

.m-card-wide .m-card-img {
  aspect-ratio: 4 / 3;
}

/* Verticales: más altas, recortadas a 3:5, y nunca más del 58% del alto */
.m-card-tall {
  max-width: 35dvh;
}

.m-card-tall .m-card-img {
  aspect-ratio: 3 / 5;
}

/* Texto escrito a mano debajo de cada imagen */
.m-card-label {
  display: block;
  width: clamp(72px, 26vw, 110px);
  height: auto;
  margin: 8px auto 0;
}

/* Antes de la fase feed, las imágenes esperan pequeñas e invisibles */
.phase-idle .m-card,
.phase-dot .m-card,
.phase-strip .m-card {
  opacity: 0;
  transform: scale(0.08);
}

/* En cuanto aparecen las imágenes (fase feed) ya se puede hacer scroll y tocar */
.phase-idle .m-feed,
.phase-dot .m-feed,
.phase-strip .m-feed {
  pointer-events: none;
}

/* --- Intro --- */
.m-intro {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}

.m-dot,
.m-thumb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
}

/* 1. Cuadrado negro: espera debajo de la pantalla y sube hasta el centro */
.m-dot {
  translate: -50% calc(50dvh + 20px);
  background: #111111;
  opacity: 0;
  transition:
    translate 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease;
}

.phase-idle .m-dot,
.phase-dot .m-dot {
  opacity: 1;
}

.phase-dot .m-dot,
.phase-strip .m-dot,
.phase-feed .m-dot {
  translate: -50% -50%;
}

/* 2. Se abre en una fila de miniaturas que salen del centro */
.m-thumb {
  object-fit: cover;
  translate: -50% -50%;
  opacity: 0;
  transition:
    translate 0.7s cubic-bezier(0.65, 0, 0.35, 1),
    opacity 0.35s ease;
}

.phase-strip .m-thumb {
  opacity: 1;
  translate: calc(-50% + var(--tx)) -50%;
}

/* 3. La fila se desvanece mientras aparecen las imágenes del feed */
.phase-feed .m-thumb {
  opacity: 0;
  translate: calc(-50% + var(--tx)) -50%;
}

@media (prefers-reduced-motion: reduce) {
  .m-card,
  .m-dot,
  .m-thumb { transition: none; }
}
</style>
