<template>
  <MobileHome v-if="isMobile" />
  <DesktopHome v-else />
</template>

<script>
import DesktopHome from './DesktopHome.vue'
import MobileHome from './MobileHome.vue'

// Ancho máximo (px) en el que se usa el inicio para celular
const MOBILE_QUERY = '(max-width: 700px)'

export default {
  name: 'HomeView',
  components: { DesktopHome, MobileHome },
  data() {
    return {
      isMobile: window.matchMedia(MOBILE_QUERY).matches
    }
  },
  mounted() {
    this.query = window.matchMedia(MOBILE_QUERY)
    this.onChange = (e) => { this.isMobile = e.matches }
    this.query.addEventListener('change', this.onChange)
  },
  beforeUnmount() {
    this.query.removeEventListener('change', this.onChange)
  }
}
</script>
