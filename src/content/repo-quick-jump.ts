// Ports monkey.js:854-1066 — the "quick-jump" dropdown next to a repo's Code
// button listing the owner's other repositories (insertReposList), the
// login-detection helpers that decide whose repos to fetch, and the
// localStorage-backed repo list cache (fetchReposWithCache).
import type { Settings } from '../lib/settings'
import type { RepoDetail } from '../lib/github-api'
import { getHumanReadableSize, systemTime, timeToSeconds } from '../lib/format'

interface RepoListItem {
  name: string
  private: boolean
  html_url: string
  fork: boolean
  description: string | null
  stargazers_count: number
  owner: string
  forks_count: number
  open_issues_count: number
  language: string | null
  size: number
  created_at: string
  updated_at: string
  pushed_at: string
}

function isLoggedInUser(avatarUrl: string): boolean {
  const img = document.querySelector<HTMLImageElement>('.AppHeader-user button span span img')
  return img ? img.src === avatarUrl : false
}

export function getMReponame(): Element | null {
  return document.querySelector('#responsive-meta-container .flex-wrap')
}

function getCurrentUserId(): string | null {
  const src = document.querySelector<HTMLImageElement>('[data-testid="github-avatar"]')?.src
  return src?.match(/\/u\/(\d+)/)?.[1] ?? null
}

// Compares the repo-header avatar's embedded user ID against the logged-in
// user's avatar to decide whether the viewer owns the repo being shown.
export function isLoggedInUserF(): boolean {
  const currentUserId = getCurrentUserId()
  const repoImgSrc = document.querySelector<HTMLImageElement>('#repo-title-component > img')?.src
  if (!currentUserId || !repoImgSrc) return false
  return repoImgSrc.match(/\/u\/(\d+)/)?.[1] === currentUserId
}

async function getUserAllRepos(
  href: string,
  headers: Record<string, string>,
  getMore: boolean,
  maxPage: number,
  perPage: number,
): Promise<any[]> {
  let allRepos: any[] = []
  let page = 1
  do {
    const url = getMore ? `${href}?per_page=${perPage}&page=${page}` : href
    const response = await fetch(url, { headers })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const repos = await response.json()
    if (repos.length === 0) break
    allRepos = allRepos.concat(repos)
    page++
    if (maxPage !== 0 && page > maxPage) break
  } while (getMore)
  return allRepos
}

function getIconPath(link: RepoListItem): string {
  const fillColor = link.private ? 'green' : !link.private && !link.fork ? 'red' : null
  if (fillColor) {
    return `<path fill="${fillColor}" fill-rule="evenodd" d="M1 3.5c0-.626.292-1.165.7-1.59.406-.422.956-.767 1.579-1.041C4.525.32 6.195 0 8 0c1.805 0 3.475.32 4.722.869.622.274 1.172.62 1.578 1.04.408.426.7.965.7 1.591v9c0 .626-.292 1.165-.7 1.59-.406.422-.956.767-1.579 1.041C11.476 15.68 9.806 16 8 16c-1.805 0-3.475-.32-4.721-.869-.623-.274-1.173-.62-1.579-1.04-.408-.426-.7-.965-.7-1.591Zm1.5 0c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 5.205 6.353 5.5 8 5.5c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55 0-.133-.058-.318-.282-.551-.227-.237-.591-.483-1.101-.707C11.102 1.795 9.647 1.5 8 1.5c-1.646 0-3.101.295-4.118.742-.508.224-.873.471-1.1.708-.224.232-.282.417-.282.55Zm0 4.5c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 9.705 6.353 10 8 10c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55V5.724c-.241.15-.503.286-.778.407C11.475 6.68 9.805 7 8 7c-1.805 0-3.475-.32-4.721-.869a6.15 6.15 0 0 1-.779-.407Zm0 2.225V12.5c0 .133.058.318.282.55.227.237.592.484 1.1.708 1.016.447 2.471.742 4.118.742 1.647 0 3.102-.295 4.117-.742.51-.224.874-.47 1.101-.707.224-.233.282-.418.282-.551v-2.275c-.241.15-.503.285-.778.406-1.247.549-2.917.869-4.722.869-1.805 0-3.475-.32-4.721-.869a6.327 6.327 0 0 1-.779-.406Z"></path>`
  }
  if (link.fork) {
    return '<path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>'
  }
  return ''
}

