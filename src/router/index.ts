import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import RepoView from '@/views/RepoView.vue'
import CommitsView from '@/views/CommitsView.vue'
import CommitView from '@/views/CommitView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/repos/:username',
      name: 'repos',
      component: RepoView,
      props: true
    },
    {
      path: '/repos/:username/:repo/commits',
      name: 'commits',
      component: CommitsView,
      props: true
    },
    {
      path: '/repos/:username/:repo/commits/:sha',
      name: 'commit',
      component: CommitView,
      props: true
    }
  ]
})

export default router 