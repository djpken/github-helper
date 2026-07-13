// All api.github.com calls used by the content script and popup. Runs as plain
// fetch (not GM_xmlhttpRequest) — GitHub's API sends permissive CORS headers,
// so this works the same from an extension's content-script/popup context as
// it did from page context in the original userscript.

export interface RepoOwner {
  login: string
  avatar_url: string
  repos_url: string
}

export interface RepoDetail {
  full_name: string
  size: number
  pushed_at: string
  owner: RepoOwner
  description: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  language: string | null
  license: { name: string } | null
  homepage: string | null
  html_url: string
  updated_at: string
  message?: string // present on GitHub API error responses (e.g. rate limit, 404)
}

function authHeaders(token: string): Record<string, string> {
  return token ? { authorization: `token ${token}` } : {}
}

// repoPath must include the leading slash, e.g. "/facebook/react".
export async function fetchRepoDetail(repoPath: string, token: string): Promise<RepoDetail> {
  const res = await fetch(`https://api.github.com/repos${repoPath}`, {
    headers: authHeaders(token),
  })
  return res.json()
}
