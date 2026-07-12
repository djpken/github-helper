import { useEffect, useState } from 'react'
import { loadSettings, saveSettings, DEFAULT_SETTINGS, type Settings } from '../lib/settings'

// Ports monkey.js:326-427 (createModal) as an options page. Drops the TOTP
// secret field entirely (see CONTEXT.md / plan architecture decision 3) and
// the GM_registerMenuCommand entry point (replaced by manifest options_page).
export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    void loadSettings().then((loadedSettings) => {
      setSettings(loadedSettings)
      setLoaded(true)
    })
  }, [])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    const token = settings.githubToken.trim()
    if (!token) {
      const confirmed = confirm(chrome.i18n.getMessage('confirm'))
      if (!confirmed) return
    }
    await saveSettings({ ...settings, githubToken: token })
    setSavedAt(Date.now())
  }

  if (!loaded) return null

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 18 }}>{chrome.i18n.getMessage('modaltitle')}</h1>

      <p style={{ color: '#555' }}>
        {chrome.i18n.getMessage('description')}{' '}
        <a href="https://github.com/settings/tokens/new?description=GitHub%20Helper&scopes=repo" target="_blank" rel="noopener noreferrer">
          {chrome.i18n.getMessage('newtoken')}
        </a>
      </p>
      <input
        type="text"
        style={{ width: '100%', boxSizing: 'border-box' }}
        placeholder={chrome.i18n.getMessage('githubtokeninput')}
        value={settings.githubToken}
        onChange={(e) => update('githubToken', e.target.value)}
      />

      <hr style={{ margin: '20px 0' }} />

      <label style={{ display: 'block' }}>
        <input type="checkbox" checked={settings.warn} onChange={(e) => update('warn', e.target.checked)} /> {chrome.i18n.getMessage('warncheckbox')}
      </label>
      <label style={{ display: 'block' }}>
        <input type="checkbox" checked={settings.openInNewTab} onChange={(e) => update('openInNewTab', e.target.checked)} /> {chrome.i18n.getMessage('newTab')}
      </label>

      <hr style={{ margin: '20px 0' }} />

      <label style={{ display: 'block' }}>
        <input type="checkbox" checked={settings.getUserMoreRepos} onChange={(e) => update('getUserMoreRepos', e.target.checked)} /> {chrome.i18n.getMessage('get_more_repos')}
      </label>
      <p style={{ color: '#555', marginBottom: 4 }}>{chrome.i18n.getMessage('get_more_repos_maxpage')}</p>
      <input
        type="text"
        style={{ width: '100%', boxSizing: 'border-box' }}
        value={settings.getUserMoreReposMaxPage}
        onChange={(e) => update('getUserMoreReposMaxPage', Number(e.target.value) || 0)}
      />
      <p style={{ color: '#555', marginBottom: 4 }}>{chrome.i18n.getMessage('get_more_repos_perpage')}</p>
      <input
        type="text"
        style={{ width: '100%', boxSizing: 'border-box' }}
        value={settings.getUserMoreReposPerPage}
        onChange={(e) => update('getUserMoreReposPerPage', Number(e.target.value) || 0)}
      />

      <hr style={{ margin: '20px 0' }} />

      <label style={{ display: 'block' }}>
        <input type="checkbox" checked={settings.fixedHeader} onChange={(e) => update('fixedHeader', e.target.checked)} /> {chrome.i18n.getMessage('fixed_head')}
      </label>
      <label style={{ display: 'block' }}>
        <input type="checkbox" checked={settings.fixedHeaderOnMobile} onChange={(e) => update('fixedHeaderOnMobile', e.target.checked)} />{' '}
        {chrome.i18n.getMessage('fixed_head_on_mobile')}
      </label>

      <hr style={{ margin: '20px 0' }} />

      <p style={{ color: '#555', marginBottom: 4 }}>{chrome.i18n.getMessage('refresh_time')}</p>
      <input
        type="text"
        style={{ width: '100%', boxSizing: 'border-box' }}
        value={settings.cacheRefreshTime}
        onChange={(e) => update('cacheRefreshTime', e.target.value)}
      />

      <div style={{ marginTop: 20 }}>
        <button onClick={() => void handleSave()}>{chrome.i18n.getMessage('save')}</button>
        {savedAt && <span style={{ marginLeft: 12, color: '#2ea043' }}>{chrome.i18n.getMessage('saved')}</span>}
      </div>
    </main>
  )
}
