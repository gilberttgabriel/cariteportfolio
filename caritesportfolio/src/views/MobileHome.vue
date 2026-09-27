<template>
  <main class="page mobile-home" :class="`phase-${phase}`">
    <!-- Feed vertical: las imágenes de las secciones, de distintos anchos y con su
         texto debajo. Se van agregando rondas al bajar, así no se acaba -->
    <div ref="feed" class="m-feed" @scroll.passive="onScroll">
      <!-- En la intro, este contenedor sale del cuadro negro del centro, se abre en
           vertical formando una columna con las 5 imágenes y desde ahí se expande
           hasta su tamaño real, en una sola animación -->
      <div ref="inner" class="m-feed-inner">
        <template v-for="round in rounds" :key="round">
          <component
            :is="item.to ? 'RouterLink' : 'div'"
            v-for="(item, i) in items"
            :key="`${round}-${item.name}`"
            :to="item.to"
            class="m-card"
            :class="[`m-card-${item.shape}`, { 'm-card-later': round > 1 }]"
            :style="cardStyle(round - 1, i)"
          >
            <img class="m-card-img" :src="item.img" :alt="item.name">
            <img class="m-card-label" :src="`/labels/${item.name}.png`" alt="">
          </component>
        </template>
      </div>
    </div>

    <!-- Intro: cuadro negro que sube hasta el centro; de él se abren las imágenes -->
    <div class="m-intro" aria-hidden="true">
      <span class="m-dot"></span>
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
const MAX_ROUNDS = 40
const DOT_SIZE = 14 // lado del cuadro negro, en px

const COLUMN_HEIGHT = 120 // alto de la columna de imágenes al abrirse, en px

// Intro: el cuadro sube (DOT) → se abre en una columna con las 5 imágenes y
// esa columna se expande hasta su lugar (FEED) → listo
const DOT_MS = 300 // espera tras el welcome antes de que suba el cuadro
const OPEN_MS = 1250 // el cuadro ya llegó al centro: empieza a abrirse
const COLUMN_MS = 700 // abrirse en vertical hasta formar la columna
const EXPAND_MS = 1600 // expandirse desde la columna hasta el tamaño real

export default {
  name: 'MobileHome',
  inject: { welcomeDone: { default: null } },
  data() {
    return {
      items: sections,
      rounds: 4,
      // 'idle' | 'dot' | 'feed' | 'done'
      phase: 'done'
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
    if (this.animation) this.animation.cancel()
  },
  methods: {
    runIntro() {
      this.timers = [
        setTimeout(() => { this.phase = 'dot' }, DOT_MS),
        setTimeout(() => this.grow(), OPEN_MS)
      ]
    },
    // Una sola animación sobre las 5 imágenes: salen del cuadro negro, se abren en
    // vertical hasta formar una columna y desde ahí se expanden a su tamaño real
    grow() {
      const inner = this.$refs.inner
      const cards = inner.children
      // Solo se anima el bloque de la primera ronda; las siguientes esperan ocultas
      const n = Math.min(this.items.length, cards.length)
      if (!n || !inner.animate) {
        this.phase = 'done'
        return
      }
      // Bloque de las 5 imágenes, medido sin transformar
      const top = cards[0].offsetTop - inner.offsetTop
      const last = cards[n - 1]
      const bottom = last.offsetTop - inner.offsetTop + last.offsetHeight
      const middle = (top + bottom) / 2
      const screenCenter = this.$refs.feed.clientHeight / 2

      // Transformación que deja el centro del bloque en el centro de la pantalla
      // con la escala dada (horizontal sx, vertical sy)
      const centered = (sx, sy) =>
        `translateY(${screenCenter - inner.offsetTop - sy * middle}px) scale(${sx}, ${sy})`
      const column = COLUMN_HEIGHT / (bottom - top)
      const dot = DOT_SIZE / (bottom - top)

      this.phase = 'feed'
      const total = COLUMN_MS + EXPAND_MS
      const animation = inner.animate(
        [
          // Del tamaño del cuadro negro...
          { transform: centered(column, dot), easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
          // ...se abre en vertical hasta formar la columna...
          {
            offset: COLUMN_MS / total,
            transform: centered(column, column),
            easing: 'cubic-bezier(0.65, 0, 0.35, 1)'
          },
          // ...y se expande hasta su lugar
          { transform: 'translateY(0px) scale(1, 1)' }
        ],
        { duration: total }
      )
      animation.onfinish = () => { this.phase = 'done' }
      this.animation = animation
    },
    cardStyle(round, i) {
      const n = round * this.items.length + i
      const widths = WIDTHS[this.items[i].shape] || WIDTHS.tall
      return { width: widths[n % widths.length] + '%' }
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

.m-feed-inner {
  transform-origin: 50% 0;
}

.phase-feed .m-feed-inner {
  will-change: transform, opacity;
}

.m-card {
  display: block;
  margin: 0 auto 36px;
}

/* En la intro solo se ven las 5 primeras; las rondas siguientes aparecen al
   terminar, cuando ya quedan fuera de la pantalla */
.m-card-later {
  transition: opacity 0.4s ease;
}

.phase-idle .m-card-later,
.phase-dot .m-card-later,
.phase-feed .m-card-later {
  opacity: 0;
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

/* Antes de abrirse, el feed espera invisible; la apertura la anima grow() */
.phase-idle .m-feed-inner,
.phase-dot .m-feed-inner {
  opacity: 0;
}

/* En cuanto aparecen las imágenes (fase feed) ya se puede hacer scroll y tocar */
.phase-idle .m-feed,
.phase-dot .m-feed {
  pointer-events: none;
}

/* --- Intro --- */
.m-intro {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}

.m-dot {
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

/* 2. Al abrirse las imágenes, el cuadro se funde con ellas */
.phase-dot .m-dot,
.phase-feed .m-dot {
  translate: -50% -50%;
}

@media (prefers-reduced-motion: reduce) {
  .m-dot,
  .m-card-later { transition: none; }
}
</style>
