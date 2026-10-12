import fondo4 from './assets/fondo4.webp'

// Páginas internas. El router crea una ruta por cada una.
// bg: fondo de la página (opcional). img: foto de su galería.
// Opcionales para fondos que no son textura:
//   bgColor: color debajo del fondo. bgSize: 'contain' lo muestra completo
//   (por defecto cubre la pantalla). light: fondo claro. projects: galería de direct.
//   stills: galería de Stills. contact: datos de contacto.
//   manifesto: página del manifiesto.
export default [
  {
    name: 'fotos',
    to: '/fotos',
    // Stills: proyectos con portadas que se revelan y manos que los despliegan
    bgColor: '#ffffff',
    light: true,
    stills: true,
    img: '/fotosimg.jpg'
  },
  {
    name: 'direct',
    to: '/direct',
    // Blanco puro, como la galería de referencia
    bgColor: '#ffffff',
    light: true,
    // Galería de proyectos con notas a mano
    projects: true,
    img: '/directimg.jpg'
  },
  { name: 'redes', to: '/redes', bg: fondo4, img: '/redesimg.jpeg' },
  {
    name: 'bio',
    to: '/bio',
    // Manifiesto: dos textos y una foto en diagonal sobre blanco
    bgColor: '#ffffff',
    light: true,
    manifesto: true,
    img: '/bioimg.jpg'
  },
  {
    name: 'contacto',
    to: '/contacto',
    // Teléfono, Instagram y correo en escalera sobre blanco
    bgColor: '#ffffff',
    light: true,
    contact: true,
    img: '/contactimg.jpg'
  }
]
