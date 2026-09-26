<template>
  <div
    class="home-screen"
    :class="{ 'is-visible': ready, 'intro-done': introDone }"
    @transitionend.self="introDone = ready"
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
    <div v-if="!ready" class="welcome">
      <img class="welcome-gif" src="/esquinaizquierda.gif" alt="">
      <p class="welcome-count">{{ progress }}%</p>
    </div>
  </Transition>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'App',
  provide() {
    // Avisa a las páginas cuándo termina el welcome (el inicio lo usa para su intro)
    return { welcomeDone: computed(() => this.ready) }
  },
  data() {
    return {
      ready: false,
      introDone: false,
      progress: 1
    }
  },
  mounted() {
    // Welcome: cuenta de 1 a 100% en WELCOME_MS y luego muestra el inicio
    const WELCOME_MS = 2000
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / WELCOME_MS, 1)
      this.progress = Math.max(1, Math.round(t * 100))
      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        this.ready = true
      }
    }
    requestAnimationFrame(tick)
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
  overflow: hidden;
  background: #182b3c;
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
  background: #182b3c;
  will-change: opacity;
}

.welcome-gif {
  width: min(600px, 80vw);
  display: block;
}

.welcome-count {
  margin: 0;
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

@media (prefers-reduced-motion: reduce) {
  .home-screen,
  .page-enter-active,
  .page-leave-active,
  .welcome-leave-active { transition: none; }
  .home-screen { transform: none; will-change: auto; }
}
</style>
