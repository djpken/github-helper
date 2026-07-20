---
status: superseded by ADR-0003
---

# Keep Star manager separate from Trending

The extension exposes GitHub Star management in its own extension-owned page instead of adding interactive state to Trending. Trending remains a read-only discovery view, while Star manager handles the user's starred repositories and List classification; both may reuse the existing settings and GitHub API helpers.
