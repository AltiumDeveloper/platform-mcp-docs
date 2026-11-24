# Contributing

Thanks for improving the Altium 365 MCP Server documentation. Read [AGENTS.md](AGENTS.md) first: it says where each kind
of content goes and the rules each part follows.

## In short

- **Introduction and quick start** are in [`devcenter/`](devcenter/) and are published on Altium Developer Center.
  Keep them stable and link to the reference site by absolute URL.
- **Everything else** is in [`docs/`](docs/) and is published on the reference site. A new page is listed in
  [`website/pages.cjs`](website/pages.cjs).
- **Page URLs never change**, because the Developer Center pages link to them.

## Preview and check

Node 22 or later:

```bash
cd website
npm ci
npm start        # live preview
npm test         # unit tests
npm run build    # the CI checks: links, anchors, search index, llms.txt, Developer Center links
```

## Pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/) where practical (`docs(tools): …`, `fix(website): …`).
- A PR is ready when `npm test` and `npm run build` pass. CI runs both.
- If you change a Developer Center page, say so in the PR description, so it gets republished.

## Reporting problems

Open an issue for a mistake in the documentation. For a problem with the MCP Server itself, use the
channels in [SECURITY.md](SECURITY.md) for security issues, and Altium support for everything else.
