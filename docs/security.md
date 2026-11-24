# Is it safe?

The server can reach only what your own Altium account can reach, and you decide which of its tools your AI client may
use. Three controls work together:

- **Your sign-in limits the data.** Every call runs as you, with your Altium 365 permissions.
- **You choose the tools.** Your client lets you turn tools off, or make it ask before running them.
- **Queries run in a sandbox.** The scripts the assistant writes cannot reach anything beyond the design they query.

Administrators can also [restrict a connection to one workspace](#restricting-a-connection-to-one-workspace).

The rest of this page explains each one, and what leaves your workspace.

## Access goes through your sign-in

Your client sends you to Altium's sign-in page at `auth.altium.com`, so it never sees your password. It receives a token
for the MCP server and presents it on every call. The server then acts as you: the assistant can read what you can read
in Altium 365 and comment where you can comment, and nothing more. Calls to a workspace you are not a member of are
refused, and the workspace must have the required license.

## You control which tools run

Each tool tells your client whether it is read-only, whether it writes to your workspace, and whether its change is
destructive and cannot be undone. Your client uses that to decide when to ask you for approval, and lets you block tools
you do not want the assistant to use and require approval for the rest. Most tools are read-only.
[How tools are classified](./tools/index.md#how-tools-are-classified) gives the kind of each one and where each client
sets these controls, and [Approving tool calls](./working-with-the-llm.md#approving-tool-calls) suggests a sensible
default.

## Restricting a connection to one workspace

*For administrators.* The standard connection, `https://mcp.altium.com`, can reach every workspace the signed-in user
is a member of. To confine a connection to one workspace, use that workspace's own MCP address instead:

```text
https://<workspace>.365.altium.com/svc/mcp
```

where `https://<workspace>.365.altium.com` is the address the workspace opens at in a browser. On such a connection:

- every call goes to that workspace, and the assistant is not offered a way to target another one;
- the workspace list tool is not offered;
- a user who is not a member of that workspace is refused, and so is a token issued for a different workspace;
- the user's own permissions in that workspace still apply.

This restricts the connection, not the user. Someone who adds `https://mcp.altium.com` as another connector can still
reach their other workspaces through it, so pair this with your AI client's controls over which connectors users may
add. On a Claude Team or Enterprise plan, members cannot add custom connectors, so an owner who adds only the workspace
address makes it the only route from Claude.

## Queries run in a sandbox

The scripts the assistant runs against a schematic execute in an embedded JavaScript engine on the server, with no
access to files, the network or other services, only to a read-only model of the design revision being queried. Each run is bounded by time, memory and recursion limits, and its output is truncated at 64,000
characters.

## What leaves your workspace

- **Your conversation** goes to your AI provider under your own account: your question and the tool results your client
  includes with it. That is the design data the assistant asked for, such as the components on a net or a rendered
  sheet. Your provider's terms apply, as they do when you paste a snippet into a chat by hand. The MCP server sees the
  tool calls your client makes, not the conversation around them.
- **Operational telemetry** goes to Altium: which tool ran, whether it succeeded, how long it took, the size of the
  response, which client, workspace and organisation made the call, and opaque user, session and conversation
  identifiers. It does not include your email address, your name, access tokens or workspace URLs.

## What is left to your judgement

Whether your designs may be sent to an external AI service at all is your organisation's decision, as it is for any cloud tool. And the assistant itself can be wrong: see
[The MCP server vs the LLM](./how-it-works.md#the-mcp-server-vs-the-llm).
