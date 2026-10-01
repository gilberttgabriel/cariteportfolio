<template>
  <div
    class="page section"
    :class="{ 'section-plain': !bg || light, 'section-grain': projects }"
    :style="pageStyle"
  >
    <!-- Composición tipo tira de fotomatón: columnas de distinto alto apoyadas
         sobre una misma línea de base -->
    <div v-if="projects" class="booth">
      <div class="booth-row">
        <div v-for="(column, c) in columns" :key="c" class="booth-col">
          <figure v-for="tile in column" :key="tile.n" class="booth-tile">
            <img :src="tile.src" alt="" loading="lazy">
          </figure>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Fotos de prueba, se reparten en orden por todas las tiras
const TEST_PHOTOS = [
  '/fotosimg.jpg',
  '/directimg.jpg',
  '/redesimg.jpeg',
  '/bioimg.jpg',
  '/contactimg.jpg'
]

// Cantidad de fotos de cada columna (de izquierda a derecha), según la
// imagen de referencia. En celular se usa una versión más corta
const LAYOUT = [4, 4, 3, 2, 1, 1, 1, 1, 3, 2, 3, 3, 4, 4]
const LAYOUT_MOBILE = [4, 3, 2, 1, 1, 2, 3, 4]
const MOBILE_QUERY = '(max-width: 700px)'

export default {
  name: 'SectionView',
  props: {
    // Sin fondo, la página queda en blanco hueso
    bg: { type: String, default: null },
    bgColor: { type: String, default: null },
    bgSize: { type: String, default: null },
    // Fondo claro: textos en negro
    light: { type: Boolean, default: false },
    img: { type: String, required: true },
    // Muestra la vista de proyectos (solo en direct)
    projects: { type: Boolean, default: false }
  },
  data() {
    return {
      mobile: window.matchMedia(MOBILE_QUERY).matches
    }
  },
  computed: {
    pageStyle() {
      const style = {}
      if (this.bg) style.backgroundImage = `url(${this.bg})`
      if (this.bgColor) style.backgroundColor = this.bgColor
      if (this.bgSize) style.backgroundSize = this.bgSize
      return style
    },
    // Columnas con sus fotos. Empieza por la foto propia de la sección y
    // sigue con las demás de prueba
    columns() {
      const photos = [this.img, ...TEST_PHOTOS.filter((src) => src !== this.img)]
      let n = 0
      return (this.mobile ? LAYOUT_MOBILE : LAYOUT).map((count) =>
        Array.from({ length: count }, () => {
          const tile = { n, src: photos[n % photos.length] }
          n++
          return tile
        })
      )
    }
  },
  mounted() {
    this.media = window.matchMedia(MOBILE_QUERY)
    this.onMedia = (e) => { this.mobile = e.matches }
    this.media.addEventListener('change', this.onMedia)
  },
  beforeUnmount() {
    this.media.removeEventListener('change', this.onMedia)
  }
}
</script>

<style>
.section {
  background-color: #ebeae6;
}

/* Grano de película sobre el fondo y las fotos: ruido fino generado con SVG,
   fijo (sin animar) para que se vea crudo y nítido. No recibe clics, así
   el hover de las fotos sigue funcionando */
.section-grain::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.4 -0.35'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 220px 220px;
  opacity: 0.15;
  mix-blend-mode: multiply;
}

/* --tile: ancho de cada foto. Se limita por el ancho (14 columnas) y por el
   alto (4 filas bajo el header) */
.booth {
  --tile: min(6.6vw, 11vh);
  --gap: 1px;
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* Como en la referencia: el bloque de fotos queda algo por debajo del centro */
  padding-top: 12vh;
  box-sizing: border-box;
}

/* Las columnas se apoyan todas sobre la misma línea de abajo */
.booth-row {
  display: flex;
  align-items: flex-end;
  gap: var(--gap);
}

.booth-col {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

/* Cada foto cruda, sin marco ni recorte: todas del mismo ancho */
.booth-tile {
  width: var(--tile);
  margin: 0;
}

/* Blanco y negro; al pasar el cursor recupera el color de golpe. Sin
   transición: animar el filtro hacía que la foto se viera borrosa */
.booth-tile img {
  display: block;
  /* Cada foto con su proporción original, aunque queden irregulares */
  width: 100%;
  height: auto;
  filter: grayscale(1) contrast(1.18) brightness(0.97);
}

.booth-tile:hover img {
  filter: none;
}

/* Celular: menos columnas y fotos más grandes */
@media (max-width: 700px) {
  .booth {
    --tile: min(11.5vw, 10vh);
    padding-top: 8vh;
  }
}
</style>
