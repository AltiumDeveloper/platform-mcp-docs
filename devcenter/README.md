# Developer Center pages

The pages in this folder are published on the
[Altium Developer Center documentation](https://www.altium.com/documentation/altium-developer-center) portal, not on
the reference site. They are the stable introduction and quick start; everything that changes with each release
(the tools, sample prompts, troubleshooting) lives on the reference site, built from [`docs/`](../docs/).

| Source | Dev Center page | Where it sits |
| --- | --- | --- |
| [`altium-365-mcp.md`](altium-365-mcp.md) | Altium 365 MCP Server | A capability of **Altium 365**, next to the Altium 365 API |
| [`altium-365-mcp-quick-start.md`](altium-365-mcp-quick-start.md) | Altium 365 MCP Server Quick Start Guide | **Quick Start Guides**, next to the Altium 365 API, Altium Designer SDK and Octopart API guides |

## Publishing

Republish both pages whenever they change here, typically with a release of the MCP Server. Copy each page as it is:
the title is the `# H1`, and the portal adds its own summary ("At a Glance").

## Rules for these pages

- **Plain Markdown.** No front matter, MDX or HTML, so a page pastes into the portal as it is.
- **Absolute links.** Links to the reference site use its full URL, `https://docs.developer.altium.com/platform-mcp-docs/…`, with the trailing slash. The site
  build checks that every such link resolves to a page and, for a `#fragment`, to a heading on it, so a page that moves
  or a renamed heading on the reference site fails the build here first. The only relative links are to screenshots in
  an `images/` folder next to the pages.
- **Stable content.** Keep these pages to what changes rarely: what the server is, what it is for, how to connect it,
  and the first questions to ask. Tool names, per-tool behavior and release-specific detail belong on the reference
  site.
