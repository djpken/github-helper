// Ports monkey.js:1205-1225 (fixPageHeader) plus the gating that lived in its
// window.onload caller (monkey.js:640-644). Only runs once on initial load,
// matching the original — it is not re-applied on Turbo SPA navigation.
import { isMobileDevice } from '../lib/format'
import type { Settings } from '../lib/settings'

export function fixPageHeader(settings: Settings): void {
  if (!settings.fixedHeaderOnMobile && isMobileDevice()) return
  if (!settings.fixedHeader) return

  const header = document.querySelector<HTMLElement>('.AppHeader, header[role="banner"]')
  if (!header) return

  const css = document.createElement('style')
  css.id = 'fixed-header-style'
  css.innerHTML = `
        .AppHeader, header[role="banner"] {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        body {
            padding-top: ${header.offsetHeight}px !important;
        }
    `
  document.head.appendChild(css)
}
