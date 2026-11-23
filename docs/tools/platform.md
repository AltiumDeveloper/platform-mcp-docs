# Platform

You sign in once with your Altium account, and the tools work on your default workspace. To work in another workspace
you are a member of, the assistant passes that workspace's URL with each call; you do not sign in again.

| Tool | Kind | What it does |
| --- | --- | --- |
| `a365_platform_workspace_list` | Read-only | The Altium 365 workspaces you are a member of: name, URL, whether it is your default, description and location. Filterable by name. |

This tool works even when your default workspace lacks the required license, so you can always find a workspace that
has it.

On a connection an administrator has
[restricted to one workspace](../security.md#restricting-a-connection-to-one-workspace), this tool is not offered and
the tools do not accept a workspace URL.

Typical uses:

> *"Which Altium 365 workspaces do I have access to?"*

> *"Use the Acme Robotics workspace for the rest of this conversation."*
