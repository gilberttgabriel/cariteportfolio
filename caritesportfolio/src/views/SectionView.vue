<template>
  <div
    class="page section"
    :class="{ 'section-plain': !bg || light }"
    :style="pageStyle"
  >
    <!-- La sección se desplaza entera. Al final hay una zona "contacto": al
         seguir bajando hasta verla completa, se pasa a la página de contacto -->
    <div ref="scroller" class="section-scroll">
      <!-- En contacto, si se llegó bajando desde otra sección: zona arriba que
           al subir hasta verla devuelve a esa sección -->
      <div v-if="canGoBack" ref="back" class="section-next section-back">
        <span class="section-next-arrow">↑</span>
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
        <span class="section-next-arrow">↓</span>
      </div>
    </div>
  </div>
</template>

<script>
import DirectGallery from '../components/DirectGallery.vue'
import StillsGallery from '../components/StillsGallery.vue'
import ContactInfo from '../components/ContactInfo.vue'
import ManifestoInfo from '../components/ManifestoInfo.vue'

// Parte de la zona final (o la de volver) que tiene que verse para cambiar
// de página
const NEXT_RATIO = 0.9

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
      // de contacto a medio ver (sin llegar a disparar el cambio)
      scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight - zone.offsetHeight / 2
    }
    flow.returning = false
    if (!this.toContact) flow.cameFrom = null
    if (!zone || !window.IntersectionObserver) return
    // Se observa con el scroll ya ubicado
    this.observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.intersectionRatio >= NEXT_RATIO) || this.leaving) return
      this.leaving = true
      if (this.toContact) {
        // Bajando al final: a contacto, recordando de dónde se vino
        flow.cameFrom = this.$route.path
        this.$router.push('/contacto')
      } else {
        // Subiendo en contacto: de vuelta a la sección
        const back = this.cameFromPath
        flow.returning = true
        this.$router.push(back)
      }
    }, { root: scroller, threshold: NEXT_RATIO })
    this.observer.observe(zone)
  },
  beforeUnmount() {
    if (this.observer) this.observer.disconnect()
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
  animation: section-next 1.2s steps(1) infinite;
}

@keyframes section-next {
  50% {
    visibility: hidden;
  }
}
</style>
