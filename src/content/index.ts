// Content script entry — injected into github.com/* (see manifest.json).
// Settings are async (chrome.storage) unlike the original userscript's synchronous
// GM_getValue, so every feature module waits on this single load before running.
import { loadSettings, type Settings } from '../lib/settings'
import { selectors, waitForElement, observeUrlChanges } from '../lib/dom-utils'
import { addSizeToRepos } from './repo-size'
import { notificationRepo } from './notification-preview'
import { fixPageHeader } from './fixed-header'
import { injectGistButton } from './gist-button'

// Ports monkey.js:704-713 (main). GitHub's Turbo navigation swaps DOM content
// without a full page load, so this races the known page-region selectors and
// re-runs the feature modules once one of them shows up.
function runFeatures(settings: Settings, delay = 0): void {
  Promise.race(selectors.map((selector) => waitForElement(selector)))
    .then(() => {
      setTimeout(() => {
        addSizeToRepos(settings)
        notificationRepo(settings)
      }, delay)
    })
    .catch((error: Error) => console.error(error.message))
}

async function run(): Promise<void> {
  const settings = await loadSettings()
  const onNavigate = () => runFeatures(settings)
  document.addEventListener('turbo:load', onNavigate)
  observeUrlChanges(onNavigate)

  // Ports monkey.js:675-698 — runs once on initial load, then again once the
  // DOM is ready (Turbo navigation doesn't refire DOMContentLoaded).
  injectGistButton()
  document.addEventListener('DOMContentLoaded', injectGistButton)

  // Ports monkey.js:640-644 — window.onload, once per full page load only.
  window.addEventListener('load', () => fixPageHeader(settings))
}

void run()
