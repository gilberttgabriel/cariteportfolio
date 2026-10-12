<template>
  <!-- Cinematography / DoP: proyectos en zigzag (izquierda, derecha, …), todos
       del mismo tamaño y formato 16:9. Cada uno puede ser un video en bucle
       (video) o, mientras tanto, una imagen (src). Al lado va su ficha:
       nombre, proyecto y año. Entre proyectos queda espacio para ilustraciones -->
  <div class="direct">
    <div class="direct-zigzag">
      <article
        v-for="(project, i) in projects"
        :key="i"
        ref="items"
        :data-i="i"
        class="direct-item"
        :class="[i % 2 ? 'is-right' : 'is-left', { 'is-active': i === active }]"
      >
        <div class="direct-media">
          <video
            v-if="project.video"
            :src="project.video"
            autoplay
            muted
            loop
            playsinline
            preload="metadata"
            aria-hidden="true"
          ></video>
          <img v-else :src="project.src" alt="" decoding="async" :loading="i < 2 ? 'eager' : 'lazy'">
        </div>

        <!-- Ficha del proyecto -->
        <p class="direct-info">
          <span class="direct-name"><span class="direct-dot"></span>{{ project.name }}</span>
          <span>{{ project.title }}</span>
          <span>{{ project.year }}</span>
        </p>
      </article>
    </div>
  </div>
</template>

<script>
// Proyectos. video: archivo del video en bucle (cuando esté); src: imagen
// provisoria. name, title, year: la ficha de al lado
const PROJECTS = [
  { src: '/direct/1.jpg', name: 'Dani Venz', title: 'repartemeelpeso', year: '2026' },
  { src: '/direct/2.jpg', name: 'Dani Venz', title: 'repartemeelpeso', year: '2026' },
  { src: '/direct/3.jpg', name: 'Dani Venz', title: 'repartemeelpeso', year: '2026' },
  { src: '/direct/4.jpg', name: 'Dani Venz', title: 'repartemeelpeso', year: '2026' }
]

// En celular (sin cursor) el proyecto que está en el centro de la pantalla al
// hacer scroll es el que se pone a color
const TOUCH_QUERY = '(max-width: 700px), (hover: none)'

export default {
  name: 'DirectGallery',
  data() {
    return { projects: PROJECTS, active: -1 }
  },
  mounted() {
    this.touch = window.matchMedia(TOUCH_QUERY)
    this.onResize = () => this.onScroll()
    window.addEventListener('resize', this.onResize)
    // La página que se desplaza es la de la sección (contenedor de arriba):
    // se escucha el scroll en fase de captura para enterarse igual
    document.addEventListener('scroll', this.onResize, { capture: true, passive: true })
    this.$nextTick(this.onScroll)
  },
  beforeUnmount() {
    cancelAnimationFrame(this.frame)
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('scroll', this.onResize, { capture: true })
  },
  methods: {
    // Busca el proyecto más cercano al centro de la pantalla (una vez por cuadro)
    onScroll() {
      // En computadora no hace falta (el color va con el cursor): no se hace
      // ningún trabajo durante el scroll
      if (!this.touch.matches) {
        this.active = -1
        return
      }
      if (this.frame) return
      this.frame = requestAnimationFrame(() => {
        this.frame = null
        const middle = window.innerHeight / 2
        let best = -1
        let bestDist = Infinity
        ;(this.$refs.items || []).forEach((el) => {
          const box = el.querySelector('.direct-media').getBoundingClientRect()
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
/* Se desplaza junto con la página de la sección (SectionView) */
.direct {
  position: relative;
  overflow-x: hidden;
}

/* --media: ancho de cada video/imagen. Los de la izquierda empiezan en
   --left y los de la derecha en --right; entre uno y otro queda un espacio
   vertical para ilustraciones */
.direct-zigzag {
  --media: min(50vw, 960px);
  --left: 6vw;
  --right: 34vw;
  display: flex;
  flex-direction: column;
  gap: clamp(40px, 5vw, 90px);
  padding: clamp(120px, 16vh, 170px) 0 140px;
}

.direct-item {
  position: relative;
  width: var(--media);
}

.direct-item.is-left {
  margin-left: var(--left);
}

.direct-item.is-right {
  margin-left: var(--right);
}

/* Mismo tamaño y formato para todos: 16:9 */
.direct-media {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #111111;
}

.direct-media img,
.direct-media video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1);
}

/* Al pasar el cursor (o al quedar al centro en celular) recupera el color */
.direct-media:hover img,
.direct-media:hover video,
.direct-item.is-active img,
.direct-item.is-active video {
  filter: none;
}

/* Ficha: arriba, a la derecha del video */
.direct-info {
  position: absolute;
  left: calc(100% + 1.4em);
  top: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: 'Spectral', Georgia, 'Times New Roman', serif;
  font-size: clamp(11px, 1vw, 16px);
  line-height: 1.15;
  color: #1a1a1a;
  white-space: nowrap;
  text-align: left;
}

/* Punto azul delante del nombre */
.direct-name {
  position: relative;
}

.direct-dot {
  position: absolute;
  left: -0.9em;
  top: 0.4em;
  width: 0.45em;
  height: 0.45em;
  border-radius: 50%;
  background: #2b2bd9;
}

/* Celular: zigzag con videos que alternan de lado, dejando una franja libre
   al costado de cada uno para ilustraciones; la ficha va debajo */
@media (max-width: 700px) {
  .direct-zigzag {
    --media: 62vw;
    --left: 4vw;
    --right: 34vw;
    gap: 40px;
    padding-top: 100px;
  }

  .direct-info {
    position: static;
    margin-top: 8px;
    font-size: 11px;
  }

  .direct-dot {
    position: static;
    display: inline-block;
    margin-right: 0.4em;
    vertical-align: 0.12em;
  }
}
</style>
