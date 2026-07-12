// Content script entry — injected into github.com/* (see manifest.json).
// Settings are async (chrome.storage) unlike the original userscript's synchronous
// GM_getValue, so every feature module waits on this single load before running.
import { loadSettings } from '../lib/settings'

async function main() {
  const settings = await loadSettings()
  void settings
  // Feature modules (repo size, inactivity warning, quick-jump, buttons,
  // fixed header, gist button, notification preview) hook in here as each
  // phase lands.
}

void main()
