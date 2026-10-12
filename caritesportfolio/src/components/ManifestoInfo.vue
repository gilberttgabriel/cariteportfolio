<template>
  <!-- Manifiesto: foto al centro y dos textos en diagonal que se acoplan a su
       forma. El primero rodea la esquina de arriba a la izquierda de la foto y
       el segundo la de abajo a la derecha: unos flotantes invisibles del
       tamaño de la foto hacen que las líneas se corten justo en su borde -->
  <div ref="root" class="manifesto" :style="rootStyle">
    <img class="manifesto-photo" :src="photo" alt="" decoding="async" :style="photoStyle">

    <p ref="text1" class="manifesto-text manifesto-text--1" :style="box1">
      <span class="manifesto-cut manifesto-cut--spacer" :style="{ height: cut1.top + 'px' }"></span>
      <span class="manifesto-cut manifesto-cut--right" :style="{ width: cut1.width + 'px', height: cut1.height + 'px' }"></span>
      <span class="manifesto-dot manifesto-dot--start"></span>{{ texts[0] }}<span ref="end1"></span>
    </p>

    <p ref="text2" class="manifesto-text manifesto-text--2" :style="box2">
      <span class="manifesto-cut manifesto-cut--left" :style="{ width: cut2.width + 'px', height: cut2.height + 'px' }"></span>
      {{ texts[1] }}<span class="manifesto-dot"></span>
    </p>
  </div>
</template>

<script>
// Espacio entre el texto y el borde de la foto, en px
const GAP = 14
// Espera tras el último cambio de tamaño de la ventana antes de recalcular
const RESIZE_DELAY_MS = 150
// Dónde empieza cada texto (en % de la pantalla) y dónde termina el segundo
const TEXT1_LEFT = 0.2
const TEXT1_TOP = 0.25
const TEXT2_TOP = 0.53
const TEXT2_RIGHT = 0.82
const MOBILE_QUERY = '(max-width: 700px)'
// Foto (deben coincidir con .manifesto-photo): alto en % de la pantalla,
// ancho / alto, y centro vertical
const PHOTO_HEIGHT = 0.3
const PHOTO_RATIO = 4 / 5
const PHOTO_CENTER_Y = 0.52
// Celular: ancho de la foto en proporción al ancho del texto
const MOBILE_PHOTO_WIDTH = 0.36

