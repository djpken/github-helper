import { normalizeRepositoryPath } from '../lib/github-stars'
import { waitForElement } from '../lib/dom-utils'
import { isCurrentGithubStarsPage } from './github-identity'

const STAR_MANAGER_ATTRIBUTE = 'data-github-helper-star-manager'
const STARS_CONTAINER_SELECTOR = '#user-starred-repos'
const LIST_CONTAINER_SELECTOR = '#profile-lists-container'
const STAR_REPOSITORY_SELECTOR = 'h3 a[href]'
const LIST_REPOSITORY_SELECTOR = 'h2 a[href]'
const NATIVE_LIST_LINK_SELECTOR = 'a[href^="/stars/"][href*="/lists/"]'

interface Repository {
  key: string
  href: string
}

interface ListReference {
  name: string
  href: string
}

interface ManagerView {
  root: HTMLElement
  status: HTMLElement
  retry: HTMLButtonElement
  results: HTMLElement
}

let lastRunUrl: string | null = null
let scanGeneration = 0
let waitingForUrl: string | null = null

function message(key: string, substitutions?: string | string[], fallback = key): string {
  return chrome.i18n.getMessage(key, substitutions) || fallback
}

function getRepository(anchor: HTMLAnchorElement): Repository | null {
  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return null
  const key = normalizeRepositoryPath(url.pathname)
  if (!key) return null
  return { key, href: `${url.origin}/${key}` }
}

function getListReference(anchor: HTMLAnchorElement): ListReference | null {
  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin || !/^\/stars\/[^/]+\/lists\/[^/]+\/?$/.test(url.pathname)) return null
  const name = anchor.querySelector('h3')?.textContent?.trim() || url.pathname.split('/').filter(Boolean).pop() || 'List'
  return { name, href: url.href }
}

function getNextHref(root: ParentNode): string | null {
  const anchors = root.querySelectorAll<HTMLAnchorElement>(
    '.paginate-container a, [data-test-selector="pagination"] a, a[rel="next"]',
  )
  const next = Array.from(anchors).find((anchor) => {
    const labels = [anchor.getAttribute('aria-label') ?? '', anchor.textContent ?? ''].map((label) => label.trim().toLocaleLowerCase())
    if (labels.some((label) => ['next', 'next page', '下一頁', '下一页', '次へ', '다음', 'suivant', 'siguiente', 'weiter'].includes(label))) return true
    const url = new URL(anchor.href, window.location.href)
    return url.searchParams.has('after') && !url.searchParams.has('before')
  })
  return next ? new URL(next.href, window.location.href).href : null
}

async function fetchGithubDocument(href: string): Promise<Document> {
  const url = new URL(href, window.location.href)
  if (url.origin !== window.location.origin) throw new Error('Unexpected GitHub page origin')

  const response = await fetch(url.href, {
    credentials: 'include',
    headers: { accept: 'text/html' },
  })
  if (!response.ok) throw new Error(`GitHub page returned ${response.status}`)

  const finalUrl = new URL(response.url)
  if (finalUrl.origin !== window.location.origin) throw new Error('Unexpected GitHub redirect origin')
  if (finalUrl.pathname === '/login' || finalUrl.pathname.startsWith('/sessions/')) {
    throw new Error('GitHub session is unavailable')
  }

  return new DOMParser().parseFromString(await response.text(), 'text/html')
}

function getRequiredRoot(documentLike: ParentNode, selector: string): Element {
  const root = documentLike.querySelector(selector)
  if (!root) throw new Error(`GitHub page is missing ${selector}`)
  return root
}

function addRepositories(target: Map<string, Repository>, root: ParentNode, selector: string): void {
  root.querySelectorAll<HTMLAnchorElement>(selector).forEach((anchor) => {
    const repository = getRepository(anchor)
    if (repository && !target.has(repository.key)) target.set(repository.key, repository)
  })
}

function clearRepositoryBadges(): void {
  document.querySelectorAll('[data-github-helper-star-badges]').forEach((element) => element.remove())
}

function addListMembership(
  memberships: Map<string, ListReference[]>,
  list: ListReference,
  root: ParentNode,
): void {
  root.querySelectorAll<HTMLAnchorElement>(LIST_REPOSITORY_SELECTOR).forEach((anchor) => {
    const repository = getRepository(anchor)
    if (!repository) return
    const listMemberships = memberships.get(repository.key) ?? []
    if (!listMemberships.some((item) => item.href === list.href)) listMemberships.push(list)
    memberships.set(repository.key, listMemberships)
  })
}

