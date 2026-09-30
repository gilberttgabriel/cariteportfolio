<template>
  <div
    class="home-screen"
    :class="{ 'is-visible': ready, 'intro-done': introDone }"
    @transitionend.self="finishIntro"
  >
    <header class="site-header">
      <RouterLink to="/">
        <img class="site-icon" src="/Subject.png" alt="Carites">
      </RouterLink>
    </header>
    <RouterView v-slot="{ Component }">
      <Transition name="page">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </div>

  <Transition name="welcome">
    <!-- El video del welcome está en public/index.html (#welcome-video), debajo
         de esta capa, para que cargue antes que el JavaScript -->
    <div v-if="!ready" class="welcome">
      <p class="welcome-count">{{ progress }}%</p>
    </div>
  </Transition>
</template>

<script>
import { computed } from 'vue'

// Duración del zoom de entrada del inicio (debe coincidir con .home-screen)
const INTRO_ZOOM_MS = 1600
// Welcome
const WELCOME_MS = 2700 // duración si el video no se puede reproducir
const VIDEO_WAIT_MS = 2000 // cuánto esperar a que arranque el video
const WELCOME_FADE_MS = 1100 // debe coincidir con .welcome-leave-active

export default {
  name: 'App',
  provide() {
    return {
      // El inicio terminó su zoom de entrada y ya se ve nítido
      homeReady: computed(() => this.introDone)
    }
  },
  data() {
    return {
      ready: false,
      introDone: false,
      progress: 1
    }
  },
  mounted() {
    // Welcome: el contador sigue la reproducción del video (#welcome-video), así
    // ambos avanzan juntos aunque el video tarde en cargar. Si el video no
    // arranca en VIDEO_WAIT_MS (p. ej. el navegador lo bloquea), el contador
    // sigue solo en WELCOME_MS
    const video = document.getElementById('welcome-video')
    const start = performance.now()
    let timerStart = null
    const tick = (now) => {
      let t
      const playing = video && video.duration && (video.currentTime > 0 || video.ended)
      if (timerStart === null && playing) {
        t = video.ended ? 1 : video.currentTime / video.duration
      } else if (timerStart !== null || !video || now - start > VIDEO_WAIT_MS) {
        if (timerStart === null) timerStart = now
        t = (now - timerStart) / WELCOME_MS
      } else {
        t = 0
      }
      t = Math.min(t, 1)
      this.progress = Math.max(1, Math.round(t * 100))
      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        this.ready = true
        this.hideWelcomeVideo(video)
        // Respaldo por si no llega el evento de fin del zoom (p. ej. con
        // "reducir movimiento" no hay transición)
        this.introTimer = setTimeout(this.finishIntro, INTRO_ZOOM_MS + 100)
      }
    }
    requestAnimationFrame(tick)
  },
  beforeUnmount() {
    clearTimeout(this.introTimer)
  },
  methods: {
    // Desvanece el video del welcome junto con su capa y luego lo quita
    hideWelcomeVideo(video) {
      if (!video) return
      video.style.transition = `opacity ${WELCOME_FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
      video.style.opacity = '0'
      setTimeout(() => video.remove(), WELCOME_FADE_MS)
    },
    finishIntro() {
      if (!this.ready) return
      clearTimeout(this.introTimer)
      this.introDone = true
    }
  }
}
</script>

<style>
body {
  margin: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #1a1a1a;
  position: relative;
  height: 100vh;
  /* En celulares, dvh descuenta las barras del navegador */
  height: 100dvh;
  overflow: hidden;
  background: #000000;
}

/* Inicio: se pinta desde el principio debajo del welcome (ya acercado),
   así al terminar solo hace zoom out mientras el welcome se desvanece.
   will-change lo deja en su propia capa de GPU para que no haya tirones. */
.home-screen {
  position: absolute;
  inset: 0;
  transform: scale(1.15);
  will-change: transform;
  transition: transform 1.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.home-screen.is-visible {
  transform: scale(1);
}

/* Al terminar el zoom out se suelta la capa de GPU: así el navegador
   vuelve a pintar el inicio a resolución completa y el hover no lo degrada */
.home-screen.intro-done {
  transform: none;
  will-change: auto;
  transition: none;
}

/* Cada página (inicio y secciones) ocupa toda la pantalla con su fondo */
.page {
  position: absolute;
  inset: 0;
  background-color: #a4a8a1;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

/* Cambio de página: la nueva aparece encima de la anterior */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.5s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

/* Welcome */
.welcome {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  /* Transparente: debajo se ve el video del welcome (#welcome-video) */
  background: transparent;
  will-change: opacity;
}

/* Contador encima del video, abajo al centro */
.welcome-count {
  position: absolute;
  left: 50%;
  bottom: calc(32px + env(safe-area-inset-bottom, 0px));
  translate: -50% 0;
  margin: 0;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  color: #ecebe0;
  font-size: 1.25rem;
  letter-spacing: 0.2em;
  font-variant-numeric: tabular-nums;
}

.welcome-leave-active {
  will-change: opacity;
  transition: opacity 1.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.welcome-leave-to {
  opacity: 0;
}

/* El header va siempre adelante de las páginas (y de las imágenes en hover).
   Solo el ícono recibe el cursor, así el resto de la franja no bloquea
   el hover de las secciones que queden debajo */
.site-header {
  position: relative;
  z-index: 5;
  pointer-events: none;
  display: flex;
  justify-content: flex-start;
  padding: 44px 30px 20px 64px;
}

.site-header a {
  pointer-events: auto;
}

.site-icon {
  height: clamp(64px, 14vh, 130px);
  width: auto;
  display: block;
}

/* Celular: ícono más chico y centrado arriba */
@media (max-width: 700px) {
  .site-header {
    justify-content: center;
    padding: 14px 16px;
  }

  .site-icon {
    height: 56px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-screen,
  .page-enter-active,
  .page-leave-active,
  .welcome-leave-active { transition: none; }
  .home-screen { transform: none; will-change: auto; }
}
</style>
