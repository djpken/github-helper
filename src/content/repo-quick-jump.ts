import type { Settings } from '../lib/settings'
import type { RepoDetail } from '../lib/github-api'

// Phase 3 fills this in (ports monkey.js:854-1066: insertReposList, isLoggedInUser*,
// getCurrentUserId, getMReponame, getUserRepos/getUserAllRepos, fetchReposWithCache).
export function isLoggedInUserF(): boolean {
  return false
}

export function maybeShowQuickJump(_repo: RepoDetail, _settings: Settings): void {}
