// chrome.storage.local wrapper — replaces monkey.js's GM_getValue/GM_setValue (monkey.js:305-315).
// Storage reads are async, unlike GM_getValue, so callers must await loadSettings() once
// before running any logic that depends on it.

export interface Settings {
  githubToken: string
  getUserMoreRepos: boolean
  getUserMoreReposPerPage: number
  getUserMoreReposMaxPage: number
  warn: boolean
  openInNewTab: boolean
  cacheRefreshTime: string
  useTip: boolean
  fixedHeader: boolean
  fixedHeaderOnMobile: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  githubToken: '',
  getUserMoreRepos: false,
  getUserMoreReposPerPage: 100,
  getUserMoreReposMaxPage: 1,
  warn: true,
  openInNewTab: false,
  cacheRefreshTime: '24h',
  useTip: false,
  fixedHeader: true,
  fixedHeaderOnMobile: false,
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS)
  return stored as Settings
}

export async function saveSettings(partial: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(partial)
}
