import type { Repository, Commit, CommitDetails } from './github'

export interface GithubState {
  repositories: Repository[]
  commits: Commit[]
  selectedCommit: CommitDetails | null
  favorites: Map<string, Commit>
  loading: boolean
  error: GithubError | null
  currentPage: number
  hasMoreCommits: boolean
  totalStats: {
    additions: number
    deletions: number
    total: number
  } | null
}

export interface FavoriteCommit {
  username: string
  repoName: string
  commit: Commit
}

export interface GithubError {
  type: ErrorType
  message: string
  details?: string
}

export enum ErrorType {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  REPO_NOT_FOUND = 'REPO_NOT_FOUND',
  COMMIT_NOT_FOUND = 'COMMIT_NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  NO_REPOS = 'NO_REPOS',
  NO_COMMITS = 'NO_COMMITS',
  INVALID_INPUT = 'INVALID_INPUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
} 