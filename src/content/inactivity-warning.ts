// Ports monkey.js:746-853 (displayMessage/renderWarning/renderCaution/checkCommitDate).
// "Inactive" is keyed on the repo's last *push* time, not its last metadata
// update — see CONTEXT.md.

const BANNER_ID = 'zh-banner-warning'

function displayMessage(el: HTMLElement): void {
  document.querySelector('#js-repo-pjax-container')?.insertAdjacentElement('beforebegin', el)
}

function renderBanner(backgroundColor: string, textColor: string, height: string, fontSize: string, message: string, timediff: string): void {
  const banner = document.createElement('div')
  banner.id = BANNER_ID
  banner.style.cssText = `background-color:${backgroundColor};height:${height};margin-bottom:20px;display:flex;justify-content:center;align-items:center;color:${textColor};font-size:${fontSize};position:relative;`
  banner.textContent = message

  const smallTag = document.createElement('div')
  smallTag.style.cssText = 'position:absolute;bottom:0;right:0;padding:5px 10px;font-size:14px;border-top-left-radius:5px;'
  smallTag.textContent = timediff
  banner.appendChild(smallTag)

  displayMessage(banner)
}

// The original template omits the "N years" segment entirely when N is 0
// (monkey.js:838-844, via a regex strip on the raw template). chrome.i18n
// substitutes placeholders eagerly, so that trick isn't available here —
// instead this picks between two locale message variants (see _locales/*/messages.json).
function formatTimeDiff(pushedAt: Date, now: Date): string {
  const yearsDiff = now.getFullYear() - pushedAt.getFullYear()
  const monthsDiff = now.getMonth() - pushedAt.getMonth()
  const daysDiff = now.getDate() - pushedAt.getDate()

  let adjustedMonths = monthsDiff
  let adjustedDays = daysDiff
  if (adjustedDays < 0) {
    adjustedMonths--
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    adjustedDays += lastMonth.getDate()
  }

  let finalYears = yearsDiff
  if (adjustedMonths < 0) {
    finalYears--
    adjustedMonths += 12
  }

  return finalYears > 0
    ? chrome.i18n.getMessage('timediff', [String(finalYears), String(adjustedMonths), String(adjustedDays)])
    : chrome.i18n.getMessage('timediffNoYears', [String(adjustedMonths), String(adjustedDays)])
}

export function checkCommitDate(pushedAt: string): void {
  if (document.querySelector(`#${BANNER_ID}`)) return

  const pushedDate = new Date(pushedAt)
  const now = new Date()
  const timediff = formatTimeDiff(pushedDate, now)
  const daysSinceLastCommit = (now.getTime() - pushedDate.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceLastCommit > 365) {
    renderBanner('red', 'white', '100px', '36px', chrome.i18n.getMessage('renderWarning'), timediff)
  } else if (daysSinceLastCommit > 182.5) {
    renderBanner('yellow', 'black', '50px', '24px', chrome.i18n.getMessage('renderCaution'), timediff)
  }
}
