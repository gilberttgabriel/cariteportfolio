<template>
  <!-- Manifiesto: dos textos que son las esquinas de una esfera con la foto
       en el centro: el primero arriba a la izquierda y el segundo abajo a la
       derecha. Las líneas se arman a mano: su borde de afuera sigue el arco
       del círculo y el de adentro, el de la foto. La letra se ajusta sola -->
  <div ref="root" class="manifesto" :style="rootStyle">
    <img class="manifesto-photo" :src="photo" :srcset="srcset(photo)" sizes="(max-width: 700px) 36vw, 20vw" alt="" decoding="async" :style="photoStyle">
    <p class="manifesto-sphere" :style="{ fontSize: fontSize + 'px' }" :aria-label="fullText">
      <span
        v-for="(w, i) in placed"
        :key="i"
        :class="w.dot ? 'manifesto-dot' : 'manifesto-word'"
        :style="{ left: w.x + 'px', top: w.y + 'px' }"
        aria-hidden="true"
      >{{ w.dot ? '' : w.text }}</span>
    </p>
  </div>
</template>

<script>
import { srcset } from '../images'

// Diámetro del círculo en computadora: el menor entre % del alto y % del
// ancho de la pantalla. En celular: el ancho menos este margen a cada lado (px)
const DESKTOP_DIAMETER = { vh: 0.84, vw: 0.6 }
const MOBILE_SIDE = 10
// Foto en el centro: ancho en proporción al diámetro (computadora / celular)
// y relación ancho / alto
const PHOTO_WIDTH = { desktop: 0.3, mobile: 0.26 }
const PHOTO_RATIO = 4 / 5
// Espacio entre el texto y la foto, en px
const GAP = 4
// Alto de línea en proporción a la letra
const LINE = 1.3
// Justificado: si el espacio entre palabras pasaría de esto (en espacios
// normales), no se estira y el tramo se alinea al borde del círculo
const MAX_GAP = 3
// Por encima (y por debajo) de la foto, cuánto se mete el texto sobre ella,
// en proporción a su ancho
const CORNER_OVERLAP = 0.3
// Cuánto baja la primera esquina (y sube la segunda) pasando la mitad de la
// foto, en proporción a su alto
const CORNER_REACH = 0.18
// Tramos más angostos que esto (en letras) se dejan vacíos
const MIN_SEGMENT_EM = 2.2
// Rango de tamaños de letra que se prueban para llenar el círculo
const FONT_MIN = 6
const FONT_MAX = 26
const FONT = "'Spectral', Georgia, 'Times New Roman', serif"
const MOBILE_QUERY = '(max-width: 700px)'
// Tolerancia de redondeo al comparar bordes, en px
const EPS = 0.5
// Espera tras el último cambio de tamaño de la ventana antes de recalcular
const RESIZE_DELAY_MS = 150

