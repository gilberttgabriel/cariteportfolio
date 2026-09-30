import fondo2 from './assets/fondo2.webp'
import fondo3 from './assets/fondo3.webp'
import fondo4 from './assets/fondo4.webp'

// Páginas internas. El router crea una ruta por cada una.
// bg: fondo de la página (opcional). img: foto de su galería.
export default [
  { name: 'fotos', to: '/fotos', bg: fondo3, img: '/fotosimg.jpg' },
  { name: 'direct', to: '/direct', bg: fondo2, img: '/directimg.jpg' },
  { name: 'redes', to: '/redes', bg: fondo4, img: '/redesimg.jpeg' },
  { name: 'bio', to: '/bio', img: '/bioimg.jpg' },
  { name: 'contacto', to: '/contacto', img: '/contactimg.jpg' }
]