export default {
  name: 'ManifestoInfo',
  data() {
    return {
      // Retrato provisorio
      photo: '/direct/3.jpg',
      // Textos provisorios
      texts: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem.'
      ],
      // Cajas de los textos y recortes (calculados según la foto)
      box1: {},
      box2: {},
      // Solo en celular: posición de la foto y alto total de la página
      photoStyle: {},
      rootStyle: {},
      cut1: { top: 0, width: 0, height: 0 },
      cut2: { width: 0, height: 0 }
    }
  },
  mounted() {
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
  },
  beforeUnmount() {
    clearTimeout(this.resizeTimer)
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    // Celular: misma idea que en computadora, en una página que se desplaza.
    // La foto (más chica, al centro) se ubica donde termina el texto 1, de modo
    // que este rodee su mitad de arriba por la izquierda; el texto 2 rodea su
    // mitad de abajo por la derecha y sigue a todo el ancho por debajo
    async layoutMobile() {
      const root = this.$refs.root
      const cs = getComputedStyle(root)
      const padL = parseFloat(cs.paddingLeft)
      const padT = parseFloat(cs.paddingTop)
      const padB = parseFloat(cs.paddingBottom)
      const W = root.clientWidth - padL - parseFloat(cs.paddingRight)
      const pw = W * MOBILE_PHOTO_WIDTH
      const ph = pw / PHOTO_RATIO
      const px = padL + (W - pw) / 2
      const full = { left: padL + 'px', width: W + 'px' }

      // Texto 1 arriba, a todo el ancho; el recorte deja el lugar de la foto
      // desde photoTop. Se baja photoTop de a una línea hasta que el texto
      // termine a la altura de la mitad de la foto (cuanto más abajo está el
      // recorte, más líneas anchas hay y antes termina el texto)
      const line = parseFloat(getComputedStyle(this.$refs.text1).lineHeight) || 16
      this.box1 = { ...full, top: padT + 'px' }
      let photoTop = padT
      for (let i = 0; i < 60; i++) {
        this.cut1 = { top: photoTop - padT, width: padL + W - px + GAP, height: ph + GAP }
        await this.$nextTick()
        // Fin real del texto: la marca después de la última palabra (el alto
        // del párrafo no sirve porque incluye los flotantes del recorte)
        const mark = this.$refs.end1
        const end = padT + mark.offsetTop + mark.offsetHeight
        if (end - photoTop <= ph / 2) break
        photoTop += line
      }
      this.photoStyle = { left: px + 'px', top: photoTop + 'px', width: pw + 'px', height: ph + 'px' }

      // Texto 2 desde la mitad de la foto, a su derecha y luego por debajo
      const top2 = photoTop + ph / 2 + 6
      this.box2 = { ...full, top: top2 + 'px' }
      this.cut2 = { width: px + pw - padL + GAP, height: photoTop + ph - top2 + GAP }
      await this.$nextTick()
      const bottom = Math.max(top2 + this.$refs.text2.offsetHeight, photoTop + ph)
      this.rootStyle = { height: bottom + padB + 'px' }
    },
    // Ubica los textos alrededor de la foto y calcula los recortes
    layout() {
      const root = this.$refs.root
      if (!root) return
      if (this.media.matches) {
        this.layoutMobile()
        return
      }
      this.photoStyle = {}
      this.rootStyle = {}
      // La caja de la foto sale de las mismas medidas del CSS (.manifesto-photo):
      // medirla en pantalla fallaría durante el zoom de entrada del sitio
      const W = root.clientWidth
      const H = root.clientHeight
      const ph = H * PHOTO_HEIGHT
      const pw = ph * PHOTO_RATIO
      const photoBox = {
        left: W / 2 - pw / 2,
        top: H * PHOTO_CENTER_Y - ph / 2,
        right: W / 2 + pw / 2,
        bottom: H * PHOTO_CENTER_Y + ph / 2
      }
      const center = (photoBox.left + photoBox.right) / 2

      // Texto 1: desde la izquierda hasta el centro de la foto. Por encima de
      // la foto ocupa todo el ancho; a su altura, se corta en su borde izquierdo
      const left1 = W * TEXT1_LEFT
      const top1 = H * TEXT1_TOP
      this.box1 = { left: left1 + 'px', top: top1 + 'px', width: center - left1 + 'px' }
      this.cut1 = {
        top: Math.max(0, photoBox.top - top1),
        width: center - photoBox.left + GAP,
        height: photoBox.bottom - photoBox.top + GAP
      }

      // Texto 2: desde el centro de la foto hacia la derecha. A la altura de
      // la foto se corta en su borde derecho; debajo, ocupa todo el ancho
      const top2 = H * TEXT2_TOP
      this.box2 = { left: center + 'px', top: top2 + 'px', width: W * TEXT2_RIGHT - center + 'px' }
      this.cut2 = {
        width: photoBox.right - center + GAP,
        height: Math.max(0, photoBox.bottom - top2 + GAP)
      }
    }
  }
}
</script>

<style>
.manifesto {
  position: absolute;
  inset: 0;
}

.manifesto-text {
  position: absolute;
  margin: 0;
  font-family: 'Spectral', Georgia, 'Times New Roman', serif;
  font-size: clamp(12px, 1.15vw, 17px);
  line-height: 1.35;
  color: #1a1a1a;
}

/* Cada texto se alinea contra la foto para que el corte siga su borde */
.manifesto-text--1 {
  text-align: right;
}

.manifesto-text--2 {
  text-align: left;
}

/* Flotantes invisibles que dejan el lugar de la foto */
.manifesto-cut {
  display: block;
}

.manifesto-cut--spacer {
  float: right;
  width: 1px;
  margin-right: -1px;
}

.manifesto-cut--right {
  float: right;
  clear: right;
}

.manifesto-cut--left {
  float: left;
}

/* Foto al centro */
.manifesto-photo {
  position: absolute;
  left: 50%;
  top: 52%;
  translate: -50% -50%;
  height: 30%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  /* Encuadre en la cara y el torso */
  object-position: 60% 20%;
  display: block;
}

.manifesto-dot {
  display: inline-block;
  width: 0.55em;
  height: 0.55em;
  margin-left: 0.5em;
  border-radius: 50%;
  background: #e8251b;
  vertical-align: 0.05em;
}

.manifesto-dot--start {
  margin: 0 0.5em 0 0;
}

/* Celular: la página se desplaza; las posiciones y el alto los calcula
   layoutMobile, con la foto al centro y los textos rodeándola */
@media (max-width: 700px) {
  .manifesto {
    position: relative;
    inset: auto;
    padding: 110px 20px 60px;
  }

  .manifesto-photo {
    translate: none;
  }

  .manifesto-text {
    font-size: 12px;
    line-height: 1.35;
  }
}
</style>
