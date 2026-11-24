# AGENTS.md: working model for this repository

This repository documents the Altium 365 MCP Server. Read this before changing anything.

## The one rule

> **Stable introduction and quick start go to `devcenter/`; everything that changes with a release goes to `docs/`.**

The two folders are published to different sites by different processes. `devcenter/` is copied by hand into the
[Altium Developer Center](https://www.altium.com/documentation/altium-developer-center) portal on each release;
`docs/` is built into the reference site on every merge to `main`. A fact lives in one of them, and the other links
to it.

| Content | Goes in |
| --- | --- |
| What the server is, what it is for, requirements, connecting a client, the first questions to ask | `devcenter/` |
| Tool names and behavior, sample prompts, guides, client detail, troubleshooting, glossary | `docs/` |

## Map

```
devcenter/
  README.md                          The publishing contract for the Developer Center pages. Not published.
  altium-365-mcp.md                  Dev Center: the product page (a capability of Altium 365)
  altium-365-mcp-quick-start.md      Dev Center: the Quick Start Guide
docs/
  index.mdx                          Reference home page (MDX for its buttons and cards)
  *.md                               Get started, guides and help pages
  tools/                             Tool reference: one page per bounded context (the area in the tool name)
website/
  pages.cjs                          Every published page: file, URL, sidebar section, label, description, icon.
                                     Also DEVELOPER_CENTER, the Dev Center URLs the reference links to.
  docusaurus.config.js               Site config on @altium-developer/docusaurus-theme
  src/search/engine.mjs              Search ranking (kinds: tool, guide, help)
  src/css/custom.css                 The tool-group icons (`.bc-<icon>`), nothing else
  scripts/                           search-index, search-check, llms, llms-check, devcenter-check
  test/site.test.mjs                 Pinned URLs, icons, Dev Center URLs, Markdown helpers, search, checks
CHANGELOG.md                         Published as /changelog/: what changed in each release, newest first
OPEN-ISSUES.md                       Unknowns and things to confirm. Never put them in page text.
docs/plans/                          Working plans, Markdown or HTML. Gitignored: never commit a plan.
```

## Rules for `devcenter/`

- **Plain Markdown only.** No front matter, MDX or HTML: the pages are pasted into the portal as they are.
- **Absolute links to the reference site**, `https://docs.developer.altium.com/platform-mcp-docs/<route>/`, with the
  trailing slash. The only relative links are to an `images/` folder next to the pages.
- **Stable content.** No tool names or per-release detail; link to the reference for those.
- `npm run build` runs `devcenter:check`, which fails if a link into the site does not resolve to a page or a
  heading. Renaming a heading that a Dev Center page links to means updating the Dev Center page in the same change,
  and telling the publishers.

## Rules for `docs/`

- **Plain Markdown, no front matter.** `.md` is CommonMark, not MDX, so a page renders the same on GitHub and on the
  site. Titles come from the `# H1`; labels, order, URLs and descriptions come from `website/pages.cjs`. The one
  exception is `docs/index.mdx`, which uses the theme's `hero-actions` and `bc-grid` markup.
- **A new page is added to `website/pages.cjs`,** in its section, and its route to `PUBLISHED_ROUTES` in
  `website/test/site.test.mjs`. Only listed files are published; a link to an unlisted page fails the build.
- **Page URLs never change.** The Developer Center pages link to them. Add routes; don't rename or remove them.
- **Links:** relative `.md` links between pages (`./tools/schematic.md#schematic-images`); the Dev Center pages by the URLs in
  `DEVELOPER_CENTER` (a test enforces it).
- **Anchors** are GitHub's slugs (`## Choosing a workspace` → `#choosing-a-workspace`). The build fails on a broken
  link or anchor.
- **Tool names are found by search from the tool tables:** `scripts/search-index.mjs` makes a record for every
  backticked `a365_` tool name in the first column of a table, and for the tools a tool page names in prose. Keep a
  tool in its table's first column, in backticks, one tool per row.
- **Every tool row has a Kind:** *Read-only*, *Writes* or *Writes, destructive*, from the tool's `ReadOnly` and
  `Destructive` flags. Describe what can change in terms of kinds and link to
  `docs/tools/index.md#how-tools-are-classified`; never list which tools write in prose, because that set changes.
- **The tool reference describes production.** It lists the tools `https://mcp.altium.com` serves, and no others.
- **A release that changes the tools gets a `CHANGELOG.md` entry**, newest first, naming the tools added, changed or
  removed and linking their pages.

## Source of truth

There is no separate manual: every fact comes from the Platform MCP source (`rnd/platform-mcp`, checked out as
`PlatformMcp` next to this repository). Check against it, never against memory or another product's docs:

| Fact | Where it is |
| --- | --- |
| Tool names, what each does, its limits | `Common/Altium.MCP.Shared/Altium.MCP.Shared/Tools/<Area>/*.md`: the `name:` (prefixed `a365_`) and the text outside `#if AD` blocks |
| Which tools production serves | `src/Altium.PlatformMcp.WebApi/Tools/**/*.Tool.cs`: a class with `[AvailableIn(DeploymentEnvironment.Dev)]` is not in production; leave it out |
| Which connections a tool appears on | `[AvailableOn(...)]` on the same classes; see `docs/CONNECTION_RESTRICTIONS.md` |
| Read-only or destructive | The `ReadOnly` and `Destructive` flags of `[McpServerTool(...)]` |
| Licensing, sign-in, rate limits, error text | `src/Altium.PlatformMcp.WebApi/Licensing/`, `Authentication/`, `Mcp/WorkspaceRateLimitFilter.cs`, `McpServiceCollectionExtensions.cs` |
| Public URL and sign-in | `https://mcp.altium.com/.well-known/oauth-protected-resource` and the authorization server it names |

The reference was last checked against Platform MCP `master` at `a4025f10` (2026-11-19). When you sync
it, update that line.

## Writing

For new text, address the reader as "you", name UI as the client shows it, in bold
(**Customize → Connectors**), and quote example prompts in italics. Put a link in the sentence that needs it, on the
words that name the target; never as a parenthesised aside such as "(see [Page](...))". Write what the user sees and does, not how the
server is built. Unknowns, unconfirmed behavior and placeholder URLs go to `OPEN-ISSUES.md`, never into page text.

## Validation (from the repository root)

```bash
cd website && npm ci && npm test && npm run build && cd ..
```

## Definition of done

- [ ] `npm test` and `npm run build` pass.
- [ ] New pages are in `pages.cjs` and `PUBLISHED_ROUTES`; no route changed.
- [ ] A change to a heading or page that a Dev Center page links to updates that Dev Center page.
- [ ] Release-specific detail is in `docs/`, not `devcenter/`.
- [ ] Tool pages match the production tool set in the Platform MCP source.
- [ ] Anything unconfirmed is in `OPEN-ISSUES.md`.
