// Ports monkey.js's getPageType (432-445), selectors (646-654),
// waitForElement (728-744), and observeUrlChanges (714-727).

export type PageType =
  | 'list-view-container'
  | 'user-repositories'
  | 'user-starred-repos'
  | 'repo'
  | 'code_search'
  | 'search'
  | 'notification'
  | undefined

export function getPageType(): PageType {
  const { pathname, href, search } = window.location
  const params = new URLSearchParams(search)
  const [, username, repo] = pathname.split('/')
  const q = params.get('q')?.toLocaleLowerCase()
  const type = params.get('type')?.toLocaleLowerCase()
  if (pathname.split('/').pop() === 'repositories') return 'list-view-container'
  if (href.includes('?tab=repositories')) return 'user-repositories'
  if (href.includes('?tab=stars')) return 'user-starred-repos'
  if (username && repo) return 'repo'
  if (q && type === 'code') return 'code_search'
  if (q) return 'search'
  if (href.includes('github.com/notifications')) return 'notification'
  return undefined
}

// Selector set used by main() to detect that a GitHub SPA (Turbo) navigation
// has finished rendering the page region relevant to this extension.
export const selectors = [
  '#repository-container-header strong a',
  'div[data-testid="list-view-item-title-container"] h4 a',
  '#user-repositories-list h3 a',
  '#profile-lists-container',
  '#user-starred-repos',
  '#user-starred-repos h3 a',
  'div[data-testid="results-list"] .search-title a',
  '.notifications-list',
]

export function waitForElement(selector: string, timeoutMs = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector)
    if (existing) {
      resolve(existing)
      return
    }
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) {
        clearTimeout(timer)
        observer.disconnect()
        resolve(el)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = setTimeout(() => {
      observer.disconnect()
      reject(new Error(`waitForElement timed out: ${selector}`))
    }, timeoutMs)
  })
}

// GitHub's Turbo navigation doesn't always fire a distinct event this script
// can rely on for every page-region change, so this also watches location.href.
export function observeUrlChanges(callback: () => void, delay = 10): MutationObserver {
  let lastHref = location.href
  const observer = new MutationObserver(() => {
    const href = location.href
    if (href !== lastHref) {
      lastHref = href
      setTimeout(callback, delay)
    }
  })
  observer.observe(document, { subtree: true, childList: true })
  return observer
}
