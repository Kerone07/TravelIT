<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const error = ref('')

const handleSubmit = () => {
  if (!username.value.trim()) {
    error.value = 'Please enter a GitHub username'
    return
  }
  error.value = ''
  router.push(`/repos/${username.value}`)
}
</script>

<template>
  <div class="home">
    <div class="search-container">
      <h1>GitHub Commit Explorer</h1>
      <p class="subtitle">Explore repositories and commits from any GitHub user</p>
      
      <form @submit.prevent="handleSubmit" class="search-form">
        <div class="input-group">
          <input
            v-model="username"
            type="text"
            placeholder="Enter GitHub username"
            class="search-input"
            :class="{ error: error }"
          />
          <button type="submit" class="search-button">
            Explore
          </button>
        </div>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 72px);
}

.search-container {
  text-align: center;
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #42b883;
}

.search-input.error {
  border-color: #e74c3c;
}

.search-button {
  padding: 0.75rem 1.5rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover {
  background-color: #3aa876;
}

.error-message {
  color: #e74c3c;
  margin: 0;
  font-size: 0.9rem;
}
</style> 