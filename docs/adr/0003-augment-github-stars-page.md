---
status: accepted
---

# Augment the GitHub stars page in place

The first Star manager slice runs as a content-script enhancement on the logged-in GitHub stars page instead of using a standalone extension page. It relies on the page's existing session without reading or exporting raw session cookies, and accepts coupling to GitHub's rendered DOM in exchange for avoiding a second authentication flow and an unsupported List API.

The enhancement keeps GitHub's native search, sort, and filter controls, then adds read-only native List badges to repository rows and a separate 「未歸檔清單」 presentation for starred repositories that belong to no List; it does not create a local label system or pretend that the pseudo-list is a GitHub List.

Because the all-stars rows do not expose complete List membership, the extension derives a read-only `Repository → Lists` map by following the native List links and parsing those same-origin pages. It never extracts session cookies or calls undocumented API endpoints; this deliberately accepts slower loading and DOM breakage when GitHub changes its markup.

The extension may show 「分類資料未完成」 while any discovered List page or pagination is still loading or has failed. It adds a Repository to 「未歸檔清單」 only after the complete discovered List data has loaded successfully, never from a partial scan.

The scan runs in the background without an arbitrary repository-count cap: native stars rows render first, then all discovered Lists and their pagination are read before classification is finalized.

Global 「未歸檔」判定 requires both the complete starred-repository pagination and the complete discovered List pagination; the currently visible page is only the initial presentation.

Each visit or Turbo navigation performs one scan. The extension does not poll or persist session-derived star/List data in `chrome.storage`; a reload starts a fresh scan.

Scanning is non-blocking: a status bar reports progress with an accessible live region, shows a completion summary, and offers retry when classification data is incomplete.

The initial implementation scans pages sequentially to avoid request bursts; bounded concurrency is deferred until measured latency justifies it.

Native List badges remain ordinary links to GitHub's List pages. 「未歸檔清單」 is a local read-only presentation of repository links and does not introduce a synthetic GitHub route or duplicate native filtering.

The first slice is limited to the current user's `/{username}?tab=stars` profile route. It does not inject into `/stars`, List pages, repository pages, or another user's profile.

The enhancement activates only when the page belongs to the currently authenticated user. Other users' public stars pages remain untouched, avoiding unnecessary scans and ambiguity over whose classification is being presented.

If the current user's identity cannot be verified from the page, the Star manager fails closed: it injects nothing and leaves the native GitHub page unchanged.

The extension popup includes an entry point to open the current user's Stars page. It must resolve the username from the currently open, verifiable GitHub page or another same-session rendered-page signal; it must not read raw cookies, call an undocumented identity endpoint, or guess a username. If identity cannot be verified, the entry point remains unavailable and the user can navigate to their Stars page manually.

Activating the popup entry opens the verified user's Stars page in a new tab, preserving the user's current tab.

When the popup cannot verify a current GitHub identity, it shows the entry as disabled with a short explanation rather than hiding it, so the user can understand why the action is unavailable.

The popup checks only the currently active tab for a verifiable GitHub identity; it does not inspect other tabs.
