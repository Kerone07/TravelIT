export interface Repository {
  id: number
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
}

export interface Commit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
  } | null
}

export interface CommitDetails extends Commit {
  files: {
    filename: string
    status: string
    additions: number
    deletions: number
    changes: number
    patch?: string
  }[]
  stats: {
    total: number
    additions: number
    deletions: number
  }
}

export interface FavoriteCommit {
  id: string // username/repo/sha
  username: string
  repo: string
  commit: Commit
} 

export interface FileChange {
    additions: number
    deletions: number
    filename: string
    patch?: string
  }