import { getStarsProfileUsername, isValidGithubLogin } from '../lib/github-stars'

export function getCurrentGithubLogin(): string | null {
  const login = document.querySelector('meta[name="user-login"]')?.getAttribute('content')?.trim() ?? ''
  return isValidGithubLogin(login) ? login : null
}

export function isCurrentGithubStarsPage(): boolean {
  const pageLogin = getStarsProfileUsername(window.location.pathname, window.location.search)
  const currentLogin = getCurrentGithubLogin()
  return Boolean(pageLogin && currentLogin && pageLogin.toLowerCase() === currentLogin.toLowerCase())
}
