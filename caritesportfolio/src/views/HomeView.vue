<template>
  <main class="page home" :class="{ 'texts-in': textsIn }">
    <!-- Franja superior: el video de fondo -->
    <div class="home-hero">
      <video
        class="home-video"
        :src="video"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        aria-hidden="true"
      ></video>
    </div>

    <!-- Puntos rojos -->
    <span class="home-dot" style="left: 3.6%; top: 59%"></span>
    <span class="home-dot" style="left: 96.4%; top: 94%"></span>

    <!-- Textos. x: borde izquierdo (o centro si center), y: centro; en % de la
         pantalla. mx: x en celular, para que no se salgan por la derecha.
         kind: phrase (sobre el video), credit, link o small -->
    <template v-for="text in texts" :key="text.label">
      <RouterLink
        v-if="text.to"
        :to="text.to"
        class="home-text home-link"
        :class="textClass(text)"
        :style="textStyle(text)"
      ><span class="home-pop">{{ text.label }}</span></RouterLink>
      <span
        v-else
        class="home-text"
        :class="textClass(text)"
        :style="textStyle(text)"
      ><span class="home-pop">{{ text.label }}</span></span>
    </template>
  </main>
</template>

<script>
import video from '../assets/fondohome.mp4'

// Los textos aparecen de golpe, de izquierda a derecha, uno cada POP_STAGGER_MS.
// Empiezan cuando termina el zoom de entrada: durante el zoom el navegador
// dibuja la página como imagen escalada y las letras se verían borrosas
const POP_STAGGER_MS = 80
const POP_DELAY_MS = 0 // espera extra tras terminar el zoom

export default {
  name: 'HomeView',
  inject: { homeReady: { default: null } },
  data() {
    return {
      video,
      textsIn: false,
      // Distribución tomada de la imagen de referencia
      texts: [
        // Frase sobre el video
        { label: 'un', kind: 'phrase', x: 7.8, y: 9 },
        { label: 'pedazo', kind: 'phrase', x: 15.8, y: 8.2 },
        { label: 'digital', kind: 'phrase', x: 25.9, y: 15.3 },
        { label: 'de', kind: 'phrase', x: 42, y: 14 },
        { label: 'mi mente', kind: 'phrase', x: 45.2, y: 21.6 },
        // Crédito, centrado bajo el video
        { label: '©SN 2026', kind: 'credit', x: 50, y: 58, center: true },
        // Secciones
        { label: 'Manifiesto', kind: 'link', to: '/bio', x: 6.9, y: 62.2 },
        { label: 'Cinematography / DoP', kind: 'link', to: '/direct', x: 26.3, y: 71.1, mx: 18 },
        { label: 'Stills', kind: 'link', to: '/fotos', x: 66, y: 77, mx: 58 },
        { label: 'Content', kind: 'link', to: '/redes', x: 82.9, y: 86.4, mx: 64 },
        // Poema chico, abajo a la izquierda
        { label: 'revisitando', kind: 'small', x: 2.8, y: 90.5 },
        { label: 'mis memorias', kind: 'small', x: 11.3, y: 92.4 },
        { label: 'constantemente', kind: 'small', x: 20.4, y: 90.5 },
        { label: 'descalzo', kind: 'small', x: 2.8, y: 94.4 },
        { label: 'por  el eterno caribe.', kind: 'small', x: 18.4, y: 94.4 }
      ]
    }
  },
  computed: {
    // Orden de aparición de cada texto según su posición horizontal
    popOrder() {
      const sorted = [...this.texts].sort((a, b) => a.x - b.x)
      return Object.fromEntries(sorted.map((text, i) => [text.label, i]))
    }
  },
  mounted() {
    // Ejecuta fn cuando la señal inyectada (key) sea true; si ya lo es (p. ej. al
    // volver al inicio desde otra página), enseguida
    const when = (key, fn) => {
      if (this[key] !== false) return fn()
      const stop = this.$watch(() => this[key], (done) => {
        if (!done) return
        stop()
        fn()
      })
    }
    // Textos: cuando termina el zoom de entrada
    when('homeReady', () => {
      this.timer = setTimeout(() => {
        this.textsIn = true
      }, POP_DELAY_MS)
    })
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  },
  methods: {
    textClass(text) {
      return ['home-' + text.kind, { 'home-center': text.center }]
    },
    textStyle(text) {
      return {
        '--x': text.x + '%',
        '--mx': (text.mx ?? text.x) + '%',
        top: text.y + '%',
        '--pop-delay': this.popOrder[text.label] * POP_STAGGER_MS + 'ms'
      }
    }
  }
}
</script>

<style>
.home {
  background-color: #ffffff;
}

/* Video arriba, ocupando el 55% de la pantalla */
.home-hero {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 55%;
  overflow: hidden;
  background: #1a1a1a;
}

.home-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.home-dot {
  position: absolute;
  width: clamp(8px, 1.2vw, 14px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: #e8251b;
  translate: -50% -50%;
}

.home-text {
  position: absolute;
  left: var(--x);
  translate: 0 -50%;
  z-index: 1;
  white-space: pre;
  text-decoration: none;
  line-height: 1;
}

.home-center {
  translate: -50% -50%;
}

/* Frase, crédito y poema: serif */
.home-phrase,
.home-credit,
.home-small {
  font-family: 'Spectral', Georgia, 'Times New Roman', serif;
  font-weight: 400;
}

.home-phrase {
  font-size: clamp(13px, 2vw, 30px);
  color: #ffffff;
}

.home-credit {
  font-size: clamp(12px, 1.7vw, 24px);
  color: #1a1a1a;
}

/* Secciones: letra condensada y gruesa, negra */
.home-link {
  font-family: 'Anton', 'Impact', 'Arial Narrow', sans-serif;
  font-size: clamp(22px, 3.9vw, 64px);
  letter-spacing: -0.03em;
  color: #111111;
  transition: opacity 0.25s ease;
}

.home-link:hover,
.home-link:focus-visible {
  opacity: 0.6;
}

.home-small {
  font-size: clamp(8px, 0.95vw, 14px);
  color: #1a1a1a;
}

/* Aparición cruda: cada texto está oculto y aparece de golpe, sin fundido,
   cuando le toca (--pop-delay). Va en un span interior para no chocar con el
   hover del enlace */
.home-pop {
  display: inline-block;
  visibility: hidden;
}

.texts-in .home-pop {
  animation: home-pop 0s var(--pop-delay) both;
}

@keyframes home-pop {
  from {
    visibility: hidden;
  }

  to {
    visibility: visible;
  }
}

/* Celular */
@media (max-width: 700px) {
  .home-text {
    left: var(--mx);
  }
}
</style>
