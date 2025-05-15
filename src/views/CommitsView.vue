<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGithubStore } from './../stores/github'
import type { Commit } from './../types/github'

const route = useRoute()
const router = useRouter()
const store = useGithubStore()

const username = computed(() => route.params.username as string)
const repoName = computed(() => route.params.repo as string)
const sortOrder = ref<'newest' | 'oldest'>('newest')
const showOnlyFavorites = ref(false)
const observerTarget = ref<HTMLElement | null>(null)

const hasFavorites = computed(() => {
  return store.commits.some(commit => 
    store.isFavorite(`${username.value}/${repoName.value}/${commit.sha}`)
  )
})

onMounted(async () => {
//Clear any commits in the store from any other previously selected repo
  store.resetCommits()
  //Fetch all the commits from the corrosponding repo passed from the route parameters
  await store.fetchCommits(username.value, repoName.value)
  
  //Setup intersection observer for infinite scroll from the dom
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !store.loading && store.hasMoreCommits) {
        loadMoreCommits()
      }
    },
    { threshold: 0.1 }
  )

  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }

  onUnmounted(() => {
    observer.disconnect()
  })
})

const sortedCommits = computed(() => {
  let commits = [...store.commits]
  
  //Filter favorites if needed and then only display the favourited commits.
  if (showOnlyFavorites.value) {
    //Filter function to find all the favourited commits that belong to the selected repo. Didn't use find, because there
    //could be more than one commit in the state array that is favourited and belongs to the selected repo.
    commits = commits.filter(commit =>
    //Checks if the state 'favourites' contains the commit by using the commit's id or sha encryption key
      store.isFavorite(`${username.value}/${repoName.value}/${commit.sha}`)
    )
  }
  
  //Sort by date. Default sort order is Newest to Oldest
  return sortOrder.value === 'newest'
    ? commits.sort((a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime())
    : commits.sort((a, b) => new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime())
})

//Navigates to the selected commit for further details and for the user to inspect.
const handleCommitClick = (commit: Commit) => {
  router.push(`/repos/${username.value}/${repoName.value}/commits/${commit.sha}`)
}

const toggleFavorite = (commit: Commit) => {
  const commitId = `${username.value}/${repoName.value}/${commit.sha}`
  if (store.isFavorite(commitId)) {
    store.removeFromFavorites(commitId)
    //If we're showing only favorites and this was the last one, reset the filter
    if (showOnlyFavorites.value && !hasFavorites.value) {
      showOnlyFavorites.value = false
    }
  } else {
    store.addToFavorites(username.value, repoName.value, commit)
  }
}

//Pagination function to get more commits if the Observer requests it
const loadMoreCommits = async () => {
  if (!store.loading && store.hasMoreCommits) {
    await store.fetchCommits(username.value, repoName.value, store.currentPage + 1)
  }
}
</script>

<template>
  <div class="commits-view">
    <div class="commits-header">
      <h1>Commits for {{ repoName }}</h1>
      <div class="commits-controls">
        <select v-model="sortOrder" class="sort-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <button 
          class="filter-button"
          :class="{ active: showOnlyFavorites }"
          @click="showOnlyFavorites = !showOnlyFavorites"
        >
          {{ showOnlyFavorites ? 'Show All' : 'Show Favorites' }}
        </button>
      </div>
    </div>

    <div class="commits-container">
      <div v-if="store.loading && !store.commits.length" class="loading">Loading...</div>
      <div v-else-if="store.error" class="error">
        <h3>{{ store.error.message }}</h3>
        <p>{{ store.error.details }}</p>
      </div>
      <div v-else class="commits-list">
        <div
          v-for="commit in sortedCommits"
          :key="commit.sha"
          class="commit-card"
          :class="{ selected: store.selectedCommit?.sha === commit.sha }"
          @click="handleCommitClick(commit)"
        >
          <div class="commit-header">
            <h3>{{ commit.commit.message.split('\n')[0] }}</h3>
            <button 
              class="favorite-button"
              :class="{ active: store.isFavorite(`${username}/${repoName}/${commit.sha}`) }"
              @click.stop="toggleFavorite(commit)"
            >
              ⭐
            </button>
          </div>
          <p class="commit-meta">
            {{ new Date(commit.commit.author.date).toLocaleString() }} by {{ commit.commit.author.name }}
          </p>
        </div>
      </div>

      <div v-if="store.hasMoreCommits && !store.loading" class="load-more">
        <button @click="loadMoreCommits" class="load-more-button">
          Load More
        </button>
      </div>
      <div v-if="store.loading && store.commits.length" class="loading-more">
        Loading more commits...
      </div>
    </div>

    <div v-if="store.selectedCommit" class="commit-details">
      <div class="commit-info">
        <h2>{{ store.selectedCommit.commit.message }}</h2>
        <p class="commit-meta">
          {{ new Date(store.selectedCommit.commit.author.date).toLocaleString() }} by {{ store.selectedCommit.commit.author.name }}
        </p>
        <div class="commit-stats">
          <span class="additions">+{{ store.totalStats?.additions || 0 }}</span>
          <span class="deletions">-{{ store.totalStats?.deletions || 0 }}</span>
        </div>
      </div>

      <div class="commit-files">
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
.commits-view {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
}

.commits-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.commits-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.sort-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
}

.filter-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.filter-button.active {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.commits-container {
  width: 100%;
}

.commits-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.commit-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.commit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.commit-card.selected {
  border: 2px solid #42b883;
}

.commit-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.commit-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.favorite-button {
  background: none;
  border: none;
  font-size: 1.2rem;
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
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
  color: #666;
}

.commit-details {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.commit-info {
  margin-bottom: 2rem;
}

.commit-info h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.commit-stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 1.1rem;
  font-weight: 500;
}

.commit-files {
  display: grid;
  gap: 1rem;
}

.file-change {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
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

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.load-more-button {
  padding: 0.75rem 2rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.load-more-button:hover {
  background: #3aa876;
}

.loading-more {
  text-align: center;
  padding: 1rem;
  color: #666;
  font-size: 0.9rem;
}
</style> 