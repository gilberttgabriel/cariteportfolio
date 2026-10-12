const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // Sin mapas de código en producción: no los necesita el visitante y
  // pesan casi 1 MB
  productionSourceMap: false
})
