# Published content

The pages of the reference site, `https://docs.developer.altium.com/platform-mcp-docs/`, which `website/` builds on
every merge to `main`. A file here is published only when `website/pages.cjs` lists it, so this README is not.

Everything that changes with a release belongs here: tool names and behavior, sample prompts, guides, client detail,
troubleshooting, the glossary and the changelog. The stable introduction and quick start belong in
[`devcenter/`](../devcenter/README.md); a fact lives in one of the two, and the other links to it.

## Rules

- **Plain Markdown, no front matter.** `.md` is CommonMark, not MDX, so a page renders the same on GitHub and on the
  site. Titles come from the `# H1`; labels, order, URLs and descriptions come from `website/pages.cjs`. The one
  exception is the home page, `index.mdx`, which uses the theme's `hero-actions` and `bc-grid` markup.
- **A new page is added to `website/pages.cjs`,** in its section, and its route to `PUBLISHED_ROUTES` in
  `website/test/site.test.mjs`. A link to an unlisted page fails the build.
- **Page URLs never change.** The Developer Center pages link to them. Add routes; don't rename or remove them.
- **Links** between pages are relative `.md` links (`./tools/schematic.md#schematic-images`). Links to the Developer
  Center use the URLs in `DEVELOPER_CENTER` in `website/pages.cjs`; a test enforces it.
- **Anchors** are GitHub's slugs (`## Choosing a workspace` is `#choosing-a-workspace`). The build fails on a broken
  link or anchor. Renaming a heading that a Developer Center page links to means updating that page in the same change.
- **Tool pages follow the [`update-tool-docs`](../.agents/skills/update-tool-docs/SKILL.md) skill,** whether a person
  or an agent edits them. `npm test` checks the tool tables against [`tools/`](../tools/README.md).
- **Unknowns, unconfirmed behavior and placeholder URLs** go to `docs/OPEN-ISSUES.md`, never into page text.

## Source of truth

Every fact comes from the Platform MCP source (`rnd/platform-mcp`, checked out as `PlatformMcp` next to this
repository). Check against it, never against memory or another product's docs:

| Fact | Where it is |
| --- | --- |
| Tool names, what each does, its limits | `Common/Altium.MCP.Shared/Altium.MCP.Shared/Tools/<Area>/*.md`: the `name:` (prefixed `a365_`) and the text outside `#if AD` blocks |
| Which tools production serves | `src/Altium.PlatformMcp.WebApi/Tools/**/*.Tool.cs`: a class with `[AvailableIn(DeploymentEnvironment.Dev)]` is not in production; leave it out |
| Which connections a tool appears on | `[AvailableOn(...)]` on the same classes; see `docs/CONNECTION_RESTRICTIONS.md` in that repository |
| Read-only or destructive | The `ReadOnly` and `Destructive` flags of `[McpServerTool(...)]` |
| Licensing, sign-in, rate limits, error text | `src/Altium.PlatformMcp.WebApi/Licensing/`, `Authentication/`, `Mcp/WorkspaceRateLimitFilter.cs`, `McpServiceCollectionExtensions.cs` |
| Public URL and sign-in | `https://mcp.altium.com/.well-known/oauth-protected-resource` and the authorization server it names |

The pages were last checked against Platform MCP `master` at `a4025f10` (2026-11-19). When you check them against
the source again, update that line.

## Writing

- Address the reader as "you". Name UI as the client shows it, in bold (**Customize → Connectors**), and quote example
  prompts in italics.
- Put a link in the sentence that needs it, on the words that name the target; never as a parenthesised aside such as
  "(see [Page](...))".
- Write what the user sees and does, not how the server is built.
- No em or en dashes and no curly quotes. Don't call anything internal.
- Never name a licence feature id or give a rate-limit number: say what the error means and to try again shortly.

`npm test` checks every published page for the rules above that a pattern can catch.
