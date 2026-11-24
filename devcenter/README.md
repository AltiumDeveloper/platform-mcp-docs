# Developer Center pages

The stable introduction and quick start for the Altium 365 MCP Server, published on the
[Altium Developer Center documentation](https://www.altium.com/documentation/altium-developer-center) portal rather
than on the reference site. The product page sits under **Altium 365**, next to the Altium 365 API; the Quick Start
Guide sits under **Quick Start Guides**. Everything that changes with each release (the tools, sample prompts,
troubleshooting) is on the reference site, built from [`content/`](../content/README.md).

## Publishing

Republish the pages whenever they change here, typically with a release of the MCP Server. Copy each page as it is:
the title is the `# H1`, and the portal adds its own summary ("At a Glance").

## Rules

- **Plain Markdown.** No front matter, MDX or HTML, so a page pastes into the portal as it is.
- **Absolute links.** Links to the reference site use its full URL,
  `https://docs.developer.altium.com/platform-mcp-docs/…`, with the trailing slash. `npm run build` checks that every
  such link resolves to a page and, for a `#fragment`, to a heading on it, so a moved page or renamed heading on the
  reference site fails the build here first. The only relative links are to screenshots in an `images/` folder next
  to the pages.
- **Stable content.** Keep these pages to what changes rarely: what the server is, what it is for, how to connect it,
  and the first questions to ask. Tool names, per-tool behavior and release-specific detail belong on the reference
  site.
