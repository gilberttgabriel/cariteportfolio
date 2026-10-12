<template>
  <!-- Contacto: tres líneas en escalera, centradas en la pantalla, con un
       punto rojo antes del teléfono y otro después del correo -->
  <div class="contact">
    <div class="contact-lines">
      <!-- Teléfono: abre el chat de WhatsApp -->
      <a
        class="contact-line"
        :href="'https://wa.me/' + phone.replace(/\D/g, '')"
        target="_blank"
        rel="noopener"
      >
        <span class="contact-dot"></span>{{ phone }}
      </a>
      <a
        class="contact-line contact-line--2"
        :href="'https://www.instagram.com/' + instagram"
        target="_blank"
        rel="noopener"
      >@{{ instagram }}</a>
      <!-- Correo: al hacer clic se copia la dirección; el punto rojo titila
           para confirmarlo, sin cambiar el texto ni el diseño -->
      <button
        type="button"
        class="contact-line contact-line--3"
        :class="{ 'is-copied': copied }"
        title="copiar correo"
        @click="copyEmail"
      >
        {{ email }}<span class="contact-dot"></span>
      </button>
    </div>
  </div>
</template>

<script>
// Cuánto titila el punto rojo tras copiar el correo (debe coincidir con la
// animación contact-copied)
const COPIED_MS = 1200

export default {
  name: 'ContactInfo',
  data() {
    return {
      phone: '+58 203 371 7652',
      instagram: 'snunezz_',
      email: 'santiagonuñez@lerolero.com',
      copied: false
    }
  },
  beforeUnmount() {
    clearTimeout(this.copyTimer)
  },
  methods: {
    // Copia el correo y hace titilar el punto rojo un momento
    async copyEmail() {
      try {
        await navigator.clipboard.writeText(this.email)
      } catch (e) {
        // Navegadores sin la API del portapapeles: método antiguo
        const field = document.createElement('textarea')
        field.value = this.email
        field.style.position = 'fixed'
        field.style.opacity = '0'
        document.body.appendChild(field)
        field.select()
        document.execCommand('copy')
        field.remove()
      }
      // Se reinicia la animación aunque se haga clic varias veces seguidas
      this.copied = false
      await this.$nextTick()
      this.copied = true
      clearTimeout(this.copyTimer)
      this.copyTimer = setTimeout(() => { this.copied = false }, COPIED_MS)
    }
  }
}
</script>

<style>
.contact {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Cada línea entra un poco más a la derecha que la anterior */
.contact-lines {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-family: 'Spectral', Georgia, 'Times New Roman', serif;
  font-size: clamp(12px, 1.25vw, 18px);
  line-height: 1.5;
  /* Corre el bloque a la izquierda para que la escalera quede centrada */
  margin-left: -6em;
}

.contact-line {
  position: relative;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  cursor: pointer;
  color: #1a1a1a;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 0.25s ease;
}

.contact-line:hover,
.contact-line:focus-visible {
  opacity: 0.6;
}

.contact-line--2 {
  margin-left: 7.4em;
}

.contact-line--3 {
  margin-left: 10.4em;
}

.contact-dot {
  display: inline-block;
  width: 0.62em;
  height: 0.62em;
  margin: 0 0.3em;
  border-radius: 50%;
  background: #e8251b;
  vertical-align: 0.02em;
}

.contact-line:first-child .contact-dot {
  margin-left: 0;
}

/* Confirmación de copiado: el punto titila tres veces, con cortes secos */
.contact-line.is-copied .contact-dot {
  animation: contact-copied 0.4s steps(1) 3;
}

@keyframes contact-copied {
  50% {
    visibility: hidden;
  }
}

/* Celular: sin el corrimiento, el bloque entra completo y centrado */
@media (max-width: 700px) {
  .contact-lines {
    margin-left: 0;
  }
}
</style>
