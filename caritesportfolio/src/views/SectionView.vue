<template>
  <div
    class="page section"
    :class="{ 'section-plain': !bg || light }"
    :style="pageStyle"
  >
    <DirectGallery v-if="projects" />
  </div>
</template>

<script>
import DirectGallery from '../components/DirectGallery.vue'

export default {
  name: 'SectionView',
  components: { DirectGallery },
  props: {
    // Sin fondo, la página queda en blanco hueso
    bg: { type: String, default: null },
    bgColor: { type: String, default: null },
    bgSize: { type: String, default: null },
    // Fondo claro: textos en negro
    light: { type: Boolean, default: false },
    img: { type: String, required: true },
    // Muestra la galería de proyectos (solo en direct)
    projects: { type: Boolean, default: false }
  },
  computed: {
    pageStyle() {
      const style = {}
      if (this.bg) style.backgroundImage = `url(${this.bg})`
      if (this.bgColor) style.backgroundColor = this.bgColor
      if (this.bgSize) style.backgroundSize = this.bgSize
      return style
    }
  }
}
</script>

<style>
.section {
  background-color: #ebeae6;
}
</style>
