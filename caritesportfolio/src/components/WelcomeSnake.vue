<template>
  <div class="snake">
    <canvas ref="canvas" class="snake-canvas"></canvas>
    <div class="snake-hud">
      
      <p class="snake-score">{{ score }} / {{ GOAL }}</p>
    </div>
  </div>
</template>

<script>
// Snake del welcome: al llegar a GOAL puntos emite "win" y se entra al sitio.
// El tablero ocupa toda la pantalla sobre el video, con fondo transparente.
// Sin paredes: al salir por un borde entra por el opuesto. Empieza solo y
// chocar con la propia cola reinicia la partida
const GOAL = 5
const CELLS = 26 // casillas del lado más corto de la pantalla
const TICK_MS = 110 // velocidad: un paso cada TICK_MS
const COLOR = '#ff3700' // rojo

const DIRS = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
}

export default {
  name: 'WelcomeSnake',
  emits: ['win'],
  data() {
    return {
      GOAL,
      score: 0,
    }
  },
  mounted() {
    this.resize()
    this.reset()
    this.start()
    window.addEventListener('resize', this.resize)
    window.addEventListener('keydown', this.onKey)
    this.$el.addEventListener('touchstart', this.onTouchStart, { passive: true })
    this.$el.addEventListener('touchmove', this.onTouchMove, { passive: false })
  },
  beforeUnmount() {
    clearInterval(this.loop)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
    // El tablero ocupa la pantalla entera: CELLS casillas en el lado corto
    // y las que entren en el largo, estiradas apenas para llegar al borde
    resize() {
      const canvas = this.$refs.canvas
      const w = window.innerWidth
      const h = window.innerHeight
      const size = Math.min(w, h) / CELLS
      this.cols = Math.round(w / size)
      this.rows = Math.round(h / size)
      this.cw = w / this.cols
      this.ch = h / this.rows
      canvas.width = w
      canvas.height = h
      if (this.snake) {
        // Si la víbora queda fuera del nuevo tablero, se reinicia
        const out = this.snake.some(([x, y]) => x >= this.cols || y >= this.rows)
        if (out) this.reset()
        else if (this.food[0] >= this.cols || this.food[1] >= this.rows) this.placeFood()
      }
      this.draw()
    },
    reset() {
      const x = Math.floor(this.cols / 2)
      const y = Math.floor(this.rows / 2)
      this.snake = [[x, y], [x - 1, y], [x - 2, y]]
      this.dir = [1, 0]
      this.queue = []
      this.score = 0
      this.placeFood()
      this.draw()
    },
    placeFood() {
      let spot
      do {
        spot = [Math.floor(Math.random() * this.cols), Math.floor(Math.random() * this.rows)]
      } while (this.snake.some(([x, y]) => x === spot[0] && y === spot[1]))
      this.food = spot
    },
    start() {
      clearInterval(this.loop)
      this.loop = setInterval(this.step, TICK_MS)
    },
    // Encola un cambio de dirección (máx. 2, para giros rápidos) sin permitir
    // dar media vuelta sobre la propia cola
    turn(next) {
      const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir
      if (next[0] === -last[0] && next[1] === -last[1]) return
      if (next[0] === last[0] && next[1] === last[1]) return
      if (this.queue.length < 2) this.queue.push(next)
    },
    step() {
      if (this.queue.length) this.dir = this.queue.shift()
      const [hx, hy] = this.snake[0]
      // Atraviesa los bordes de la pantalla
      const head = [
        (hx + this.dir[0] + this.cols) % this.cols,
        (hy + this.dir[1] + this.rows) % this.rows
      ]
      const ate = head[0] === this.food[0] && head[1] === this.food[1]
      // La cola se mueve en este paso, salvo que coma
      const body = ate ? this.snake : this.snake.slice(0, -1)
      if (body.some(([x, y]) => x === head[0] && y === head[1])) {
        this.reset()
        return
      }
      this.snake = [head, ...body]
      if (ate) {
        this.score++
        if (this.score >= GOAL) {
          clearInterval(this.loop)
          this.draw()
          this.$emit('win')
          return
        }
        this.placeFood()
      }
      this.draw()
    },
    // Dibuja en píxeles: cada casilla es un cuadrado con un borde de separación
    draw() {
      const canvas = this.$refs.canvas
      if (!canvas || !this.snake) return
      const ctx = canvas.getContext('2d')
      const { cw, ch } = this
      const gap = Math.max(1, Math.round(Math.min(cw, ch) / 8))
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = COLOR
      this.snake.forEach(([x, y]) => {
        ctx.fillRect(Math.round(x * cw) + gap, Math.round(y * ch) + gap, Math.round(cw) - gap * 2, Math.round(ch) - gap * 2)
      })
      // Comida: un cuadrado hueco
      const [fx, fy] = this.food
      ctx.strokeStyle = COLOR
      ctx.lineWidth = gap * 2
      ctx.strokeRect(Math.round(fx * cw) + gap * 2, Math.round(fy * ch) + gap * 2, Math.round(cw) - gap * 4, Math.round(ch) - gap * 4)
    },
    onKey(e) {
      const next = DIRS[e.key]
      if (!next) return
      e.preventDefault()
      this.turn(next)
    },
    onTouchStart(e) {
      const t = e.touches[0]
      this.touch = [t.clientX, t.clientY]
    },
    // Deslizar el dedo cambia la dirección
    onTouchMove(e) {
      e.preventDefault()
      if (!this.touch) return
      const t = e.touches[0]
      const dx = t.clientX - this.touch[0]
      const dy = t.clientY - this.touch[1]
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
      this.turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)])
      this.touch = [t.clientX, t.clientY]
    }
  }
}
</script>

<style>
.snake {
  position: absolute;
  inset: 0;
  display: flex;
  touch-action: none;
}

.snake-canvas {
  display: block;
  image-rendering: pixelated;
}

/* Textos en letra pixelada, verde como el juego */
.snake-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: calc(28px + env(safe-area-inset-top, 0px)) 16px calc(28px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  color: #ff3700;
  text-transform: uppercase;
  -webkit-font-smoothing: none;
}

.snake-hud p {
  margin: 0;
}

.snake-goal {
  font-size: clamp(9px, 1.4vw, 14px);
  letter-spacing: 0.1em;
}

.snake-score {
  font-size: clamp(12px, 2vw, 20px);
  letter-spacing: 0.2em;
}

</style>