function insertReposList(links: RepoListItem[], tip: boolean, settings: Settings): void {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button[class^="prc-Button-ButtonBase-"]'),
  ).find((btn) => ['代码', 'Code'].includes(btn.textContent?.trim() ?? ''))
  if (!buttons) return

  const sortedLinks = [...links].sort((a, b) => {
    if (b.fork && !a.fork) return -1
    if (a.fork && !b.fork) return 1
    if (b.private === a.private) {
      if (!a.private && !b.private) return b.stargazers_count - a.stargazers_count
      return 0
    }
    return b.private ? -1 : 1
  })

  let privateClassAdded = false
  let forkClassAdded = false
  const stats = { privateTrue: 0, privateFalse: 0, forkTrue: 0, forkFalse: 0 }

  const listItems = sortedLinks
    .map((link) => {
      stats.privateTrue += link.private && !link.fork ? 1 : 0
      stats.privateFalse += (link.private ? 0 : 1) && !link.fork ? 1 : 0
      stats.forkTrue += link.fork ? 1 : 0
      stats.forkFalse += link.fork ? 0 : 1

      let liClass = ''
      if (link.private && !privateClassAdded) {
        liClass += 'border-top'
        privateClassAdded = true
      }
      if (link.fork && !forkClassAdded) {
        liClass += 'border-top'
        forkClassAdded = true
      }

      const starsAndForks = [
        link.stargazers_count > 0 ? `${chrome.i18n.getMessage('repoStars')}${link.stargazers_count}` : '',
        link.forks_count > 0 ? `${chrome.i18n.getMessage('repoForks')}${link.forks_count}` : '',
      ]
        .filter(Boolean)
        .join(' ')
      const repoInfo = [
        link.description ? `${chrome.i18n.getMessage('repoDes')}${link.description}` : '',
        starsAndForks,
        `${chrome.i18n.getMessage('repoSize')}${getHumanReadableSize(link.size)}`,
        link.language ? `${chrome.i18n.getMessage('repoLang')}${link.language}` : '',
        `${chrome.i18n.getMessage('repoCreated')}${link.created_at}`,
        `${chrome.i18n.getMessage('repoUpdated')}${link.updated_at}`,
        `${chrome.i18n.getMessage('repoPushed')}${link.pushed_at}`,
      ]
        .filter(Boolean)
        .join('\n')

      return `
        <li class="${liClass}${tip ? ' tooltipped tooltipped-s' : ''}" aria-label="${repoInfo}">
            <a href="${link.html_url}" class="dropdown-item" ${settings.openInNewTab ? 'target="_blank"' : ''} rel="noopener noreferrer" ${tip ? '"' : ` title="${repoInfo}"`}>
                <span class="d-inline-flex mr-2">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        ${getIconPath(link)}
                    </svg>
                </span>
                ${link.name}
            </a>
        </li>
    `
    })
    .join('')

  const view = chrome.i18n.getMessage('view')
  const allRepos = chrome.i18n.getMessage('allRepos')
  const ariaLabel = [
    ` ${view}[${links[0].owner}]${allRepos} `,
    `${allRepos} : ${sortedLinks.length}`,
    stats.privateTrue > 0 ? `${chrome.i18n.getMessage('privateRepos')} ${stats.privateTrue}` : '',
    stats.privateFalse > 0 ? `${chrome.i18n.getMessage('publicRepos')}  ${stats.privateFalse}` : '',
    stats.forkTrue > 0 ? `${chrome.i18n.getMessage('forkRepos')} ${stats.forkTrue}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const detailsHTML = `
<details id="view-user-repos" class="details-overlay details-reset position-relative d-flex">
    <summary role="button" type="button" class="btn text-center">
        <span class="d-none d-xl-flex flex-items-center tooltipped tooltipped-s" aria-label="${ariaLabel}">
            ${view}<mark>[${links[0].owner}]</mark>${allRepos}
            <span class="dropdown-caret ml-2"></span>
        </span>
        <span class="d-inline-block d-xl-none">
            ${links[0].owner}
            <span class="dropdown-caret d-none d-sm-inline-block d-md-none d-lg-inline-block"></span>
        </span>
    </summary>
    <div>
        <ul class="dropdown-menu dropdown-menu-sw">
            ${listItems}
        </ul>
    </div>
</details>`

  buttons.insertAdjacentHTML('beforebegin', detailsHTML)
}

function fetchReposWithCache(ownerKey: string, reposApi: string, headers: Record<string, string>, settings: Settings): void {
  const localData = localStorage.getItem(ownerKey)
  const currentTime = Date.now()
  if (localData) {
    const parsed = JSON.parse(localData)
    const localTimeStamp = new Date(parsed.timeStamp).getTime()
    if (currentTime - localTimeStamp < timeToSeconds(settings.cacheRefreshTime) * 1000) {
      insertReposList(parsed.reposArray, settings.useTip, settings)
      return
    }
  }
  getUserAllRepos(reposApi, headers, settings.getUserMoreRepos, settings.getUserMoreReposMaxPage, settings.getUserMoreReposPerPage)
    .then((data) => {
      const reposArray: RepoListItem[] = data.map((repo: any) => ({
        name: repo.name,
        private: repo.private,
        html_url: repo.html_url,
        fork: repo.fork,
        description: repo.description,
        stargazers_count: repo.stargazers_count,
        owner: repo.owner.login,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        language: repo.language,
        size: repo.size,
        created_at: systemTime(repo.created_at),
        updated_at: systemTime(repo.updated_at),
        pushed_at: systemTime(repo.pushed_at),
      }))
      localStorage.setItem(ownerKey, JSON.stringify({ reposArray, timeStamp: new Date().toISOString() }))
      insertReposList(reposArray, settings.useTip, settings)
    })
    .catch((error) => console.error('Error fetching data:', error))
}

export function maybeShowQuickJump(repo: RepoDetail, settings: Settings): void {
  const headers: Record<string, string> = settings.githubToken ? { authorization: `token ${settings.githubToken}` } : {}
  const reposApi = isLoggedInUser(repo.owner.avatar_url)
    ? settings.githubToken
      ? 'https://api.github.com/user/repos'
      : repo.owner.repos_url
    : repo.owner.repos_url
  fetchReposWithCache(repo.owner.login, reposApi, headers, settings)
}
