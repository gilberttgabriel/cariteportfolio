<template>
  <!-- Galería de direct: cuadrícula de 2 columnas de celdas cuadradas, cada foto
       entera dentro de su celda sobre blanco (como maxmontgomeryphoto.com).
       En los blancos alrededor de cada foto hay notas a mano -->
  <div ref="scroller" class="direct" @scroll.passive="onScroll">
    <div class="direct-grid">
      <figure
        v-for="(photo, i) in photos"
        :key="photo.src"
        ref="cells"
        :data-i="i"
        class="direct-cell"
        :class="{ 'is-active': i === active }"
      >
        <img class="direct-img" :src="photo.src" alt="" :loading="i < 2 ? 'eager' : 'lazy'">

        <template v-for="(note, n) in photo.notes" :key="n">
          <!-- Flecha dibujada a mano -->
          <svg
            v-if="note.arrow"
            class="direct-mark"
            :style="markStyle(note)"
            viewBox="0 0 100 40"
            aria-hidden="true"
          >
            <path d="M3 30 C 22 14, 48 34, 72 18 S 90 10, 95 12" />
            <path d="M83 4 L 96 12 L 85 23" />
          </svg>
          <!-- Círculo a mano alzada -->
          <svg
            v-else-if="note.circle"
            class="direct-mark"
            :style="markStyle(note)"
            viewBox="0 0 100 70"
            aria-hidden="true"
          >
            <path d="M58 6 C 20 2, 3 20, 6 38 C 9 58, 40 68, 66 62 C 92 56, 98 34, 88 20 C 80 8, 52 2, 34 10" />
          </svg>
          <!-- Texto manuscrito (puede ir tachado) -->
          <span
            v-else
            class="direct-note"
            :class="{ 'is-struck': note.strike }"
            :style="markStyle(note)"
          >{{ note.text }}</span>
        </template>
      </figure>
    </div>
  </div>
</template>

<script>
// Fotos de direct (copias livianas en public/direct). En cada nota:
//   x, y: posición en % de la celda (cuadrada). w: ancho en % (flechas y círculos)
//   r: rotación en grados. strike: texto tachado. arrow / circle: dibujo
// Los blancos libres dependen de la proporción de cada foto: la 1 es muy
// vertical (blancos a los lados), la 2 horizontal (arriba y abajo) y la 3 y
// la 4 dejan franjas angostas a los lados
const PHOTOS = [
  {
    src: '/direct/1.jpg',
    notes: [
      { text: '01.', x: 3, y: 3 },
      { text: 'luz de las 6pm', x: 2, y: 30, r: -6 },
      { text: 'muy oscura', x: 3, y: 46, r: -3, strike: true },
      { text: '→ así está bien', x: 2, y: 53, r: -4 },
      { arrow: true, x: 4, y: 64, w: 17, r: 18 },
      { text: '¡esta!', x: 82, y: 14, r: 8 },
      { circle: true, x: 79, y: 10, w: 19, r: -6 },
      { text: 'rollo 2', x: 88, y: 96, r: -90 }
    ]
  },
  {
    src: '/direct/2.jpg',
    notes: [
      { text: '02.', x: 3, y: 3 },
      { text: 'recortar aquí', x: 58, y: 1, r: -2 },
      { arrow: true, x: 76, y: 5, w: 12, r: 70 },
      { text: 'muy plana', x: 6, y: 89, r: 2, strike: true },
      { text: 'mejor en b/n', x: 6, y: 94, r: -2 },
      { text: 'feb.', x: 86, y: 90, r: 6 }
    ]
  },
  {
    src: '/direct/3.jpg',
    notes: [
      { text: '03.', x: 1, y: 3 },
      { text: 'repetir con flash', x: 6, y: 78, r: -90 },
      { text: 'no', x: 89, y: 22, r: 4, strike: true },
      { text: 'sí', x: 90, y: 28, r: -6 },
      { arrow: true, x: 86, y: 70, w: 14, r: 160 }
    ]
  },
  {
    src: '/direct/4.jpg',
    notes: [
      { text: '04.', x: 1, y: 3 },
      { text: 'descartar', x: 0, y: 40, r: -8, strike: true },
      { text: 'la mejor', x: 0, y: 47, r: -5 },
      { text: 'del rollo', x: 1, y: 52, r: -3 },
      { circle: true, x: 85, y: 82, w: 15, r: 10 },
      { text: 'x2', x: 90, y: 85, r: -4 }
    ]
  }
]

