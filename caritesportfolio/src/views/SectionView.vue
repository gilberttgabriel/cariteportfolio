<template>
  <div
    class="page section"
    :class="{ 'section-plain': !bg || light }"
    :style="pageStyle"
  >
    <!-- La sección se desplaza entera. Al final hay una zona "contacto": ya en
         el final, al seguir empujando hacia abajo se pasa a contacto -->
    <div ref="scroller" class="section-scroll">
      <!-- En contacto, si se llegó bajando desde otra sección: zona arriba;
           ya arriba del todo, al seguir empujando hacia arriba se vuelve -->
      <div v-if="canGoBack" ref="back" class="section-next section-back">
        <span class="section-next-arrow" :style="{ '--pull': pull }">↑</span>
        <span>(volver)</span>
      </div>
      <div class="section-body">
        <DirectGallery v-if="projects" />
        <StillsGallery v-else-if="stills" />
        <ContactInfo v-else-if="contact" />
        <ManifestoInfo v-else-if="manifesto" />
      </div>
      <div v-if="toContact" ref="next" class="section-next">
        <span>(contacto)</span>
        <span class="section-next-arrow" :style="{ '--pull': pull }">↓</span>
      </div>
    </div>
  </div>
</template>

<script>
import DirectGallery from '../components/DirectGallery.vue'
import StillsGallery from '../components/StillsGallery.vue'
import ContactInfo from '../components/ContactInfo.vue'
import ManifestoInfo from '../components/ManifestoInfo.vue'

// Cambio de página con intención: al llegar al final (o al principio en
// contacto) hay que seguir empujando. Cuánto: con la rueda del mouse
// (suma de desplazamiento, px) y con el dedo (recorrido, px)
const PULL_WHEEL = 350
const PULL_TOUCH = 110
// Si se deja de empujar este tiempo, la cuenta vuelve a cero
const PULL_RESET_MS = 500
// Margen para considerar que ya se está en el borde, en px
const EDGE = 2
// Al llegar al borde, la rueda no suma durante este tiempo: así la inercia
// del scroll (trackpads) no cambia de página sola; hace falta empujar de nuevo
const EDGE_ARM_MS = 400

// Recorrido sección → contacto → sección, compartido entre páginas:
// cameFrom: sección desde la que se bajó a contacto
// returning: se está volviendo a esa sección (debe abrir en su final)
const flow = { cameFrom: null, returning: false }

