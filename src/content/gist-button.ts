// Ports monkey.js:676-695 (injectGistButton).
export function injectGistButton(): void {
  const sidebar = document.querySelector<HTMLElement>('.js-profile-editable-area')
  if (!sidebar || document.getElementById('gist-profile-link')) return

  const username = window.location.pathname.split('/')[1]
  const btn = document.createElement('a')
  btn.id = 'gist-profile-link'
  btn.innerText = chrome.i18n.getMessage('gist_profile')
  btn.href = `https://gist.github.com/${username}`
  btn.className = 'btn btn-block mt-2'
  sidebar.appendChild(btn)
}
