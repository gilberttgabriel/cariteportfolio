<template>
  <div
    class="home-screen"
    :class="{ 'is-visible': ready, 'intro-done': introDone }"
    @transitionend.self="finishIntro"
  >
    <!-- El inicio no lleva el ícono (como la referencia) -->
    <header v-show="$route.path !== '/'" class="site-header">
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
    <div v-if="!ready" class="welcome" @click="onWelcomeClick">
      <!-- Snake: hay que llegar a GOAL puntos para entrar. Desactivado por
           ahora (SNAKE_ENABLED); se entra con clic o Enter -->
      <WelcomeSnake v-if="SNAKE_ENABLED" @win="enter" />
      <p v-else class="welcome-enter" :class="{ 'is-off': !blinkOn }">{{ enterText }}</p>
    </div>
  </Transition>
</template>

<script>
import { computed } from 'vue'
import WelcomeSnake from './components/WelcomeSnake.vue'

// Duración del zoom de entrada del inicio (debe coincidir con .home-screen)
const INTRO_ZOOM_MS = 1600
const WELCOME_FADE_MS = 1100 // debe coincidir con .welcome-leave-active
// Juego de la culebrita en el welcome. En false se entra con clic (celular)
// o Enter (computadora)
const SNAKE_ENABLED = false
// El texto titila al ritmo del "(9)" del video: 1 s oculto, 1 s visible
const BLINK_MS = 1000

export default {
  name: 'App',
  components: { WelcomeSnake },
  provide() {
    return {
      // El inicio terminó su zoom de entrada y ya se ve nítido
      homeReady: computed(() => this.introDone)
    }
  },
  data() {
    return {
      SNAKE_ENABLED,
      ready: false,
      introDone: false,
      blinkOn: false,
      // Celular (sin cursor): clic. Computadora: Enter
      enterText: window.matchMedia('(hover: none), (pointer: coarse)').matches
        ? 'haz click para entrar'
        : 'presiona enter para entrar'
    }
  },
  mounted() {
    if (SNAKE_ENABLED) return
    window.addEventListener('keydown', this.onWelcomeKey)
    // Titileo sincronizado con el tiempo del video del welcome; si el video
    // no está corriendo, sigue el reloj
    const video = document.getElementById('welcome-video')
    const start = performance.now()
    const tick = (now) => {
      if (this.ready) return
      const ms = video && video.currentTime > 0 ? video.currentTime * 1000 : now - start
      this.blinkOn = Math.floor(ms / BLINK_MS) % 2 === 1
      this.blinkFrame = requestAnimationFrame(tick)
    }
    this.blinkFrame = requestAnimationFrame(tick)
  },
  beforeUnmount() {
    clearTimeout(this.introTimer)
    cancelAnimationFrame(this.blinkFrame)
    window.removeEventListener('keydown', this.onWelcomeKey)
  },
  methods: {
    // Ganó el snake: se quita el welcome (con su video) y empieza el zoom de entrada
    enter() {
      if (this.ready) return
      this.ready = true
      window.removeEventListener('keydown', this.onWelcomeKey)
      this.hideWelcomeVideo(document.getElementById('welcome-video'))
      // Respaldo por si no llega el evento de fin del zoom (p. ej. con
      // "reducir movimiento" no hay transición)
      this.introTimer = setTimeout(this.finishIntro, INTRO_ZOOM_MS + 100)
    },
    onWelcomeKey(e) {
      if (e.key === 'Enter') this.enter()
    },
    onWelcomeClick() {
      if (!SNAKE_ENABLED) this.enter()
    },
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

.welcome-leave-active {
  will-change: opacity;
  transition: opacity 1.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.welcome-leave-to {
  opacity: 0;
}

/* "Presiona enter / haz click para entrar": amarillo con un contorno oscuro
   fino, como el "(9)" del video, y titila con cortes secos al mismo ritmo */
.welcome {
  cursor: pointer;
}

.welcome-enter {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(12vh + env(safe-area-inset-bottom, 0px));
  margin: 0;
  padding: 0 16px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: clamp(14px, 2.5vh, 26px);
  font-weight: 500;
  color: #dede3a;
  text-shadow:
    -1px -1px 0 #111, 1px -1px 0 #111, -1px 1px 0 #111, 1px 1px 0 #111,
    0 0 12px rgba(0, 0, 0, 0.6);
}

.welcome-enter.is-off {
  visibility: hidden;
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
