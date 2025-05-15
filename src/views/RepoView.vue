<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGithubStore } from './../stores/github'
import type { Repository } from './../types/github'
import { useRouter } from 'vue-router'

//Passing the username from the parent component (HomeView.vue)
const props = defineProps<{
  username: string
}>()

const store = useGithubStore()
// const route = useRoute()
const router = useRouter()
const selectedRepo = ref<Repository | null>(null)
// const sortOrder = ref<'newest' | 'oldest'>('newest')

onMounted(async () => {
//Getting all the repos that belong to the passed username
  await store.fetchRepositories(props.username)
})

//Navigates to the selected repo
const handleRepoSelect = async (repo: Repository) => {
  router.push(`/repos/${props.username}/${repo.name}/commits`)
}
</script>

<template>
  <div class="repo-view">
    <h1>{{ username }}'s Repositories</h1>
    
    <div class="repositories">
      <div v-if="store.loading" class="loading">Loading...</div>
      <div v-else-if="store.error" class="error">
        <h3>{{ store.error.message }}</h3>
        <p>{{ store.error.details }}</p>
      </div>
      <div v-else class="repo-list">
        <div
          v-for="repo in store.repositories"
          :key="repo.id"
          class="repo-card"
          :class="{ selected: selectedRepo?.id === repo.id }"
          @click="handleRepoSelect(repo)"
        >
          <h3>{{ repo.name }}</h3>
          <p>{{ repo.description || 'No description' }}</p>
          <div class="repo-meta">
            <span v-if="repo.language" class="language">{{ repo.language }}</span>
            <span class="stars">⭐ {{ repo.stargazers_count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.repo-view {
  width: 100%;
  min-height: 100%;
  padding: 0;
}

h1 {
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 2rem;
}

.repositories {
  width: 100%;
}

.repo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
  width: 100%;
}

.repo-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.repo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.repo-card.selected {
  border: 2px solid #42b883;
}

.repo-card h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.repo-card p {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
  flex: 1;
}

.repo-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  margin-top: auto;
}

.language {
  color: #42b883;
  font-weight: 500;
}

.stars {
  color: #f1c40f;
  font-weight: 500;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
  color: #666;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.error {
  color: #e74c3c;
}

.error h3 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.error p {
  color: #666;
  font-size: 0.9rem;
}
</style> 