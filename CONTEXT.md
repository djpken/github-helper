# GitHub Helper

A Chrome extension that annotates github.com pages with information GitHub's own UI doesn't surface: repository size, whether a repository has gone quiet, and a shortcut to a user's other repositories.

## Language

**Repository / repo**:
A GitHub repository. The only term used across code, UI copy, and the extension's own name/description.
_Avoid_: Warehouse — a machine-translation artifact from the original userscript's store metadata (Chinese 仓库 → "warehouse"); never appears in code or in-app copy.

**Inactivity warning**:
The red banner shown when a repository's last push was 1+ years ago.
_Avoid_: Using interchangeably with Caution — they are two distinct severities, not two names for the same thing.

**Caution**:
The yellow banner shown when a repository's last push was 6+ months (but under 1 year) ago. One severity level below Inactivity warning.

**Inactive**:
A repository is inactive based on its last *push* time (`pushed_at`), not its last metadata update (`updated_at`). Star/fork count changes or repo settings edits do not count as activity.

**Quick-jump**:
The dropdown menu inserted next to a repository's Code button, listing the same owner's other repositories for fast switching. Distinct from "repo list", which just means the raw array of repository data returned by the GitHub API.
