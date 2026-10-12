<template>
  <!-- Stills: proyectos en una columna simétrica, casi de borde a borde. Cada
       portada está en blanco y negro; con
       el cursor (o al quedar al centro de la pantalla en celular) se revela a
       color con su nombre. Al hacer clic se despliegan las fotos del proyecto.
       Entre portadas hay espacios en blanco reservados para ilustraciones -->
  <div ref="scroller" class="stills" @scroll.passive="onScroll">
    <div class="stills-column">
      <section
        v-for="(project, i) in projects"
        :key="project.name"
        ref="covers"
        :data-i="i"
        class="stills-project"
        :class="{ 'is-active': i === active, 'is-open': open === i }"
      >
        <!-- Espacio para ilustración, con notas a mano -->
        <div class="stills-space">
          <span
            v-for="(note, n) in project.notes"
            :key="n"
            class="stills-note"
            :style="{ left: note.x + '%', top: note.y + '%', transform: `rotate(${note.r || 0}deg)` }"
          >{{ note.text }}</span>
        </div>

        <button
          type="button"
          class="stills-cover"
          :aria-expanded="open === i"
          :aria-label="'Ver ' + project.name"
          @click="toggle(i)"
        >
          <img class="stills-cover-img" :src="project.cover" alt="">
          <span class="stills-name">{{ project.name }}</span>
        </button>

        <!-- Contenido desplegable -->
        <div class="stills-content">
          <div class="stills-content-inner">
            <p class="stills-caption">{{ project.caption }}</p>
            <div class="stills-photos">
              <img v-for="src in project.photos" :key="src" :src="src" alt="" loading="lazy">
            </div>
          </div>
        </div>

      </section>

      <!-- Espacio final para ilustración -->
      <div class="stills-space"></div>
    </div>
  </div>
</template>

<script>
// Proyectos con imágenes de prueba de la carpeta public.
// notes: textos a mano
// en el espacio en blanco de arriba de cada portada (x, y en % de ese espacio)
const PROJECTS = [
  {
    name: 'CASABANA',
    cover: '/direct/1.jpg',
    caption: 'casabana · 2025 · 35mm',
    photos: ['/direct/2.jpg', '/direct/3.jpg', '/direct/4.jpg'],
    notes: [
      { text: 'la casa de la abuela', x: 22, y: 48, r: -6 },
      { text: 'toca el punto', x: 72, y: 62, r: 5 }
    ]
  },
  {
    name: 'MARIO',
    cover: '/fotosimg.jpg',
    caption: 'mario · retratos · 2024',
    photos: ['/contactimg.jpg', '/redesimg.jpeg', '/bioimg.jpg'],
    notes: [
      { text: 'luz roja, de noche', x: 64, y: 28, r: 4 },
      { text: 'él no quería posar', x: 10, y: 64, r: -4 }
    ]
  },
  {
    name: 'LERO',
    cover: '/directimg.jpg',
    caption: 'lero · paisajes · 2025',
    photos: ['/direct/4.jpg', '/fotosimg.jpg', '/direct/1.jpg'],
    notes: [
      { text: 'la montaña al amanecer', x: 8, y: 40, r: -7 },
      { text: 'ver más ↓', x: 78, y: 70, r: 3 }
    ]
  }
]

const TOUCH_QUERY = '(max-width: 700px), (hover: none)'

export default {
  name: 'StillsGallery',
  data() {
    return { projects: PROJECTS, active: -1, open: -1 }
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
    // Abre un proyecto (y cierra el que estuviera abierto)
    toggle(i) {
      this.open = this.open === i ? -1 : i
    },
    // En celular, la portada más cercana al centro de la pantalla se revela
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
        ;(this.$refs.covers || []).forEach((el) => {
          const box = el.querySelector('.stills-cover').getBoundingClientRect()
          const dist = Math.abs(box.top + box.height / 2 - middle)
          if (dist < bestDist) {
            bestDist = dist
            best = Number(el.dataset.i)
          }
        })
        this.active = best
      })
    }
  }
}
</script>

<style>
.stills {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* Columna centrada y simétrica, casi de borde a borde. --w: ancho */
.stills-column {
  --w: calc(100vw - 2 * clamp(16px, 3vw, 48px));
  width: var(--w);
  margin: 0 auto;
  padding: clamp(40px, 6vh, 70px) 0 0;
  display: flex;
  flex-direction: column;
}

/* Espacio en blanco entre portadas, reservado para ilustraciones */
.stills-space {
  position: relative;
  height: clamp(140px, 22vw, 320px);
}

.stills-caption {
  margin: 0;
  padding: 18px 0 10px;
  font-family: 'Reenie Beanie', 'Bradley Hand', cursive;
  font-size: clamp(20px, 2.4vw, 34px);
  color: #1a1a1a;
}

.stills-project {
  position: relative;
}

/* Portada en blanco y negro. Con el cursor (o al pasar por el centro de la
   pantalla en celular) se revela a color con su nombre */
.stills-cover {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 86vh;
  padding: 0;
  border: 0;
  background: #000000;
  cursor: pointer;
  overflow: hidden;
}

.stills-cover-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1);
}

.stills-name {
  position: absolute;
  left: 50%;
  top: 50%;
  translate: -50% -50%;
  font-family: 'Spectral', Georgia, serif;
  font-weight: 700;
  font-size: clamp(22px, 3.6vw, 56px);
  letter-spacing: 0.04em;
  color: #ffffff;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
  visibility: hidden;
}

/* Revelada: colores reales y nombre del proyecto, de golpe */
.stills-cover:hover .stills-cover-img,
.stills-project.is-active .stills-cover-img,
.stills-project.is-open .stills-cover-img {
  filter: none;
}

.stills-cover:hover .stills-name,
.stills-project.is-active .stills-name,
.stills-project.is-open .stills-name {
  visibility: visible;
}

/* Contenido desplegable: se abre hacia abajo (grid 0fr → 1fr) */
.stills-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.stills-project.is-open .stills-content {
  grid-template-rows: 1fr;
}

.stills-content-inner {
  overflow: hidden;
}

.stills-photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px 0;
  background: #ffffff;
}

.stills-photos img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}

/* Textos a mano regados por la página */
.stills-note {
  position: absolute;
  pointer-events: none;
  white-space: nowrap;
  font-family: 'Reenie Beanie', 'Bradley Hand', 'Segoe Script', cursive;
  font-size: clamp(20px, 2.6vw, 38px);
  line-height: 1;
  color: #2a2a2a;
  opacity: 0.85;
}

/* Celular */
@media (max-width: 700px) {
  .stills-column {
    padding-top: 70px;
  }

  .stills-cover {
    aspect-ratio: 4 / 5;
  }

  .stills-photos {
    grid-template-columns: 1fr;
  }
}
</style>
