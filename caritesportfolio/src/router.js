import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import SectionView from './views/SectionView.vue'
import sections from './sections'

// Una ruta por cada sección con página; cada una recibe su fondo y su foto como props
const routes = [
  { path: '/', name: 'home', component: HomeView },
  ...sections
    .filter((s) => s.to)
    .map((s) => ({ path: s.to, name: s.name, component: SectionView, props: { bg: s.bg, bgColor: s.bgColor, bgSize: s.bgSize, light: s.light, img: s.img, projects: s.projects } }))
]

export default createRouter({
  history: createWebHistory(),
  routes
})
