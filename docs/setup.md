# Getting started

## Requirements

| Requirement | Notes |
| --- | --- |
| **An Altium 365 workspace** | You sign in as a member of it. The server reads the projects managed there; it cannot see a project that exists only on your PC. |
| **The required license on the workspace** | The MCP Server is licensed per workspace. Without the license, the tools fail with *Workspace lacks required MCP license feature.*, apart from the workspace list; ask your workspace administrator. |
| **An AI client that connects to remote MCP servers** | Claude (web and desktop), Claude Code and VS Code are covered below. The client must support the MCP sign-in flow; see [Other clients](#other-clients). |

Nothing is installed on your PC, and Altium Designer does not need to be running.

## The server URL

Every client uses the same address:

```text
https://mcp.altium.com
```

You sign in once per client with your Altium account. The client does not need its own OAuth app or client ID: it
identifies itself to Altium's sign-in service automatically.

## Connect Claude

These steps work for Claude on the web (<https://claude.ai>) and in Claude Desktop, which share the same connectors.

1. Open **Customize → Connectors**, click **+ Add**, then **Add custom connector**.
2. Enter a name, for example *Altium 365*, and the URL `https://mcp.altium.com`, then click **Continue**.
3. Review the detected authentication settings. Under **OAuth client**, keep **Use Claude's published identity**, the
   recommended option, then click **Add**. **Register automatically** does not work with Altium's sign-in service.
4. Click **Connect**, sign in with your Altium account in the browser window that opens, and allow access.

On a Claude Team or Enterprise plan, members cannot add custom connectors. An owner adds it once for the organization:
**Organization settings → Connectors**, **Add**, then **Custom → Web**, with the same name, URL and OAuth client. Each
member then finds it under **Customize → Connectors**, clicks **Connect** and signs in as themselves.

## Connect Claude Code

Add the server from a terminal:

```bash
claude mcp add --transport http altium-365 https://mcp.altium.com
```

Then start Claude Code, run `/mcp`, choose **altium-365** and authenticate, or run `claude mcp login altium-365` from
your shell. Claude Code opens the Altium sign-in page in your browser. It finds Altium's sign-in method by itself, so no
client ID is needed.

## Connect VS Code

Add the server to your MCP configuration, either `.vscode/mcp.json` in a workspace or your user configuration
(**MCP: Open User Configuration** in the Command Palette):

```json
{
  "servers": {
    "altium-365": {
      "type": "http",
      "url": "https://mcp.altium.com"
    }
  }
}
```

Start the server from the configuration file, or manage it under **Chat: Open Customizations → MCP Servers**. VS Code
asks you to sign in with your Altium account the first time. The tools are then available in Copilot Chat in agent
mode.

## Other clients

Altium's sign-in service accepts clients that identify themselves with a *client ID metadata document*, the method the
current MCP authorization specification recommends. It does not offer dynamic client registration. A client that
supports only dynamic registration, or that cannot sign in to a remote server at all, cannot connect.

## Choosing a workspace

After you sign in, the tools work on your **default workspace**. To use another one, say so:

> *"Which Altium 365 workspaces do I have access to?"*
>
> *"Use the Acme Robotics workspace for the rest of this conversation."*

The assistant lists your workspaces with `a365_platform_workspace_list` and then targets the one you chose on each call.
See [Platform](./tools/platform.md). Administrators can instead confine a connection to one workspace; see
[Restricting a connection to one workspace](./security.md#restricting-a-connection-to-one-workspace).

## Updates

Altium updates the server for you, so there is nothing to install or upgrade. The [Changelog](../CHANGELOG.md) lists
what changed in each release.

## Check that it works

Ask a question that needs the server:

> *"Using Altium 365, list the ten most recently modified projects in my workspace."*

Approve the tool call when the client asks. If you get a list of your projects back, you are set up: go to
[Try it now](./sample-prompts.md). If not, see [Troubleshooting](./troubleshooting.md).