export default {
  name: 'SectionView',
  components: { DirectGallery, StillsGallery, ContactInfo, ManifestoInfo },
  props: {
    // Sin fondo, la página queda en blanco hueso
    bg: { type: String, default: null },
    bgColor: { type: String, default: null },
    bgSize: { type: String, default: null },
    // Fondo claro: textos en negro
    light: { type: Boolean, default: false },
    img: { type: String, required: true },
    // Muestra la galería de proyectos (solo en direct)
    projects: { type: Boolean, default: false },
    // Muestra la galería de Stills (solo en fotos)
    stills: { type: Boolean, default: false },
    // Muestra los datos de contacto (solo en contacto)
    contact: { type: Boolean, default: false },
    // Muestra el manifiesto (solo en bio)
    manifesto: { type: Boolean, default: false }
  },
  data() {
    return {
      // Solo en contacto, si se llegó bajando desde otra sección
      canGoBack: this.$route.path === '/contacto' && flow.cameFrom !== null,
      // Empuje acumulado en el borde, de 0 a 1 (mueve la flecha)
      pull: 0,
      cameFromPath: flow.cameFrom
    }
  },
  computed: {
    // Todas las secciones terminan en contacto, menos contacto
    toContact() {
      return this.$route.path !== '/contacto'
    },
    pageStyle() {
      const style = {}
      if (this.bg) style.backgroundImage = `url(${this.bg})`
      if (this.bgColor) style.backgroundColor = this.bgColor
      if (this.bgSize) style.backgroundSize = this.bgSize
      return style
    }
  },
  mounted() {
    const scroller = this.$refs.scroller
    const zone = this.toContact ? this.$refs.next : this.$refs.back
    if (this.canGoBack) {
      // Contacto abre justo debajo de la zona de volver
      scroller.scrollTop = zone.offsetHeight
    } else if (this.toContact && flow.returning) {
      // De vuelta desde contacto: la sección abre en su final, con la zona
      // de contacto a medio ver
      scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight - zone.offsetHeight / 2
    }
    flow.returning = false
    if (!this.toContact) flow.cameFrom = null
    if (!zone) return
    scroller.addEventListener('wheel', this.onWheel, { passive: true })
    scroller.addEventListener('touchstart', this.onTouchStart, { passive: true })
    scroller.addEventListener('touchmove', this.onTouchMove, { passive: true })
    scroller.addEventListener('touchend', this.onTouchEnd, { passive: true })
  },
  beforeUnmount() {
    clearTimeout(this.pullTimer)
    const scroller = this.$refs.scroller
    if (!scroller) return
    scroller.removeEventListener('wheel', this.onWheel)
    scroller.removeEventListener('touchstart', this.onTouchStart)
    scroller.removeEventListener('touchmove', this.onTouchMove)
    scroller.removeEventListener('touchend', this.onTouchEnd)
  },
  methods: {
    // ¿Está en el borde desde el que se cambia de página? Abajo del todo en
    // las secciones; arriba del todo en contacto (para volver)
    atEdge() {
      const el = this.$refs.scroller
      if (this.toContact) return el.scrollTop >= el.scrollHeight - el.clientHeight - EDGE
      return el.scrollTop <= EDGE
    },
    // Suma empuje (0 a 1). La flecha lo muestra; al llegar a 1 cambia de página
    addPull(amount) {
      this.pull = Math.min(1, Math.max(0, this.pull + amount))
      clearTimeout(this.pullTimer)
      this.pullTimer = setTimeout(() => { this.pull = 0 }, PULL_RESET_MS)
      if (this.pull >= 1) this.go()
    },
    onWheel(e) {
      // Hacia abajo en las secciones, hacia arriba en contacto
      const push = this.toContact ? e.deltaY : -e.deltaY
      if (push <= 0 || !this.atEdge()) {
        this.pull = 0
        this.edgeSince = null
        return
      }
      const now = performance.now()
      if (this.edgeSince == null) this.edgeSince = now
      if (now - this.edgeSince < EDGE_ARM_MS) return
      this.addPull(push / PULL_WHEEL)
    },
    onTouchStart(e) {
      this.touchY = e.touches[0].clientY
      this.touchPull = 0
    },
    onTouchMove(e) {
      if (this.touchY === undefined) return
      const y = e.touches[0].clientY
      // Dedo hacia arriba = contenido hacia abajo (secciones); al revés en contacto
      const push = this.toContact ? this.touchY - y : y - this.touchY
      this.touchY = y
      if (push <= 0 || !this.atEdge()) {
        this.touchPull = 0
        this.pull = 0
        return
      }
      this.touchPull += push
      this.pull = Math.min(1, this.touchPull / PULL_TOUCH)
      if (this.pull >= 1) this.go()
    },
    onTouchEnd() {
      this.touchY = undefined
      if (!this.leaving) this.pull = 0
    },
    go() {
      if (this.leaving) return
      this.leaving = true
      if (this.toContact) {
        // Bajando al final: a contacto, recordando de dónde se vino
        flow.cameFrom = this.$route.path
        this.$router.push('/contacto')
      } else {
        // Subiendo en contacto: de vuelta a la sección
        flow.returning = true
        this.$router.push(this.cameFromPath)
      }
    }
  }
}
</script>

<style>
.section {
  background-color: #ebeae6;
}

.section-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* El contenido ocupa al menos una pantalla, así en las secciones sin
   galería la zona de contacto queda abajo, fuera de la vista */
.section-body {
  position: relative;
  min-height: 100%;
}

/* Zona final que lleva a contacto */
.section-next {
  height: 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Spectral', Georgia, 'Times New Roman', serif;
  font-size: clamp(14px, 1.4vw, 20px);
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.section-plain .section-next {
  color: #1a1a1a;
  text-shadow: none;
}

.section-next-arrow {
  display: inline-block;
  animation: section-next 1.2s steps(1) infinite;
  /* Se corre hacia el cambio de página a medida que se empuja */
  translate: 0 calc(var(--pull, 0) * 28px);
}

.section-back .section-next-arrow {
  translate: 0 calc(var(--pull, 0) * -28px);
}

@keyframes section-next {
  50% {
    visibility: hidden;
  }
}
</style>
