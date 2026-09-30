<template>
  <main class="page home" :class="{ 'texts-in': textsIn }">
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

    <!-- Video emergente: aparece de a uno, en un lugar y momento al azar.
         Va debajo de los textos y no recibe clics -->
    <video
      v-if="popup"
      :key="popup.id"
      ref="popup"
      class="home-popup"
      :src="popup.src"
      :style="{ left: popup.x + 'px', top: popup.y + 'px', width: popup.w + 'px' }"
      autoplay
      muted
      playsinline
      aria-hidden="true"
      @ended="hidePopup"
      @error="hidePopup"
    ></video>

    <!-- Textos sobre el video. x, y: centro de cada texto, en % de la pantalla -->
    <template v-for="text in texts" :key="text.label">
      <RouterLink
        v-if="text.to"
        :to="text.to"
        class="home-text home-link"
        :style="textStyle(text)"
      ><span class="home-pop">{{ text.label }}</span></RouterLink>
      <span
        v-else
        class="home-text"
        :style="textStyle(text)"
      ><span class="home-pop">{{ text.label }}</span></span>
    </template>
  </main>
</template>

<script>
import video from '../assets/fondohome.mp4'
import popup1 from '../assets/popup1.mp4'
import popup2 from '../assets/popup2.mp4'

// Los textos aparecen de golpe, de izquierda a derecha, uno cada POP_STAGGER_MS
const POP_STAGGER_MS = 120
const POP_DELAY_MS = 300 // espera tras terminar el welcome

// Videos emergentes: uno a la vez, cada POPUP_MIN_MS–POPUP_MAX_MS al azar
const POPUPS = [popup1, popup2]
const POPUP_RATIO = 470 / 640 // alto / ancho de los videos
const POPUP_FIRST_MS = 1200 // espera tras aparecer los textos
const POPUP_MIN_MS = 1500
const POPUP_MAX_MS = 4500
const POPUP_MARGIN = 16 // distancia mínima a los bordes y a los textos, en px

const random = (min, max) => min + Math.random() * (max - min)

export default {
  name: 'HomeView',
  inject: { welcomeDone: { default: null } },
  data() {
    return {
      video,
      textsIn: false,
      // Video emergente visible: { id, src, x, y, w } o null
      popup: null,
      // Distribución tomada de la imagen de referencia
      texts: [
        { label: 'Santiago Núñez', x: 21.3, y: 33.4 },
        { label: '(direct)', to: '/direct', x: 52.7, y: 19.8 },
        { label: '(redes)', to: '/redes', x: 73.7, y: 40.3 },
        { label: '(fotos)', to: '/fotos', x: 12.5, y: 49.5 },
        { label: '(bio)', to: '/bio', x: 50, y: 49.8 },
        { label: '(contacto)', to: '/contacto', x: 42, y: 68.1 },
        { label: 'espacio digital', x: 74, y: 66 }
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
    const show = () => {
      this.timer = setTimeout(() => {
        this.textsIn = true
        this.startPopups()
      }, POP_DELAY_MS)
    }
    // En la primera carga espera a que termine el welcome; al volver al inicio, aparecen enseguida
    if (this.welcomeDone === false) {
      const stop = this.$watch(() => this.welcomeDone, (done) => {
        if (!done) return
        stop()
        show()
      })
    } else {
      show()
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    clearTimeout(this.popupTimer)
    document.removeEventListener('visibilitychange', this.onVisibility)
  },
  methods: {
    // Arranca el ciclo de videos emergentes (salvo con "reducir movimiento")
    startPopups() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      this.popupCount = 0
      this.onVisibility = () => {
        // Con la pestaña oculta se detiene el ciclo, para no gastar batería
        if (document.hidden) {
          clearTimeout(this.popupTimer)
          this.popup = null
        } else {
          this.schedulePopup(random(POPUP_MIN_MS, POPUP_MAX_MS))
        }
      }
      document.addEventListener('visibilitychange', this.onVisibility)
      this.schedulePopup(POPUP_FIRST_MS)
    },
    schedulePopup(ms) {
      clearTimeout(this.popupTimer)
      this.popupTimer = setTimeout(() => this.showPopup(), ms)
    },
    showPopup() {
      if (document.hidden) return
      const spot = this.findSpot()
      if (!spot) {
        // No hay lugar libre en esta pantalla: se intenta más tarde
        this.schedulePopup(random(POPUP_MIN_MS, POPUP_MAX_MS))
        return
      }
      // Alterna al azar, sin repetir el mismo video dos veces seguidas
      const choices = POPUPS.filter((src) => src !== this.lastPopup)
      const src = choices[Math.floor(Math.random() * choices.length)]
      this.lastPopup = src
      this.popup = { id: ++this.popupCount, src, ...spot }
      this.$nextTick(() => {
        const el = this.$refs.popup
        // Si el navegador bloquea la reproducción (p. ej. iPhone en ahorro de
        // batería), no se muestra y se detiene el ciclo
        if (el && el.play) {
          el.play().catch(() => {
            this.popup = null
            clearTimeout(this.popupTimer)
          })
        }
      })
    },
    hidePopup() {
      this.popup = null
      this.schedulePopup(random(POPUP_MIN_MS, POPUP_MAX_MS))
    },
    // Busca un lugar al azar donde el video no tape los textos ni el ícono
    findSpot() {
      // Medidas en px de la página sin transformar: si el zoom de entrada del
      // inicio sigue activo, getBoundingClientRect viene escalado y se corrige
      const rect = this.$el.getBoundingClientRect()
      const scale = rect.width / this.$el.offsetWidth || 1
      const page = { width: this.$el.offsetWidth, height: this.$el.offsetHeight }
      const mobile = page.width <= 700
      const w = page.width * (mobile ? random(0.45, 0.55) : random(0.25, 0.3))
      const h = w * POPUP_RATIO
      const m = POPUP_MARGIN
      // Zonas ocupadas, relativas a la página
      const blocked = [...this.$el.querySelectorAll('.home-text'), document.querySelector('.site-icon')]
        .filter(Boolean)
        .map((el) => {
          const r = el.getBoundingClientRect()
          return {
            left: (r.left - rect.left) / scale,
            top: (r.top - rect.top) / scale,
            right: (r.right - rect.left) / scale,
            bottom: (r.bottom - rect.top) / scale
          }
        })
      for (let attempt = 0; attempt < 40; attempt++) {
        const x = random(m, page.width - w - m)
        const y = random(m, page.height - h - m)
        const free = blocked.every((b) =>
          x + w + m <= b.left || x - m >= b.right || y + h + m <= b.top || y - m >= b.bottom)
        if (free) return { x, y, w }
      }
      return null
    },
    textStyle(text) {
      return {
        left: text.x + '%',
        top: text.y + '%',
        '--pop-delay': this.popOrder[text.label] * POP_STAGGER_MS + 'ms'
      }
    }
  }
}
</script>

<style>
.home {
  background-color: #1a1a1a;
}

/* Video de fondo: cubre toda la pantalla sin deformarse */
.home-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

/* Video emergente: aparece y desaparece de golpe, como los textos */
.home-popup {
  position: absolute;
  display: block;
  height: auto;
  pointer-events: none;
}

.home-text {
  position: absolute;
  translate: -50% -50%;
  z-index: 1;
  white-space: nowrap;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: clamp(13px, 1.6vw, 24px);
  font-weight: 500;
  /* Blanco perla */
  color: #f0ece2;
  text-decoration: none;
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

.home-link {
  transition: opacity 0.25s ease;
}

.home-link:hover,
.home-link:focus-visible {
  opacity: 0.6;
}
</style>
