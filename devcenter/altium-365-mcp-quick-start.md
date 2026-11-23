# Altium 365 MCP Server Quick Start Guide

The **Altium 365 MCP Server** lets an AI assistant, such as Claude, read and act on the projects in your Altium 365
workspace. This guide takes you from connecting your AI client to your first questions on a real project.

## Prerequisites

| Requirement | Notes |
| --- | --- |
| **An Altium 365 workspace** | You sign in as a member of it, and your projects are managed there. |
| **The required license on the workspace** | The MCP Server is licensed per workspace. Ask your workspace administrator if you are not sure. |
| **An AI client** | Claude (web or desktop) is the recommended starting point (<https://claude.ai>). Claude Code and VS Code are also covered in [Getting started](https://docs.developer.altium.com/platform-mcp-docs/setup/). |

There is nothing to install, and Altium Designer does not need to be running.

## Step 1: Add the server to Claude

1. In Claude, open **Customize → Connectors**, click **+ Add**, then **Add custom connector**.
2. Enter the name *Altium 365* and the URL `https://mcp.altium.com`, then click **Continue**.
3. Under **OAuth client**, keep **Use Claude's published identity**, then click **Add**.

On a Claude Team or Enterprise plan, an organization owner adds the connector under **Organization settings →
Connectors**, and members skip to Step 2. For Claude Code and VS Code, see [Getting started](https://docs.developer.altium.com/platform-mcp-docs/setup/).

## Step 2: Sign in

1. Under **Customize → Connectors**, click **Connect** on the Altium 365 connector.
2. Sign in with your Altium account in the browser window that opens, and allow access.

The tools work on your default workspace. To use another one, tell the assistant which, as described in
[Choosing a workspace](https://docs.developer.altium.com/platform-mcp-docs/setup/#choosing-a-workspace).

## Step 3: Check that it works

1. Start a new conversation and make sure the Altium 365 connector is switched on.
2. Ask:

   > *"Using Altium 365, list the ten most recently modified projects in my workspace."*

3. Approve the tool call when Claude asks for permission.

If you get a list of your projects back, you are set up. If not, see
[Troubleshooting](https://docs.developer.altium.com/platform-mcp-docs/troubleshooting/).

## Step 4: Try it now

Three of the prompts in [Try it now](https://docs.developer.altium.com/platform-mcp-docs/sample-prompts/). Replace the project name with one from your
workspace.

**1. Get your bearings.**

> *"Give me a one-page overview of the Motor Controller project: sheets, component counts, power rails, variants and
> the latest release."*

**2. Trace a signal, then see it.**

> *"What is connected to the RESET net in Motor Controller? List every pin on it with its component and value, then
> show me where it is on the schematic."*

**3. Review what changed.**

> *"What changed in the latest commit to Motor Controller? Look at parameters, footprints and wiring, and tell me which
> other parts share a net with anything that changed."*

## Next steps

- [Try it now](https://docs.developer.altium.com/platform-mcp-docs/sample-prompts/), the other prompts
- [Working with the LLM](https://docs.developer.altium.com/platform-mcp-docs/working-with-the-llm/)
- [Tool reference](https://docs.developer.altium.com/platform-mcp-docs/tools/)
- [Getting started](https://docs.developer.altium.com/platform-mcp-docs/setup/), every client and choosing a workspace
