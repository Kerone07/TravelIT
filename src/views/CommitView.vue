<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGithubStore } from './../stores/github'

const route = useRoute()
const store = useGithubStore()

const username = route.params.username as string
const repoName = route.params.repo as string
const commitSha = route.params.sha as string

onMounted(async () => {
  await store.fetchCommitDetails(username, repoName, commitSha)
})

const toggleFavorite = () => {
  const commitId = `${username}/${repoName}/${commitSha}`
  if (store.isFavorite(commitId)) {
    store.removeFromFavorites(commitId)
  } else if (store.selectedCommit) {
    store.addToFavorites(username, repoName, store.selectedCommit)
  }
}
</script>

<template>
  <div class="commit-view">
    <div v-if="store.loading" class="loading">Loading commit details...</div>
    <div v-else-if="store.error" class="error">
      <h3>{{ store.error.message }}</h3>
      <p>{{ store.error.details }}</p>
    </div>
    <div v-else-if="store.selectedCommit" class="commit-content">
      <div class="commit-header">
        <h1>{{ store.selectedCommit.commit.message.split('\n')[0] }}</h1>
        <button
          class="favorite-button"
          :class="{ active: store.isFavorite(`${username}/${repoName}/${commitSha}`) }"
          @click="toggleFavorite"
        >
          ⭐
        </button>
      </div>

      <div class="commit-meta">
        <p>
          {{ new Date(store.selectedCommit.commit.author.date).toLocaleString() }} by {{ store.selectedCommit.commit.author.name }}
        </p>
        <div class="commit-stats">
          <span class="additions">+{{ store.totalStats?.additions || 0 }}</span>
          <span class="deletions">-{{ store.totalStats?.deletions || 0 }}</span>
        </div>
      </div>

      <div class="commit-message">
        <pre>{{ store.selectedCommit.commit.message }}</pre>
      </div>

      <div class="commit-files">
        <h2>Changed Files</h2>
        <div v-for="file in store.selectedCommit.files" :key="file.filename" class="file-change">
          <span class="filename">{{ file.filename }}</span>
          <div class="stats">
            <span class="additions">+{{ file.additions }}</span>
            <span class="deletions">-{{ file.deletions }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.commit-view {
  width: 100%;
  min-height: 100%;
  padding: 0;
}

.commit-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.commit-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
  line-height: 1.4;
}

.favorite-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  padding: 0.25rem;
}

.favorite-button.active {
  opacity: 1;
  color: #f1c40f;
}

.commit-meta {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.commit-meta p {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 1rem;
}

.commit-stats {
  display: flex;
  gap: 1rem;
  font-size: 1.1rem;
  font-weight: 500;
}

.commit-message {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.commit-message pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #2c3e50;
}

.commit-files {
  margin-top: 2rem;
}

.commit-files h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.file-change {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.filename {
  margin: 0;
  font-family: monospace;
  font-size: 0.9rem;
  color: #2c3e50;
}

.stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.additions {
  color: #2ecc71;
}

.deletions {
  color: #e74c3c;
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