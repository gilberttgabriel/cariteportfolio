import fondo3 from './assets/fondo3.webp'
import fondo4 from './assets/fondo4.webp'
import directTrazo from './assets/direct-trazo.png'

// Páginas internas. El router crea una ruta por cada una.
// bg: fondo de la página (opcional). img: foto de su galería.
// Opcionales para fondos que no son textura:
//   bgColor: color debajo del fondo. bgSize: 'contain' lo muestra completo
//   (por defecto cubre la pantalla). light: fondo claro. projects: muestra la vista de proyectos.
export default [
  { name: 'fotos', to: '/fotos', bg: fondo3, img: '/fotosimg.jpg' },
  {
    name: 'direct',
    to: '/direct',
    // Trazo del diagrama (sin el papel) sobre blanco perla
    bg: directTrazo,
    bgColor: '#f0ece2',
    bgSize: 'contain',
    light: true,
    // Vista de proyectos (tiras de fotos)
    projects: true,
    img: '/directimg.jpg'
  },
  { name: 'redes', to: '/redes', bg: fondo4, img: '/redesimg.jpeg' },
  { name: 'bio', to: '/bio', img: '/bioimg.jpg' },
  { name: 'contacto', to: '/contacto', img: '/contactimg.jpg' }
]
