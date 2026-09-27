import fondo2 from './assets/fondo2.webp'
import fondo3 from './assets/fondo3.webp'
import fondo4 from './assets/fondo4.webp'

// Secciones del inicio.
// Las que tienen `to` y `bg` son páginas: el router crea su ruta con ese fondo.
// x, y: dónde va el centro de cada imagen en el inicio, en % del ancho y alto
// de la pantalla. Si un valor dejaría la imagen agrandada fuera de la
// pantalla, el inicio lo corrige solo.
// shape: forma de la imagen en el feed de celular ('wide' horizontal, 'tall' vertical).
export default [
  { name: 'fotos', img: '/fotosimg.jpg', to: '/fotos', bg: fondo3, x: 16, y: 30, shape: 'tall' },
  { name: 'direct', img: '/directimg.jpg', to: '/direct', bg: fondo2, x: 33, y: 64, shape: 'tall' },
  { name: 'redes', img: '/redesimg.jpeg', to: '/redes', bg: fondo4, x: 50, y: 34, shape: 'wide' },
  { name: 'contacto', img: '/contactimg.jpg', x: 67, y: 62, shape: 'tall' },
  { name: 'bio', img: '/bioimg.jpg', x: 84, y: 28, shape: 'wide' }
]
