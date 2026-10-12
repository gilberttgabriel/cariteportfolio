// Versiones livianas (-800) de las imágenes, para que el celular no descargue
// las grandes. Para cada imagen: [ancho de la versión chica, ancho original].
// Se generan junto a la original: /direct/1.jpg → /direct/1-800.jpg
const WIDTHS = {
  '/direct/1.jpg': [450, 900],
  '/direct/2.jpg': [800, 1600],
  '/direct/3.jpg': [600, 1201],
  '/direct/4.jpg': [600, 1201],
  '/fotosimg.jpg': [533, 1080],
  '/contactimg.jpg': [593, 1065],
  '/redesimg.jpeg': [707, 798],
  '/directimg.jpg': [533, 829]
}

// srcset de una imagen, o undefined si no tiene versión liviana
export function srcset(src) {
  const widths = WIDTHS[src]
  if (!widths) return undefined
  const small = src.replace(/\.\w+$/, '-800.jpg')
  return `${small} ${widths[0]}w, ${src} ${widths[1]}w`
}
