<template>
  <div
    class="page section"
    :class="{ 'section-plain': !bg }"
    :style="bg && { backgroundImage: `url(${bg})` }"
  >
    <div class="grid">
      <figure v-for="n in PHOTO_COUNT" :key="n" class="cell">
        <span class="cell-number">{{ String(n).padStart(2, '0') }}.</span>
        <img class="cell-img" :src="img" alt="">
      </figure>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SectionView',
  props: {
    // Sin fondo, la página queda en blanco hueso
    bg: { type: String, default: null },
    img: { type: String, required: true }
  },
  data() {
    return {
      PHOTO_COUNT: 8
    }
  }
}
</script>

<style>
.section {
  background-color: #f4f1ea;
}

/* Sin foto de fondo, los números van en negro para que se lean */
.section-plain .cell-number {
  color: #1a1a1a;
  text-shadow: none;
}

/* Cuadrícula de 4 × 2 centrada en la pantalla. --cell es el ancho de cada
   celda: se limita por el alto de la pantalla para que no choque con el header */
.grid {
  --cell: min(20vw, 32vh);
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, var(--cell));
  grid-auto-rows: calc(var(--cell) * 0.8);
  justify-content: center;
  align-content: center;
  gap: 2vw;
}

.cell {
  position: relative;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Número de la foto, arriba a la izquierda de su celda */
.cell-number {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 0.75rem;
  color: #ffffff;
  /* Sombra suave para que el número se lea sobre cualquier fondo */
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.cell-img {
  height: 70%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  display: block;
}

/* Pantallas angostas: 2 columnas × 4 filas */
@media (max-width: 700px) {
  .grid {
    --cell: min(42vw, 20vh);
    grid-template-columns: repeat(2, var(--cell));
    gap: 3vw;
  }
}
</style>
