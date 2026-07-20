---
status: superseded by ADR-0003
---

# Defer GitHub List writes

The first Star manager slice reads the authenticated user's starred repositories through GitHub's documented API, but does not add or remove repositories from native Lists. GitHub documents Lists as a public-preview UI feature without a supported public List API surface, so the extension defers List writes instead of depending on undocumented requests or brittle DOM automation.
