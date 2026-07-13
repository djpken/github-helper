// Ports monkey.js:1067-1172 — OSS Insight / Active Forks shortcut buttons and
// the delete-repository button (with its 3x confirm() guard).
import { getMReponame } from './repo-quick-jump'

function targetElement(usePageHeadActions: boolean): Element | null {
  return usePageHeadActions ? document.querySelector('.pagehead-actions') : getMReponame()
}

export function insertOssInsightButton(owner: string, repo: string, usePageHeadActions: boolean): void {
  if (document.getElementById('github-ossinsight')) return
  const svgStr = `<svg width="16px" height="15px" viewBox="0 0 128 80" xmlns="http://www.w3.org/2000/svg" version="1.1"><defs><linearGradient id="linearGradient3764" x1="1" x2="47" gradientUnits="userSpaceOnUse" gradientTransform="matrix(0,-1,1,0,-1.5e-6,47.999998)"><stop stop-color="#8358b4" offset="0"/><stop stop-color="#8d65ba" offset="1"/></linearGradient></defs><path style="fill:#2a7fff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 124.3786,58.780229 c -1.27749,-1.795307 -2.68782,-3.48499 -4.11179,-5.150822 C 112.62916,44.68703 103.86053,36.715539 94.250452,30.927693 88.115128,27.228104 81.543761,24.247314 74.74074,22.809725 71.279616,22.090933 67.893432,21.719607 64.319891,21.705982 c -3.461128,0 -6.918848,0.384951 -10.37997,1.103743 -6.813243,1.437589 -13.360765,4.418379 -19.496087,8.117968 -9.606671,5.787846 -18.388938,13.762746 -26.0538323,22.701714 -1.4103405,1.662427 -2.7934283,3.352111 -4.0709103,5.150822 -1.7441892,2.394851 -1.7441892,5.21552 0,7.61037 3.9005794,5.467639 8.5574296,10.322066 13.2687846,14.784739 10.192606,9.569192 21.863688,17.578152 34.73049,20.811052 3.978932,0.99813 7.971493,1.47846 11.977677,1.47846 4.057286,0 8.022589,-0.48033 12.001521,-1.47846 12.866803,-3.2329 24.551506,-11.24526 34.757746,-20.811052 4.73861,-4.445654 9.38182,-9.313696 13.29263,-14.784739 1.71694,-2.39485 1.71694,-5.215519 0,-7.61037 m 0,0"/><path style="fill:#f9f9f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 95.010128,62.585414 c 0,16.927497 -13.728682,30.659556 -30.65958,30.659556 -16.927494,0 -30.659579,-13.728655 -30.659579,-30.659556 0,-16.927494 13.728682,-30.659582 30.659579,-30.659582 16.927497,0 30.65958,13.728679 30.65958,30.659582 m 0,0"/><path style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 81.383648,62.585414 c 0,9.395467 -7.624015,17.019479 -17.0331,17.019479 -9.409084,0 -17.033099,-7.624012 -17.033099,-17.019479 0,-9.409081 7.624015,-17.033104 17.033099,-17.033104 9.409085,0 17.0331,7.624023 17.0331,17.033104 m 0,0"/><path style="fill:#f9f9f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 65.581158,61.555935 a 5.1774597,4.889823 0 1 1 -10.35492,0 5.1774597,4.889823 0 1 1 10.35492,0 z" transform="translate(12.066285,-6.7626366)"/></svg>`
  const targetUrl = `https://ossinsight.io/analyze/${owner}/${repo}`
  const title = `${repo}  ${chrome.i18n.getMessage('ossinsight')}`
  const el = targetElement(usePageHeadActions)
  if (!el) return
  const buttonHtml = `<a id="github-ossinsight" href="${targetUrl}" target="_blank" rel="noopener noreferrer" aria-label="${title}" class="btn btn-sm tooltipped tooltipped-s">${svgStr}</a>`
  el.insertAdjacentHTML('afterbegin', usePageHeadActions ? `<li>${buttonHtml}</li>` : buttonHtml)
}