// En celular (sin cursor) la foto que está en el centro de la pantalla al
// hacer scroll es la que se pone a color
const TOUCH_QUERY = '(max-width: 700px), (hover: none)'

export default {
  name: 'DirectGallery',
  data() {
    return { photos: PHOTOS, active: -1 }
  },
  mounted() {
    this.touch = window.matchMedia(TOUCH_QUERY)
    this.onResize = () => this.onScroll()
    window.addEventListener('resize', this.onResize)
    this.$nextTick(this.onScroll)
  },
  beforeUnmount() {
    cancelAnimationFrame(this.frame)
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    // Busca la foto más cercana al centro de la pantalla (una vez por cuadro)
    onScroll() {
      cancelAnimationFrame(this.frame)
      this.frame = requestAnimationFrame(() => {
        if (!this.touch.matches) {
          this.active = -1
          return
        }
        const middle = window.innerHeight / 2
        let best = -1
        let bestDist = Infinity
        ;(this.$refs.cells || []).forEach((cell) => {
          const box = cell.getBoundingClientRect()
          const dist = Math.abs(box.top + box.height / 2 - middle)
          if (dist < bestDist) {
            bestDist = dist
            best = Number(cell.dataset.i)
          }
        })
        this.active = best
      })
    },
    markStyle(note) {
      const style = {
        left: note.x + '%',
        top: note.y + '%',
        transform: `rotate(${note.r || 0}deg)`
      }
      if (note.w) style.width = note.w + '%'
      return style
    }
  }
}
</script>

<style>
/* La página de direct se desplaza hacia abajo, como la referencia */
.direct {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* --cell: lado de cada celda cuadrada. Grandes y con poco espacio entre
   celdas, para un look maximalista */
.direct-grid {
  --cell: min(47vw, 1100px);
  display: grid;
  grid-template-columns: repeat(2, var(--cell));
  grid-auto-rows: var(--cell);
  justify-content: center;
  gap: calc(var(--cell) * 0.03) calc(var(--cell) * 0.04);
  padding: clamp(20px, 10vh, 45px) 16px 120px;
}

.direct-cell {
  position: relative;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* La foto entera dentro de la celda, sin recorte. Blanco y negro; al pasar
   el cursor recupera el color de golpe */
.direct-img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  filter: grayscale(1) contrast(1.18) brightness(0.97);
}

.direct-img:hover,
.direct-cell.is-active .direct-img {
  filter: none;
}

/* Notas a mano en lápiz. No reciben el cursor, así el hover de la foto
   sigue funcionando aunque una nota la toque */
.direct-note,
.direct-mark {
  position: absolute;
  pointer-events: none;
  transform-origin: left center;
}

.direct-note {
  font-family: 'Reenie Beanie', 'Bradley Hand', 'Segoe Script', cursive;
  font-size: calc(var(--cell) * 0.045);
  line-height: 1;
  white-space: nowrap;
  color: #2a2a2a;
  opacity: 0.88;
}

.direct-note.is-struck {
  text-decoration: line-through;
  text-decoration-thickness: 0.09em;
  text-decoration-color: #2a2a2a;
}

.direct-mark {
  height: auto;
  overflow: visible;
  fill: none;
  stroke: #2a2a2a;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.85;
}

/* Celular: una sola columna */
@media (max-width: 700px) {
  .direct-grid {
    --cell: calc(100vw - 32px);
    grid-template-columns: var(--cell);
    padding-top: 80px;
  }
}
</style>
