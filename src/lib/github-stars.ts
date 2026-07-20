const GITHUB_LOGIN_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/
const REPOSITORY_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/

export function isValidGithubLogin(login: string): boolean {
  return login.length <= 39 && GITHUB_LOGIN_PATTERN.test(login)
}

export function getStarsProfileUsername(pathname: string, search: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  const tab = new URLSearchParams(search).get('tab')
  if (segments.length !== 1 || tab !== 'stars') return null
  return isValidGithubLogin(segments[0]) ? segments[0] : null
}

export function normalizeRepositoryPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length !== 2 || !isValidGithubLogin(segments[0]) || !REPOSITORY_NAME_PATTERN.test(segments[1])) return null
  return `${segments[0].toLowerCase()}/${segments[1].toLowerCase()}`
}

export function getGithubStarsUrl(login: string): string {
  return `https://github.com/${encodeURIComponent(login)}?tab=stars`
}
