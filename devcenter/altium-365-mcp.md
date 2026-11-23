# Altium 365 MCP Server

The **Altium 365 MCP Server** lets an AI assistant, such as Claude, read and act on the projects in your Altium 365
workspace. It runs in Altium's cloud: you add one URL to your AI client, sign in with your Altium account, and ask.

> *"Which projects in my workspace changed this week, and what changed in each?"*
>
> *"What is connected to the RESET net on the main board? Show me where it is on the schematic."*
>
> *"List the open comment threads on this project and suggest a reply to each."*

The assistant answers from the design data stored in your workspace, not from a description you typed or a screenshot
you pasted.

**MCP** stands for *Model Context Protocol*, an open standard for connecting applications to AI assistants. You do not
need to understand the protocol to use the server.

## What you can do with it

| Area | What you can ask for |
| --- | --- |
| **Platform** | The Altium 365 workspaces you belong to, and pointing a question at any one of them. |
| **Design** | The projects in a workspace, their details, documents, parameters, latest release, revisions and variants, and their history: who committed, released or copied what and when. |
| **Schematic** | Components, pins, nets, net classes, differential pairs, sheets and parameters of any committed revision in any variant; rendered sheets with components or nets highlighted; and what changed between two revisions or what a variant changes against the base design. |
| **Collaboration** | Create, read, reply to, edit, resolve and delete comments on schematic components and nets, the same comments your team sees in Altium 365. |

**It works on what your team shares.** The server reads committed revisions in your workspace, the latest one unless
you name another, so every answer is about the design as your colleagues see it. It does not see uncommitted edits on
your PC; commit first. [How it works](https://docs.developer.altium.com/platform-mcp-docs/how-it-works/) explains what the server reads.

> **It acts as you.** You sign in with your own Altium account, and every call runs with your Altium 365 permissions.
> [Is it safe?](https://docs.developer.altium.com/platform-mcp-docs/security/) covers the security detail.

> **This list is a snapshot, not a ceiling.** The MCP Server is under active development, and the
> [Tool reference](https://docs.developer.altium.com/platform-mcp-docs/tools/) grows with each release. If a capability you need is missing, it is worth reporting.

## What it does *not* do (current release)

- **Schematic only.** PCB layout, 3D and BOM data are not exposed.
- **No design edits.** The assistant reads designs and manages comments. It does not edit a schematic, a library or a
  project.
- **Committed revisions only.** Work you have not committed from Altium Designer is not visible.
- **Workspace projects only.** A project that exists only on your PC cannot be reached.

## Who runs the AI

The AI model is **yours**, not Altium's. You bring your own AI client and your own account, for example a Claude
subscription. The MCP Server only returns design data to that client, for the calls it makes on your behalf, and your
AI provider's terms govern what happens to the conversation.

## Get started

- [Getting started](https://docs.developer.altium.com/platform-mcp-docs/setup/)
- [Try it now](https://docs.developer.altium.com/platform-mcp-docs/sample-prompts/)
- [Tool reference](https://docs.developer.altium.com/platform-mcp-docs/tools/)
