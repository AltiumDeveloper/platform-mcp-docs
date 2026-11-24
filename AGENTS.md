# AGENTS.md

This repository holds the Altium 365 MCP Server documentation. Each folder's README says what the folder is for and
the rules for it; read it before you change anything in that folder.

## The one rule

> **Stable introduction and quick start go to `devcenter/`; everything that changes with a release goes to `content/`.**

## Folders

| Folder | What it is for |
| --- | --- |
| [`content/`](content/README.md) | The reference site's pages, with their rules, source of truth and writing style |
| [`devcenter/`](devcenter/README.md) | The Developer Center pages, and how they are published |
| [`tools/`](tools/README.md) | Production's tool list, which the tool pages are checked against |
| [`website/`](website/README.md) | The site build and its checks |
| [`.agents/skills/`](.agents/skills/README.md) | Skills for agents working here, such as updating the tool pages |
| [`docs/`](docs/README.md) | Contributing, the security policy, open issues and working plans |

## Before you finish

`cd website && npm ci && npm test && npm run build` passes.
