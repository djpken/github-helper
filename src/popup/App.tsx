import { useEffect, useState } from 'react'
import { loadSettings, saveSettings, type Settings } from '../lib/settings'
import { fetchRepoDetail, type RepoDetail } from '../lib/github-api'
import { getHumanReadableSize } from '../lib/format'
import { getGithubStarsUrl, isValidGithubLogin } from '../lib/github-stars'

// Popup summary card + quick-toggle switches (grilling decision: popup does
// its own chrome.tabs.query + fetch, independent of the content script —
// see plan architecture decision 1).
function parseRepoFromUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'github.com') return null
    const [, owner, repo] = parsed.pathname.split('/')
    return owner && repo ? { owner, repo } : null
  } catch {
    return null
  }
}

type RepoState = 'loading' | 'not-a-repo' | RepoDetail
type GithubIdentityState = 'checking' | { login: string } | null

async function readCurrentGithubLogin(tabId: number | undefined): Promise<string | null> {
  if (tabId === undefined) return null
  try {
    const response = (await chrome.tabs.sendMessage(tabId, { type: 'github-helper:get-current-user' })) as
      | { login?: unknown }
      | undefined
    return typeof response?.login === 'string' && isValidGithubLogin(response.login) ? response.login : null
  } catch {
    return null
  }
}

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [repo, setRepo] = useState<RepoState>('loading')
  const [githubIdentity, setGithubIdentity] = useState<GithubIdentityState>('checking')

  useEffect(() => {
    void loadSettings().then(setSettings)

    void chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      const login = await readCurrentGithubLogin(tab?.id)
      setGithubIdentity(login ? { login } : null)

      const parsed = tab?.url ? parseRepoFromUrl(tab.url) : null
      if (!parsed) {
        setRepo('not-a-repo')
        return
      }
      try {
        const detail = await fetchRepoDetail(`/${parsed.owner}/${parsed.repo}`, '')
        setRepo(detail.message ? 'not-a-repo' : detail)
      } catch {
        setRepo('not-a-repo')
      }
    })
  }, [])

  async function toggle(key: 'warn' | 'openInNewTab', value: boolean) {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
    await saveSettings({ [key]: value })
  }

  return (
    <main style={{ width: 320, padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 16, margin: '0 0 8px' }}>{chrome.i18n.getMessage('extName')}</h1>

      {repo === 'not-a-repo' && <p style={{ margin: '0 0 12px', color: '#555' }}>{chrome.i18n.getMessage('notARepoPage')}</p>}
      {repo !== 'loading' && repo !== 'not-a-repo' && (
        <div style={{ marginBottom: 12, padding: 8, background: '#f6f8fa', border: '1px solid #e1e4e8', borderRadius: 6, fontSize: 13 }}>
          <strong>{repo.full_name}</strong>
          <div>
            {chrome.i18n.getMessage('repoSize')} {getHumanReadableSize(repo.size)}
          </div>
          <div>⭐ {repo.stargazers_count.toLocaleString()}</div>
          {repo.language && (
            <div>
              {chrome.i18n.getMessage('repoLang')} {repo.language}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          disabled={typeof githubIdentity !== 'object' || githubIdentity === null}
          onClick={() => {
            if (typeof githubIdentity !== 'object' || githubIdentity === null) return
            void chrome.tabs.create({ url: getGithubStarsUrl(githubIdentity.login) })
          }}
          style={{ width: '100%', padding: '6px 10px' }}
        >
          {chrome.i18n.getMessage('openStars')}
        </button>
        {githubIdentity === 'checking' && <p style={{ margin: '6px 0 0', color: '#555', fontSize: 12 }}>{chrome.i18n.getMessage('openStarsChecking')}</p>}
        {githubIdentity === null && <p style={{ margin: '6px 0 0', color: '#555', fontSize: 12 }}>{chrome.i18n.getMessage('openStarsUnavailable')}</p>}
      </div>

      {settings && (
        <div>
          <label style={{ display: 'block' }}>
            <input type="checkbox" checked={settings.warn} onChange={(e) => void toggle('warn', e.target.checked)} /> {chrome.i18n.getMessage('warncheckbox')}
          </label>
          <label style={{ display: 'block' }}>
            <input type="checkbox" checked={settings.openInNewTab} onChange={(e) => void toggle('openInNewTab', e.target.checked)} /> {chrome.i18n.getMessage('newTab')}
          </label>
        </div>
      )}

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          chrome.runtime.openOptionsPage()
        }}
        style={{ display: 'block', marginTop: 12, fontSize: 13 }}
      >
        {chrome.i18n.getMessage('menu')}
      </a>
    </main>
  )
}
