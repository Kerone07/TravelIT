<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const showBackButton = computed(() => {
  return route.name === 'commits' || route.name === 'commit'
})

const backButtonText = computed(() => {
  if (route.name === 'commit') {
    return '← Commits'
  }
  if (route.name === 'commits') {
    return '← Repositories'
  }
  return ''
})

//Routing
const handleBack = () => {
  if (route.name === 'commit') {
    router.push(`/repos/${route.params.username}/${route.params.repo}/commits`)
  } else if (route.name === 'commits') {
    router.push(`/repos/${route.params.username}`)
  }
}

const showHomeButton = computed(() => route.name !== 'home')

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="nav-controls">
        <div class="left-controls">
          <button v-if="showBackButton" @click="handleBack" class="nav-button">
            {{ backButtonText }}
          </button>
        </div>
        <div class="right-controls">
          <button v-if="showHomeButton" @click="goHome" class="nav-button">
            🏠 Home
          </button>
        </div>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.app-header {
  background-color: white;
  padding: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.nav-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 0.75rem;
}

.left-controls, .right-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-button {
  background: none;
  border: none;
  color: #2c3e50;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background-color: #f8f9fa;
}

.main-content {
  flex: 1;
  width: 100%;
  padding: 0.75rem;
  box-sizing: border-box;
}

/* Reset default margins and padding */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
}

/* Add a max-width container for content */
.repo-view,
.commits-view,
.commit-view {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
</style>
