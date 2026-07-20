import assert from 'node:assert/strict'
import {
  getGithubStarsUrl,
  getStarsProfileUsername,
  isValidGithubLogin,
  normalizeRepositoryPath,
} from '../src/lib/github-stars.ts'

assert.equal(isValidGithubLogin('djpken'), true)
assert.equal(isValidGithubLogin('bad/login'), false)
assert.equal(getStarsProfileUsername('/djpken', '?tab=stars'), 'djpken')
assert.equal(getStarsProfileUsername('/djpken/repo', '?tab=stars'), null)
assert.equal(normalizeRepositoryPath('/Owner/Repo'), 'owner/repo')
assert.equal(normalizeRepositoryPath('/Owner/Repo/issues'), null)
assert.equal(getGithubStarsUrl('djpken'), 'https://github.com/djpken?tab=stars')

console.log('github-stars self-check passed')