export default {
  name: 'ManifestoInfo',
  data() {
    return {
      // Retrato provisorio
      photo: '/direct/3.jpg',
      // Textos provisorios (se leen seguidos, como un solo texto)
      texts: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem.'
      ],
      fontSize: 14,
      placed: [],
      photoStyle: {},
      rootStyle: {}
    }
  },
  computed: {
    fullText() {
      return this.texts.join(' ')
    }
  },
  async mounted() {
    this.media = window.matchMedia(MOBILE_QUERY)
    // Solo se recalcula si cambia el ancho: en celular, al hacer scroll la
    // barra del navegador aparece y desaparece y dispara resize sin parar
    this.lastWidth = window.innerWidth
    this.onResize = () => {
      if (window.innerWidth === this.lastWidth) return
      this.lastWidth = window.innerWidth
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(this.layout, RESIZE_DELAY_MS)
    }
    window.addEventListener('resize', this.onResize)
    this.layout()
    // Las medidas de las palabras dependen de la letra: al terminar de
    // cargar Spectral se vuelve a acomodar
    if (document.fonts && document.fonts.load) {
      document.fonts.load(`16px ${FONT}`).then(() => this.layout(), () => {})
    }
  },
  beforeUnmount() {
    clearTimeout(this.resizeTimer)
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    srcset,
    layout() {
      const root = this.$refs.root
      if (!root) return
      const mobile = this.media.matches
      const W = root.clientWidth
      const view = root.parentElement.clientHeight
      const D = mobile
        ? W - MOBILE_SIDE * 2
        : Math.min(view * DESKTOP_DIAMETER.vh, W * DESKTOP_DIAMETER.vw)
      // Círculo centrado en la pantalla (un poco más abajo en computadora,
      // por el ícono); en celular empieza bajo el ícono si no entra
      const top = mobile ? Math.max(100, (view - D) / 2) : (view - D) / 2 + view * 0.03
      const circle = { cx: W / 2, cy: top + D / 2, r: D / 2 }
      const pw = D * (mobile ? PHOTO_WIDTH.mobile : PHOTO_WIDTH.desktop)
      const ph = pw / PHOTO_RATIO
      const photo = {
        left: circle.cx - pw / 2,
        right: circle.cx + pw / 2,
        top: circle.cy - ph / 2,
        bottom: circle.cy + ph / 2
      }
      this.photoStyle = {
        left: photo.left + 'px',
        top: photo.top + 'px',
        width: pw + 'px',
        height: ph + 'px'
      }
      this.rootStyle = mobile ? { height: Math.max(view, top + D + 60) + 'px' } : {}

      // Las dos esquinas de la esfera. Cada una da, para una línea entre y e
      // y + lh, el tramo [desde, hasta] que puede ocupar (o null)
      const half = (y, lh) => {
        const dy = Math.max(Math.abs(y - circle.cy), Math.abs(y + lh - circle.cy))
        return dy >= circle.r ? null : Math.sqrt(circle.r * circle.r - dy * dy)
      }
      const over = pw * CORNER_OVERLAP
      const corners = [
        {
          // Arriba a la izquierda: borde izquierdo en el arco; por encima de la
          // foto llega un poco sobre ella, a su altura se corta en su borde
          from: circle.cy - circle.r,
          to: circle.cy + ph * CORNER_REACH,
          bounds: (y, lh) => {
            const h = half(y, lh)
            if (h === null) return null
            const besidePhoto = y + lh > photo.top - GAP + EPS
            return [circle.cx - h, besidePhoto ? photo.left - GAP : photo.left + over]
          },
          inner: 'right',
          // Una línea termina justo donde empieza la foto (sin hueco encima)
          align: photo.top - GAP
        },
        {
          // Abajo a la derecha: el espejo
          from: circle.cy - ph * CORNER_REACH,
          to: circle.cy + circle.r,
          bounds: (y, lh) => {
            const h = half(y, lh)
            if (h === null) return null
            const besidePhoto = y < photo.bottom + GAP - EPS
            return [besidePhoto ? photo.right + GAP : photo.right - over, circle.cx + h]
          },
          inner: 'left',
          // Una línea empieza justo donde termina la foto (sin hueco debajo)
          align: photo.bottom + GAP
        }
      ]
      const tokens = [
        [{ dot: true }, ...this.texts[0].split(/\s+/).map((text) => ({ text }))],
        [...this.texts[1].split(/\s+/).map((text) => ({ text })), { dot: true }]
      ]
      const ctx = (this.canvas || (this.canvas = document.createElement('canvas'))).getContext('2d')

      // La letra más grande con la que cada texto entra en su esquina; las
      // dos usan la menor, para que tengan el mismo tamaño
      const fit = (i) => {
        let lo = FONT_MIN
        let hi = FONT_MAX
        for (let n = 0; n < 12; n++) {
          const mid = (lo + hi) / 2
          if (this.flow(tokens[i], ctx, mid, corners[i])) lo = mid
          else hi = mid
        }
        return lo
      }
      const size = Math.min(fit(0), fit(1))
      const a = this.flow(tokens[0], ctx, size, corners[0]) || []
      const b = this.flow(tokens[1], ctx, size, corners[1]) || []
      this.fontSize = size
      this.placed = [...a, ...b]
    },
    // Acomoda las palabras en una esquina con letra de `size` px. Devuelve sus
    // posiciones, o null si no entran
    flow(tokens, ctx, size, corner) {
      ctx.font = `${size}px ${FONT}`
      const space = ctx.measureText(' ').width
      const dotSize = size * 0.42
      const dotWidth = size * 0.6
      const widths = tokens.map((t) => (t.dot ? dotWidth : ctx.measureText(t.text).width))
      const lh = size * LINE
      const minSeg = size * MIN_SEGMENT_EM

      // Tramos disponibles, línea por línea, de arriba a abajo. Las líneas se
      // corren para que un borde entre dos de ellas caiga en corner.align
      const shift = (((corner.align - corner.from) % lh) + lh) % lh
      const segments = []
      for (let y = corner.from + shift; y + lh <= corner.to + 0.01; y += lh) {
        const range = corner.bounds(y, lh)
        if (range && range[1] - range[0] >= minSeg) {
          segments.push({ x: range[0], w: range[1] - range[0], y })
        }
      }

      // Llena los tramos en orden; cada uno se justifica (salvo el último o
      // si quedaría muy estirado: ahí se pega al lado de la foto)
      const words = []
      let k = 0
      for (let s = 0; s < segments.length && k < tokens.length; s++) {
        const seg = segments[s]
        const start = k
        let used = 0
        while (k < tokens.length) {
          const add = (k > start ? space : 0) + widths[k]
          if (used + add > seg.w) {
            if (k === start) return null // una palabra no entra ni sola
            break
          }
          used += add
          k++
        }
        // Una línea con solo el punto rojo queda fea: se salta ese tramo
        if (k - start === 1 && tokens[start].dot && k < tokens.length) {
          k = start
          continue
        }
        const count = k - start
        const last = k >= tokens.length
        const textWidth = used - space * (count - 1)
        let gap = !last && count > 1 ? (seg.w - textWidth) / (count - 1) : space
        let x = seg.x
        if (last || gap > space * MAX_GAP) {
          gap = space
          const lineWidth = textWidth + space * (count - 1)
          if (corner.inner === 'right') x = seg.x + seg.w - lineWidth
        }
        for (let j = start; j < k; j++) {
          const t = tokens[j]
          words.push({
            ...t,
            // El punto rojo va centrado en su lugar, a la altura de las letras
            x: t.dot ? x + (dotWidth - dotSize) / 2 : x,
            y: t.dot ? seg.y + (lh - dotSize) / 2 + size * 0.05 : seg.y + (lh - size) / 2
          })
          x += widths[j] + gap
        }
      }
      return k >= tokens.length ? words : null
    }
  }
}
</script>

<style>
.manifesto {
  position: absolute;
  inset: 0;
}

.manifesto-photo {
  position: absolute;
  object-fit: cover;
  /* Encuadre en la cara y el torso */
  object-position: 60% 20%;
  display: block;
}

.manifesto-sphere {
  position: absolute;
  inset: 0;
  margin: 0;
  font-family: 'Spectral', Georgia, 'Times New Roman', serif;
  line-height: 1;
  color: #1a1a1a;
}

/* Cada palabra va en su lugar calculado */
.manifesto-word {
  position: absolute;
  white-space: nowrap;
}

.manifesto-dot {
  position: absolute;
  width: 0.42em;
  height: 0.42em;
  border-radius: 50%;
  background: #e8251b;
}

/* Celular: la página se desplaza (el alto lo calcula layout) */
@media (max-width: 700px) {
  .manifesto {
    position: relative;
    inset: auto;
  }
}
</style>
