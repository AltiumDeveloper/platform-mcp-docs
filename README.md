# Altium 365 MCP Server documentation

Documentation for the **Altium 365 MCP Server**, the cloud service at `https://mcp.altium.com` that connects AI
assistants to the projects in an Altium 365 workspace through the open
[Model Context Protocol](https://modelcontextprotocol.io/): list projects, read the compiled schematic of any revision,
render and highlight sheets, compare revisions and variants, read project history, and manage Altium 365 comments.

The documentation is published in two places, like the other Altium developer products:

| Where | What | Source |
| --- | --- | --- |
| [Altium Developer Center](https://www.altium.com/documentation/altium-developer-center) | The stable introduction and the Quick Start Guide | [`devcenter/`](devcenter/) |
| **<https://docs.developer.altium.com/platform-mcp-docs/>** | The reference: every tool, sample prompts, guides, troubleshooting, with site search and [`llms.txt`](https://docs.developer.altium.com/platform-mcp-docs/llms.txt) | [`docs/`](docs/), built by [`website/`](website/) |

## Layout

```
devcenter/        Developer Center pages: plain Markdown, published to the portal (see devcenter/README.md)
docs/             The reference site's pages: plain Markdown, rendered here and on GitHub
  index.mdx       The site's home page
  *.md            Get started, guides and help pages
  tools/          The tool reference: one page per tool group
website/          Docusaurus site over docs/, on the shared Altium theme; pages.cjs lists every published page
.github/workflows/docs.yml  Builds and checks the site on every PR; deploys main to GitHub Pages
```

## Build and preview

Node 22 or later:

```bash
cd website && npm ci && npm start
```

`npm test` runs the unit tests. `npm run build` runs the same checks as CI: broken links and anchors, the search
index, the `llms.txt` surface, and the links from the Developer Center pages into the site.

The look is the theme shared with the other Altium developer sites,
[`@altium-developer/docusaurus-theme`](https://github.com/AltiumDeveloper/docusaurus-theme), installed from its
GitHub Release tarball. To update it, change the version in the URL in `website/package.json` (twice: the tag and the
file name) and run `npm install`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), and [AGENTS.md](AGENTS.md) for where content goes and the rules each part
follows. Known gaps are tracked in [OPEN-ISSUES.md](OPEN-ISSUES.md).

## License

MIT. See [LICENSE](LICENSE).