async function collectListReferences(
  pageUrl: string,
  generation: number,
): Promise<ListReference[] | null> {
  const references = new Map<string, ListReference>()
  let documentLike: ParentNode = document
  let nextHref = getNextHref(getRequiredRoot(documentLike, LIST_CONTAINER_SELECTOR))

  while (true) {
    if (!isActiveScan(generation, pageUrl)) return null
    const root = getRequiredRoot(documentLike, LIST_CONTAINER_SELECTOR)
    root.querySelectorAll<HTMLAnchorElement>(NATIVE_LIST_LINK_SELECTOR).forEach((anchor) => {
      const reference = getListReference(anchor)
      if (reference) references.set(reference.href, reference)
    })
    if (!nextHref) break
    documentLike = await fetchGithubDocument(nextHref)
    nextHref = getNextHref(getRequiredRoot(documentLike, LIST_CONTAINER_SELECTOR))
  }

  return [...references.values()]
}

async function collectStarredRepositories(pageUrl: string, generation: number): Promise<Map<string, Repository> | null> {
  const repositories = new Map<string, Repository>()
  let documentLike: ParentNode = document
  let pageNumber = 1

  while (true) {
    if (!isActiveScan(generation, pageUrl)) return null
    const root = getRequiredRoot(documentLike, STARS_CONTAINER_SELECTOR)
    addRepositories(repositories, root, STAR_REPOSITORY_SELECTOR)
    const nextHref = getNextHref(root)
    if (!nextHref) break
    pageNumber += 1
    setStatusText(message('starsManagerScanningStars', [String(pageNumber)], `Reading starred repositories (page ${pageNumber})…`))
    documentLike = await fetchGithubDocument(nextHref)
  }

  return repositories
}

async function collectMemberships(
  pageUrl: string,
  generation: number,
  references: ListReference[],
): Promise<Map<string, ListReference[]> | null> {
  const memberships = new Map<string, ListReference[]>()

  for (const [index, list] of references.entries()) {
    if (!isActiveScan(generation, pageUrl)) return null
    setStatusText(
      message(
        'starsManagerScanningList',
        [String(index + 1), String(references.length), list.name],
        `Reading List ${index + 1} of ${references.length}: ${list.name}`,
      ),
    )

    let documentLike = await fetchGithubDocument(list.href)
    while (true) {
      if (!isActiveScan(generation, pageUrl)) return null
      const root = getRequiredRoot(documentLike, '#user-list-repositories')
      addListMembership(memberships, list, root)
      const nextHref = getNextHref(root)
      if (!nextHref) break
      documentLike = await fetchGithubDocument(nextHref)
    }
  }

  return memberships
}

function createView(container: Element): ManagerView {
  document.querySelector(`[${STAR_MANAGER_ATTRIBUTE}]`)?.remove()

  const root = document.createElement('section')
  root.setAttribute(STAR_MANAGER_ATTRIBUTE, '')
  root.className = 'github-helper-star-manager'
  root.setAttribute('aria-label', message('starsManagerTitle', undefined, 'Star manager'))

  const statusRow = document.createElement('div')
  statusRow.className = 'github-helper-star-manager__status-row'
  const status = document.createElement('span')
  status.className = 'github-helper-star-manager__status'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  const retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'github-helper-star-manager__retry'
  retry.textContent = message('starsManagerRetry', undefined, 'Retry')
  retry.hidden = true
  statusRow.append(status, retry)

  const results = document.createElement('div')
  results.className = 'github-helper-star-manager__results'
  results.hidden = true

  root.append(statusRow, results)
  container.parentElement?.insertBefore(root, container)
  return { root, status, retry, results }
}

function setStatusText(text: string): void {
  document.querySelector<HTMLElement>(`[${STAR_MANAGER_ATTRIBUTE}] .github-helper-star-manager__status`)?.replaceChildren(document.createTextNode(text))
}

function setStatus(view: ManagerView, text: string, retry = false): void {
  view.status.replaceChildren(document.createTextNode(text))
  view.retry.hidden = !retry
}

function renderBadges(repositories: Map<string, Repository>, memberships: Map<string, ListReference[]>): void {
  clearRepositoryBadges()
  document.querySelectorAll<HTMLAnchorElement>(`${STARS_CONTAINER_SELECTOR} ${STAR_REPOSITORY_SELECTOR}`).forEach((anchor) => {
    const repository = getRepository(anchor)
    if (!repository || !repositories.has(repository.key)) return
    const lists = memberships.get(repository.key)
    if (!lists?.length) return

    const badges = document.createElement('span')
    badges.setAttribute('data-github-helper-star-badges', '')
    badges.className = 'github-helper-star-manager__badges'
    lists.forEach((list) => {
      const link = document.createElement('a')
      link.href = list.href
      link.textContent = list.name
      link.className = 'github-helper-star-manager__badge'
      link.title = list.name
      badges.append(link)
    })
    anchor.parentElement?.append(badges)
  })
}

