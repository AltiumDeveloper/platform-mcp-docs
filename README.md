# Altium 365 MCP Server documentation

Documentation for the **Altium 365 MCP Server**, the cloud service at `https://mcp.altium.com` that connects AI
assistants to the projects in an Altium 365 workspace through the open
[Model Context Protocol](https://modelcontextprotocol.io/): list projects, read the compiled schematic of any revision,
render and highlight sheets, compare revisions and variants, read project history, and manage Altium 365 comments.

The documentation is published in two places, like the other Altium developer products:

| Where | What | Source |
| --- | --- | --- |
| [Altium Developer Center](https://www.altium.com/documentation/altium-developer-center) | The stable introduction and the Quick Start Guide | [`devcenter/`](devcenter/) |
| **<https://docs.developer.altium.com/platform-mcp-docs/>** | The reference: every tool, sample prompts, guides, troubleshooting, with site search and [`llms.txt`](https://docs.developer.altium.com/platform-mcp-docs/llms.txt) | [`content/`](content/), built by [`website/`](website/) |

## Where things are

[AGENTS.md](AGENTS.md) lists the folders, and each folder's README says what it is for. To preview the site, see
[`website/`](website/README.md). To contribute, see [CONTRIBUTING.md](docs/CONTRIBUTING.md); known gaps are in
[OPEN-ISSUES.md](docs/OPEN-ISSUES.md).

## License

MIT. See [LICENSE](LICENSE).
