// Ports monkey.js:446-637 (addSizeToRepos) — the core feature: a size badge
// rendered next to repository links across repo pages, org repo lists, profile
// repo/starred tabs, and search results.
import { getPageType, type PageType } from '../lib/dom-utils'
import { fetchRepoDetail, type RepoDetail } from '../lib/github-api'
import { getHumanReadableSize, isMobileDevice } from '../lib/format'
import type { Settings } from '../lib/settings'
import { checkCommitDate } from './inactivity-warning'
import { isLoggedInUserF, maybeShowQuickJump } from './repo-quick-jump'
import { insertActiveForks, insertOssInsightButton, insertDelBtn } from './repo-buttons'

const SIZE_ICON_PATH =
  'M1 3.5c0-.626.292-1.165.7-1.59.406-.422.956-.767 1.579-1.041C4.525.32 6.195 0 8 0c1.805 0 3.475.32 4.722.869.622.274 1.172.62 1.578 1.04.408.426.7.965.7 1.591v9c0 .626-.292 1.165-.7 1.59-.406.422-.956.767-1.579 1.041C11.476 15.68 9.806 16 8 16c-1.805 0-3.475-.32-4.721-.869-.623-.274-1.173-.62-1.579-1.04-.408-.426-.7-.965-.7-1.591Zm1.5 0c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 5.205 6.353 5.5 8 5.5c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55 0-.133-.058-.318-.282-.551-.227-.237-.591-.483-1.101-.707C11.102 1.795 9.647 1.5 8 1.5c-1.646 0-3.101.295-4.118.742-.508.224-.873.471-1.1.708-.224.232-.282.417-.282.55Zm0 4.5c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 9.705 6.353 10 8 10c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55V5.724c-.241.15-.503.286-.778.407C11.475 6.68 9.805 7 8 7c-1.805 0-3.475-.32-4.721-.869a6.15 6.15 0 0 1-.779-.407Zm0 2.225V12.5c0 .133.058.318.282.55.227.237.592.484 1.1.708 1.016.447 2.471.742 4.118.742 1.647 0 3.102-.295 4.117-.742.51-.224.874-.47 1.101-.707.224-.233.282-.418.282-.551v-2.275c-.241.15-.503.285-.778.406-1.247.549-2.917.869-4.722.869-1.805 0-3.475-.32-4.721-.869a6.327 6.327 0 0 1-.779-.406Z'

function extractPath(href: string): string {
  const thirdSlashIndex = href.indexOf('/', href.indexOf('/', href.indexOf('/') + 1) + 1)
  return thirdSlashIndex !== -1 ? href.substring(0, thirdSlashIndex) : href
}

function repoSelectorFor(pageType: PageType): string | undefined {
  switch (pageType) {
    case 'repo':
      return '#repository-container-header strong a'
    case 'list-view-container':
      return 'div[data-testid="list-view-item-title-container"] h4 a'
    case 'user-repositories':
      return '#user-repositories-list h3 a'
    case 'user-starred-repos':
      return '#user-starred-repos h3 a'
    case 'search':
    case 'code_search':
      return 'div[data-testid="results-list"] .search-title a'
    default:
      return undefined
  }
}

function insertUserRepositoriesDeleteButtons(): void {
  document.querySelectorAll('li[itemprop="owns"]').forEach((item) => {
    const repoName = item.querySelector('a[itemprop="name codeRepository"]')?.textContent?.trim()
    const ownerName = window.location.pathname.split('/')[1]
    if (!repoName) return
    insertDelBtn(ownerName, repoName, false, 'dialog-show-repo-delete-user-repositories', item)
  })
}

function renderSizeBadge(elem: Element, repo: RepoDetail, pageType: PageType): void {
  let parent: HTMLElement | null = elem.parentElement
  if (pageType === 'repo') parent = elem.parentElement?.parentElement ?? null
  if (!parent || parent.querySelector('#mshll-repo-size')) return

  const sizeContainer = document.createElement('span')
  sizeContainer.id = 'mshll-repo-size'
  sizeContainer.className = 'tooltipped tooltipped-s'
  sizeContainer.classList.add('Label', 'Label--info', 'v-align-middle', 'ml-1')
  sizeContainer.setAttribute('aria-label', 'Repository size')

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('viewBox', '-4 -4 22 22')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('fill', 'currentColor')
  svg.setAttribute('data-view-component', 'true')
  svg.classList.add('octicon', 'octicon-file-directory', 'mr-1')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('fill-rule', 'evenodd')
  path.setAttribute('d', SIZE_ICON_PATH)
  svg.appendChild(path)

  const sizeBytes = repo.size * 1024
  sizeContainer.innerHTML = getHumanReadableSize(repo.size)
  sizeContainer.prepend(svg)

  if (pageType === 'code_search') parent.style.direction = 'ltr'
  if (!sizeBytes) {
    sizeContainer.style.color = 'red'
    sizeContainer.style.border = '1px solid red'
  }
  parent.appendChild(sizeContainer)
}

export function addSizeToRepos(settings: Settings): void {
  const pageType = getPageType()
  const repoSelector = repoSelectorFor(pageType)
  if (!repoSelector) return

  if (pageType === 'user-repositories') insertUserRepositoriesDeleteButtons()

  let filterHref: string | undefined
  document.querySelectorAll<HTMLAnchorElement>(repoSelector).forEach(async (elem) => {
    const href = extractPath(elem.getAttribute('href') ?? '')
    if (filterHref === href) return
    filterHref = href

    if (pageType === 'repo') {
      const [, owner, name] = href.split('/')
      insertActiveForks(owner, name, !isMobileDevice())
      insertOssInsightButton(owner, name, !isMobileDevice())
      if (isLoggedInUserF()) insertDelBtn(owner, name, !isMobileDevice())
    }

    const repo = await fetchRepoDetail(href, settings.githubToken)
    if (repo.message) return

    if (pageType === 'repo' && settings.warn) checkCommitDate(repo.pushed_at)
    if (pageType === 'repo' && !document.querySelector('#view-user-repos')) {
      maybeShowQuickJump(repo, settings)
    }

    renderSizeBadge(elem, repo, pageType)
  })
}