function renderUnarchived(view: ManagerView, repositories: Map<string, Repository>, memberships: Map<string, ListReference[]>): number {
  const unarchived = [...repositories.values()]
    .filter((repository) => !memberships.has(repository.key))
    .sort((left, right) => left.key.localeCompare(right.key))

  view.results.replaceChildren()
  const heading = document.createElement('h2')
  heading.className = 'github-helper-star-manager__heading'
  heading.textContent = message('starsManagerUnarchived', undefined, '未歸檔清單')
  view.results.append(heading)

  if (!unarchived.length) {
    const empty = document.createElement('p')
    empty.textContent = message('starsManagerUnarchivedEmpty', undefined, '沒有未歸檔的 Repository。')
    view.results.append(empty)
  } else {
    const list = document.createElement('ul')
    list.className = 'github-helper-star-manager__repository-list'
    unarchived.forEach((repository) => {
      const item = document.createElement('li')
      const link = document.createElement('a')
      link.href = repository.href
      link.textContent = repository.key
      item.append(link)
      list.append(item)
    })
    view.results.append(list)
  }

  view.results.hidden = false
  return unarchived.length
}

function isActiveScan(generation: number, pageUrl: string): boolean {
  return generation === scanGeneration && pageUrl === window.location.href && isCurrentGithubStarsPage()
}

async function scan(view: ManagerView, pageUrl: string, generation: number): Promise<void> {
  const repositories = await collectStarredRepositories(pageUrl, generation)
  if (!repositories || !isActiveScan(generation, pageUrl)) return

  setStatus(view, message('starsManagerDiscoveringLists', undefined, 'Discovering GitHub Lists…'))
  const references = await collectListReferences(pageUrl, generation)
  if (!references || !isActiveScan(generation, pageUrl)) return

  const memberships = await collectMemberships(pageUrl, generation, references)
  if (!memberships || !isActiveScan(generation, pageUrl)) return

  renderBadges(repositories, memberships)
  const unarchivedCount = renderUnarchived(view, repositories, memberships)
  setStatus(
    view,
    message(
      'starsManagerSummary',
      [String(repositories.size), String(unarchivedCount)],
      `分類完成：${repositories.size} 個 Repository，${unarchivedCount} 個未歸檔。`,
    ),
  )
}

function startScan(view: ManagerView): void {
  const pageUrl = window.location.href
  const generation = ++scanGeneration
  clearRepositoryBadges()
  view.results.replaceChildren()
  view.results.hidden = true
  view.retry.hidden = true
  setStatus(view, message('starsManagerReadingStars', undefined, 'Reading starred repositories…'))

  void scan(view, pageUrl, generation).catch((error: unknown) => {
    if (!isActiveScan(generation, pageUrl)) return
    const reason = error instanceof Error ? error.message : 'Unknown error'
    setStatus(
      view,
      message('starsManagerIncomplete', reason, `分類資料未完成：${reason}`),
      true,
    )
  })
}

export function runStarManager(): void {
  if (!isCurrentGithubStarsPage()) {
    document.querySelector(`[${STAR_MANAGER_ATTRIBUTE}]`)?.remove()
    lastRunUrl = null
    waitingForUrl = null
    scanGeneration += 1
    return
  }

  const container = document.querySelector(STARS_CONTAINER_SELECTOR)
  const listsContainer = document.querySelector(LIST_CONTAINER_SELECTOR)
  if (!container || !listsContainer) {
    const pageUrl = window.location.href
    if (waitingForUrl !== pageUrl) {
      waitingForUrl = pageUrl
      void Promise.all([waitForElement(STARS_CONTAINER_SELECTOR), waitForElement(LIST_CONTAINER_SELECTOR)])
        .then(() => {
          waitingForUrl = null
          if (window.location.href === pageUrl) runStarManager()
        })
        .catch(() => {
          waitingForUrl = null
        })
    }
    return
  }
  waitingForUrl = null
  if (lastRunUrl === window.location.href && document.querySelector(`[${STAR_MANAGER_ATTRIBUTE}]`)) return

  lastRunUrl = window.location.href
  const view = createView(container)
  view.retry.addEventListener('click', () => startScan(view))
  startScan(view)
}
