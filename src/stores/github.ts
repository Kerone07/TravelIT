import { defineStore } from 'pinia'
import axios, { AxiosError } from 'axios'
import type { Commit, FileChange } from '@/types/github'
import type { GithubState, FavoriteCommit, GithubError } from '@/types/store'
import { ErrorType } from '@/types/store'

const STORAGE_KEY = 'github-favorites'

//Helper functions for local storage
const loadFavorites = (): Map<string, Commit> => {
  //Checking if there is a uniquely stored favourite item already in the Map
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    //If there is a uniquely stored item in the Map then return a Map/set of all the favourites that belong to the selected repo
    const favorites = JSON.parse(stored) as FavoriteCommit[]
    return new Map(favorites.map(fav => [`${fav.username}/${fav.repoName}/${fav.commit.sha}`, fav.commit]))
  }
  //Otherwise if there are no favourites in the selected repo return an empty Map
  return new Map()
}

//Function to save a unique favourite to the Map in the local storage. This acts like a cookie.
//Ideally, we'd save this to a backend db to persist the favourites
const saveFavorites = (favorites: Map<string, Commit>) => {
  //Gets the userName, the repoName, and the commit to an array 
  const favoritesArray: FavoriteCommit[] = Array.from(favorites.entries()).map(([key, commit]) => {
    const [username, repoName] = key.split('/')
    return { username, repoName, commit }
  })
  //Adds the favourited commit's essential information to the local storage Map
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesArray))
}

//Error handling helper
const handleApiError = (error: unknown): GithubError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError
    if (axiosError.response) {
      switch (axiosError.response.status) {
        case 404:
          return {
            type: ErrorType.USER_NOT_FOUND,
            message: 'User not found',
            details: 'The requested GitHub user does not exist.'
          }
        case 403:
          return {
            type: ErrorType.RATE_LIMIT,
            message: 'Rate limit exceeded',
            details: 'GitHub API rate limit reached. Please try again later.'
          }
        case 422:
          return {
            type: ErrorType.INVALID_INPUT,
            message: 'Invalid input',
            details: 'The provided input is invalid.'
          }
        default:
          return {
            type: ErrorType.UNKNOWN_ERROR,
            message: 'API Error',
            details: `GitHub API returned status ${axiosError.response.status}`
          }
      }
    }
    if (axiosError.request) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network Error',
        details: 'Unable to connect to GitHub API. Please check your internet connection.'
      }
    }
  }
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: 'Unknown Error',
    details: 'An unexpected error occurred.'
  }
}

export const useGithubStore = defineStore('github', {
  //State varaibles for the GitHub Store
  state: (): GithubState => ({
    repositories: [],
    commits: [],
    selectedCommit: null,
    favorites: loadFavorites(),
    loading: false,
    error: null,
    currentPage: 1,
    hasMoreCommits: true,
    totalStats: null
  }),

  getters: {
    sortedCommits: (state) => {
      return [...state.commits].sort((a, b) => 
        new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
      )
    },

    isFavorite: (state) => (commitId: string) => {
      return state.favorites.has(commitId)
    }
  },

  actions: {
    async fetchRepositories(username: string) {
      if (!username.trim()) {
        this.error = {
          type: ErrorType.INVALID_INPUT,
          message: 'Invalid Username',
          details: 'Please enter a valid GitHub username.'
        }
        return
      }

      //State management for system and for better user experience 
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`https://api.github.com/users/${username}/repos`)
        this.repositories = response.data

        if (this.repositories.length === 0) {
          this.error = {
            type: ErrorType.NO_REPOS,
            message: 'No Repositories Found',
            details: 'This user has no public repositories.'
          }
        }
      } catch (error) {
        this.error = handleApiError(error)
      } finally {
        this.loading = false
      }
    },

    async fetchCommits(username: string, repoName: string, page = 1) {
      if (!username.trim() || !repoName.trim()) {
        this.error = {
          type: ErrorType.INVALID_INPUT,
          message: 'Invalid Input',
          details: 'Please provide valid username and repository name.'
        }
        return
      }

      //Pagination setup and clearing of state varaibles, and setting the current page for the Observer to knpw
      //where they are in the results list
      if (page === 1) {
        this.commits = []
        this.currentPage = 1
        this.hasMoreCommits = true
      }

      //Again user flow and error handling variables
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${username}/${repoName}/commits`,
          {
            params: {
              page,
              per_page: 10
            }
          }
        )
        
        if (page === 1) {
          this.commits = response.data
        } else {
          this.commits = [...this.commits, ...response.data]
        }
        
        this.currentPage = page
        this.hasMoreCommits = response.data.length === 10

        if (this.commits.length === 0) {
          this.error = {
            type: ErrorType.NO_COMMITS,
            message: 'No Commits Found',
            details: 'This repository has no commits.'
          }
        }
      } catch (error) {
        this.error = handleApiError(error)
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          this.error.type = ErrorType.REPO_NOT_FOUND
          this.error.message = 'Repository Not Found'
          this.error.details = 'The requested repository does not exist.'
        }
      } finally {
        this.loading = false
      }
    },

    async fetchCommitDetails(username: string, repoName: string, sha: string) {
      if (!username.trim() || !repoName.trim() || !sha.trim()) {
        this.error = {
          type: ErrorType.INVALID_INPUT,
          message: 'Invalid Input',
          details: 'Please provide valid username, repository name, and commit SHA.'
        }
        return
      }

      this.loading = true
      this.error = null
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${username}/${repoName}/commits/${sha}`
        )
        this.selectedCommit = response.data
        
        // Calculate total stats
        if (response.data.files) {
          this.totalStats = response.data.files.reduce(
            (acc: { additions: number; deletions: number; total: number }, file: FileChange) => ({
              additions: acc.additions + file.additions,
              deletions: acc.deletions + file.deletions,
              total: acc.total + file.additions + file.deletions
            }),
            { additions: 0, deletions: 0, total: 0 }
          )
        }
      } catch (error) {
        this.error = handleApiError(error)
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          this.error.type = ErrorType.COMMIT_NOT_FOUND
          this.error.message = 'Commit Not Found'
          this.error.details = 'The requested commit does not exist.'
        }
      } finally {
        this.loading = false
      }
    },

    addToFavorites(username: string, repoName: string, commit: Commit) {
      //Error handling
      if (!username || !repoName || !commit) {
        this.error = {
          type: ErrorType.INVALID_INPUT,
          message: 'Invalid Input',
          details: 'Cannot add invalid commit to favorites.'
        }
        return
      }

      //Adding a favourite to the Map
      const commitId = `${username}/${repoName}/${commit.sha}`
      this.favorites.set(commitId, commit)
      saveFavorites(this.favorites)
    },

    removeFromFavorites(commitId: string) {
      if (!commitId) {
        this.error = {
          type: ErrorType.INVALID_INPUT,
          message: 'Invalid Input',
          details: 'Cannot remove invalid commit from favorites.'
        }
        return
      }

      //Removing the commits from tyhe Map
      this.favorites.delete(commitId)
      saveFavorites(this.favorites)
    },

    resetCommits() {
      this.commits = []
      this.selectedCommit = null
      this.currentPage = 1
      this.hasMoreCommits = true
      this.totalStats = null
      this.error = null
    },

    clearError() {
      this.error = null
    }
  }
}) 