export function insertActiveForks(owner: string, repo: string, usePageHeadActions: boolean): void {
  if (document.getElementById('github-active-forks')) return
  const svgStr =
    '<svg class="octicon octicon-graph UnderlineNav-octicon d-none d-sm-inline" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M1.5 1.75a.75.75 0 00-1.5 0v12.5c0 .414.336.75.75.75h14.5a.75.75 0 000-1.5H1.5V1.75zm14.28 2.53a.75.75 0 00-1.06-1.06L10 7.94 7.53 5.47a.75.75 0 00-1.06 0L3.22 8.72a.75.75 0 001.06 1.06L7 7.06l2.47 2.47a.75.75 0 001.06 0l5.25-5.25z"></path></svg>'
  const title = `${repo}  ${chrome.i18n.getMessage('activeforks')}`
  const el = targetElement(usePageHeadActions)
  if (!el) return
  const buttonHtml = `<details class="details-reset details-overlay f5 position-relative "><summary id="active-forks-button-repo" class="btn btn-sm tooltipped tooltipped-s" aria-label="${title}"><a id="github-active-forks" href="https://techgaun.github.io/active-forks/index.html#${owner}/${repo}" target="_blank" > ${svgStr}  ${usePageHeadActions ? chrome.i18n.getMessage('activeforks_') : ''}</a></details>`
  el.insertAdjacentHTML('afterbegin', usePageHeadActions ? `<li>${buttonHtml}</li>` : buttonHtml)
}

export function insertDelBtn(
  owner: string,
  repo: string,
  usePageHeadActions = true,
  cusClass = 'dialog-show-repo-delete-home',
  element: Element | null | undefined,
  token: string,
): void {
  const svgStr =
    '<div style="display: flex; justify-content: center; align-items: center;"><svg class="octicon octicon-trash color-fg-danger" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path></svg></div>'
  const title = `[${repo}]\n  ${chrome.i18n.getMessage('deleteRepo')}`
  const el = element ?? targetElement(usePageHeadActions)
  if (!el) return
  if (el.querySelector(`#${cusClass}`)) return
  const buttonHtml = `<button id="${cusClass}" data-show-dialog-id="repo-delete-menu-dialog" type="button"
  data-view-component="true"
  class="js-repo-delete-button Button--danger Button--medium Button float-none float-sm-right ">
  <span class="Button-content">
    <span class="Button-label tooltipped tooltipped-s"  aria-label="${title}">${svgStr}${usePageHeadActions ? chrome.i18n.getMessage('deleteRepo_btn') : ''}</span>
  </span>
</button>`
  el.insertAdjacentHTML('beforeend', usePageHeadActions ? `<li>${buttonHtml}</li>` : buttonHtml)
  el.querySelector(`#${cusClass}`)?.addEventListener('click', () => {
    showDeleteConfirmations(owner, repo, token)
  })
}

function showDeleteConfirmations(owner: string, repo: string, token: string, count = 3): void {
  for (let i = 0; i < count; i++) {
    const confirmed = confirm(
      `${owner}:\n${chrome.i18n.getMessage('deleteRepo_i')}[${repo}]\n${chrome.i18n.getMessage('deleteRepo')}\n${chrome.i18n.getMessage('deleteRepo_ask')}  ${i + 1}/${count})`,
    )
    if (!confirmed) return
  }
  deleteRepository(owner, repo, token)
}

function deleteRepository(owner: string, repo: string, token: string): void {
  fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })
    .then((response) => {
      if (response.status === 204) {
        alert(`"${repo}" ${chrome.i18n.getMessage('deleteRepo_pass')}`)
        location.reload()
      } else {
        alert(`"[${repo}]"\n${chrome.i18n.getMessage('deleteRepo_failed')} ${chrome.i18n.getMessage('deleteRepo_failed_status')}${response.status}`)
      }
    })
    .catch((error) => {
      alert(`An error occurred: ${error}`)
    })
}
