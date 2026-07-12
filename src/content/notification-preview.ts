// Ports monkey.js:1226-1395 — a repo-detail preview card shown on the GitHub
// notifications page, populated either from a `repo:owner/repo` search filter
// or from hovering a notification list item.
import type { Settings } from '../lib/settings'
import { fetchRepoDetail, type RepoDetail } from '../lib/github-api'
import { getPageType } from '../lib/dom-utils'

function createInfoElement(): HTMLDivElement {
  const infoDiv = document.createElement('div')
  infoDiv.id = 'github-project-info'
  infoDiv.style.padding = '15px'
  infoDiv.style.margin = '10px 0'
  infoDiv.style.backgroundColor = '#f6f8fa'
  infoDiv.style.border = '1px solid #e1e4e8'
  infoDiv.style.borderRadius = '6px'
  return infoDiv
}

function updateProjectInfo(data: RepoDetail): void {
  let infoDiv = document.getElementById('github-project-info')
  if (!infoDiv) {
    infoDiv = createInfoElement()
    const notificationsList = document.querySelector('.notifications-list')
    if (notificationsList?.parentNode) {
      notificationsList.parentNode.insertBefore(infoDiv, notificationsList)
    }
  }

  infoDiv.innerHTML = `
        <h3 style="margin-top: 0; grid-column: 1 / -1; margin-bottom: 15px;">📊
    <a href="https://github.com/${data.full_name}" target="_blank">${data.full_name}</a>
</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="info-column" style="border-right: 1px solid #e1e4e8; padding-right: 16px;">
                    <p style="margin-top: 0;"><strong>${chrome.i18n.getMessage('repoDes')}</strong> ${data.description || 'None'}</p>
                    <p><strong>${chrome.i18n.getMessage('repoTotal')}</strong>
                        <div style="margin-left: 20px;">
                            ⭐ ${chrome.i18n.getMessage('repoStars')} ${data.stargazers_count.toLocaleString()}<br>
                            🍴${chrome.i18n.getMessage('repoForks')}  ${data.forks_count.toLocaleString()}<br>
                            👀 ${chrome.i18n.getMessage('repoWatcher')} ${data.watchers_count.toLocaleString()}
                        </div>
                    </p>
                </div>
                <div class="info-column" style="padding-left: 16px;">
                    <p style="margin-top: 0;"><strong>${chrome.i18n.getMessage('repoLang')}</strong> ${data.language || 'None'}</p>
                    <p><strong>${chrome.i18n.getMessage('repoUpdated')}</strong> ${new Date(data.updated_at).toLocaleString()}</p>
                    <p><strong>${chrome.i18n.getMessage('repoLicense')}</strong> ${data.license ? data.license.name : 'None'}</p>
                    ${data.homepage ? `<p><strong>${chrome.i18n.getMessage('repoPage')}</strong> <a href="${data.homepage}" target="_blank">${data.homepage}</a></p>` : ''}
                </div>
            </div>
        `

  if (!document.getElementById('github-project-info-style')) {
    const style = document.createElement('style')
    style.id = 'github-project-info-style'
    style.textContent = `
            @media (max-width: 768px) {
                #github-project-info > div {
                    grid-template-columns: 1fr !important;
                }
                #github-project-info .info-column {
                    border-right: none !important;
                    padding: 0 !important;
                }
                #github-project-info .info-column:first-child {
                    border-bottom: 1px solid #e1e4e8;
                    padding-bottom: 16px !important;
                }
                #github-project-info .info-column:last-child {
                    padding-top: 16px !important;
                }
            }
            @media (prefers-color-scheme: dark) {
                #github-project-info .info-column:first-child {
                    border-bottom: 1px solid #444c56;
                }
                #github-project-info {
                    background-color: #0d1117 !important;
                    color: #c9d1d9 !important;
                }
            }
        `
    document.head.appendChild(style)
  }
}

async function fetchProjectInfo(owner: string, repo: string, token: string): Promise<void> {
  try {
    const data = await fetchRepoDetail(`/${owner}/${repo}`, token)
    updateProjectInfo(data)
  } catch (error) {
    console.error('Failed to fetch project info:', error)
  }
}

function getRepoFromUrl(): { owner: string; repo: string } | null {
  const repoQuery = new URLSearchParams(window.location.search).get('query')
  if (!repoQuery) return null
  const match = repoQuery.match(/repo:([^/]+)\/([^/\s]+)/)
  return match ? { owner: match[1], repo: match[2] } : null
}

function extractRepoInfo(url: string): { owner: string; name: string } | null {
  const parts = new URL(url).pathname.split('/')
  return parts.length >= 3 ? { owner: parts[1], name: parts[2] } : null
}

export function notificationRepo(settings: Settings): void {
  const chosenRepo = getRepoFromUrl()
  const pageType = getPageType()

  if (!pageType && !chosenRepo) {
    document.getElementById('github-project-info')?.remove()
  }

  if (chosenRepo) {
    void fetchProjectInfo(chosenRepo.owner, chosenRepo.repo, settings.githubToken)
    return
  }

  if (pageType !== 'notification') return
  const notificationsList = document.querySelector<HTMLElement>('.notifications-list')
  if (!notificationsList || notificationsList.hasAttribute('data-mouseover-listener')) return

  let lastOwner: string | undefined
  let lastName: string | undefined
  notificationsList.addEventListener('mouseover', (event) => {
    const li = (event.target as HTMLElement).closest('li')
    if (!li || !notificationsList.contains(li) || !li.classList.contains('notifications-list-item')) return
    const link = li.querySelector<HTMLAnchorElement>('.js-navigation-open')
    if (!link) return
    const result = extractRepoInfo(link.href)
    if (!result || (result.owner === lastOwner && result.name === lastName)) return
    lastOwner = result.owner
    lastName = result.name
    void fetchProjectInfo(result.owner, result.name, settings.githubToken)
  })
  notificationsList.setAttribute('data-mouseover-listener', 'true')
}
