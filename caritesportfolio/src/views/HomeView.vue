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

    <!-- Video emergente: aparece de a uno, en cualquier lugar y momento al azar.
         Va debajo de los textos (z-index) y no recibe clics, así los enlaces
         siguen funcionando aunque pase por detrás -->
    <video
      v-if="popup"
      :key="popup.id"
      ref="popup"
      class="home-popup"
      :src="popup.src"
      :style="{ left: popup.x + 'px', top: popup.y + 'px', width: popup.w + 'px' }"
      muted
      playsinline
      aria-hidden="true"
      @ended="hidePopup(popup.id)"
      @error="hidePopup(popup.id)"
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

// Los textos aparecen de golpe, de izquierda a derecha, uno cada POP_STAGGER_MS.
// Empiezan cuando termina el zoom de entrada: durante el zoom el navegador
// dibuja la página como imagen escalada y las letras se verían borrosas
const POP_STAGGER_MS = 250
const POP_DELAY_MS = 0 // espera extra tras terminar el zoom

// Videos emergentes: uno a la vez, cada POPUP_MIN_MS–POPUP_MAX_MS al azar
const POPUPS = [popup1, popup2]
const POPUP_RATIO = 470 / 640 // alto / ancho de los videos

// Copia en memoria (blob:) de cada video emergente, se descarga una sola vez por
// visita. Reproducirlos desde memoria evita que el video visible quede esperando
// a otro elemento que tiene el mismo archivo abierto en la caché del navegador
// (lo que pasaba al refrescar la página)
const popupBlobs = {}
const loadPopupBlobs = () => {
  POPUPS.forEach((src) => {
    if (popupBlobs[src]) return
    popupBlobs[src] = 'loading'
    fetch(src)
      .then((res) => (res.ok ? res.blob() : Promise.reject(res.status)))
      .then((blob) => { popupBlobs[src] = URL.createObjectURL(blob) })
      .catch(() => { delete popupBlobs[src] })
  })
}
const POPUP_AFTER_TEXTS_MS = 250 // el primero sale esto después del último texto
const POPUP_MIN_MS = 500
const POPUP_MAX_MS = 2000
const POPUP_MARGIN = 16 // distancia mínima a los bordes, en px
// Tiempo máximo en pantalla: si el video se traba y nunca termina, se quita igual
const POPUP_MAX_LIFE_MS = 6000
// Tras estos rechazos seguidos de reproducción por política del navegador
// (p. ej. iPhone en ahorro de batería), el ciclo se detiene
const POPUP_MAX_BLOCKED = 3

const random = (min, max) => min + Math.random() * (max - min)

export default {
  name: 'HomeView',
  inject: { homeReady: { default: null } },
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
    // Precarga los videos emergentes en memoria (son livianos) para que el
    // primero aparezca al instante
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      loadPopupBlobs()
    }

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
    // Textos: cuando termina el zoom de entrada. Los videos emergentes empiezan
    // después, cuando ya apareció el último texto
    when('homeReady', () => {
      this.timer = setTimeout(() => {
        this.textsIn = true
        this.$nextTick(() => this.afterTextsShown(() => this.startPopups()))
      }, POP_DELAY_MS)
    })
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    clearTimeout(this.popupTimer)
    clearTimeout(this.popupWatchdog)
    document.removeEventListener('visibilitychange', this.onVisibility)
  },
  methods: {
    // Ejecuta fn cuando ya aparecieron todos los textos. Usa la promesa
    // `finished` de cada animación: los eventos animationend no siempre se
    // disparan con animaciones de duración 0 (pasaba en la primera carga)
    afterTextsShown(fn) {
      const animations = this.$el.getAnimations
        ? this.$el.getAnimations({ subtree: true }).filter((a) => a.animationName === 'home-pop')
        : []
      if (!animations.length) {
        // Sin animaciones (navegador viejo o "reducir movimiento"): por tiempo
        this.timer = setTimeout(fn, (this.texts.length - 1) * POP_STAGGER_MS)
        return
      }
      Promise.all(animations.map((a) => a.finished)).then(fn, fn)
    },
    // Arranca el ciclo de videos emergentes (salvo con "reducir movimiento")
    startPopups() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      this.popupCount = 0
      this.popupBlocked = 0
      this.onVisibility = () => {
        // Con la pestaña oculta se detiene el ciclo, para no gastar batería
        if (document.hidden) {
          clearTimeout(this.popupTimer)
          clearTimeout(this.popupWatchdog)
          this.popup = null
        } else {
          this.schedulePopup(random(POPUP_MIN_MS, POPUP_MAX_MS))
        }
      }
      document.addEventListener('visibilitychange', this.onVisibility)
      this.schedulePopup(POPUP_AFTER_TEXTS_MS)
    },
    schedulePopup(ms) {
      clearTimeout(this.popupTimer)
      this.popupTimer = setTimeout(() => this.showPopup(), ms)
    },
    showPopup() {
      if (document.hidden) return
      const spot = this.findSpot()
      // Alterna al azar, sin repetir el mismo video dos veces seguidas
      const choices = POPUPS.filter((src) => src !== this.lastPopup)
      const src = choices[Math.floor(Math.random() * choices.length)]
      this.lastPopup = src
      const id = ++this.popupCount
      // Usa la copia en memoria si ya está lista; si no, el archivo normal
      const blob = popupBlobs[src]
      this.popup = { id, src: blob && blob !== 'loading' ? blob : src, ...spot }
      clearTimeout(this.popupWatchdog)
      this.popupWatchdog = setTimeout(() => this.hidePopup(id), POPUP_MAX_LIFE_MS)
      this.$nextTick(() => {
        const el = this.$refs.popup
        if (!el || !el.play) return
        // Vue solo pone muted como propiedad; iOS también exige el atributo
        // para dejar reproducir sin interacción
        el.muted = true
        el.setAttribute('muted', '')
        el.play().then(
          () => { this.popupBlocked = 0 },
          (err) => {
            // Un rechazo por política (NotAllowedError) puede ser permanente:
            // tras varios seguidos se deja de intentar. Cualquier otro error
            // (carga interrumpida, etc.) solo salta al siguiente video
            if (err && err.name === 'NotAllowedError' && ++this.popupBlocked >= POPUP_MAX_BLOCKED) {
              clearTimeout(this.popupWatchdog)
              this.popup = null
              return
            }
            this.hidePopup(id)
          }
        )
      })
    },
    // Quita el video (si sigue siendo el mismo) y programa el siguiente
    hidePopup(id) {
      if (!this.popup || this.popup.id !== id) return
      clearTimeout(this.popupWatchdog)
      this.popup = null
      this.schedulePopup(random(POPUP_MIN_MS, POPUP_MAX_MS))
    },
    // Lugar al azar en cualquier parte de la pantalla. El video queda debajo de
    // los textos y no recibe clics, así que puede pasar por detrás de ellos
    findSpot() {
      const page = { width: this.$el.offsetWidth, height: this.$el.offsetHeight }
      const mobile = page.width <= 700
      const w = page.width * (mobile ? random(0.45, 0.55) : random(0.25, 0.3))
      const h = w * POPUP_RATIO
      const m = POPUP_MARGIN
      return {
        x: random(m, Math.max(m, page.width - w - m)),
        y: random(m, Math.max(m, page.height - h - m)),
        w
      }
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

/* Video emergente: aparece y desaparece de golpe, como los textos.
   z-index 0 lo deja sobre el video de fondo y debajo de los textos (z-index 1) */
.home-popup {
  position: absolute;
  z-index: 0;
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
