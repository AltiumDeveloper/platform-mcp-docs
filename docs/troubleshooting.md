# Troubleshooting

## Connecting and signing in

| Symptom | What to do |
| --- | --- |
| The client says it cannot connect, or never shows a sign-in page | Check the URL is exactly `https://mcp.altium.com`, with no path. Check that the client supports remote MCP servers with sign-in, as described in [Other clients](./setup.md#other-clients). |
| The client reports a registration error, such as *does not support dynamic client registration* | The client tried dynamic client registration, which Altium's sign-in service does not offer. In Claude, edit the connector and set **OAuth client** to **Use Claude's published identity (Recommended)**. In other clients, use a version that supports client ID metadata documents. |
| The tools stopped working after a while | The sign-in may have expired or been revoked. Sign in again from your client's connector or MCP server settings; in Claude Code, run `/mcp`. |
| No Altium tools are listed | Make sure the connector or server is enabled for this conversation. In Claude, open the **+** menu, hover over **Connectors** and switch Altium 365 on. |

## Workspaces and licensing

| Symptom | What to do |
| --- | --- |
| *Workspace lacks required MCP license feature.* | The workspace the call targeted lacks the required license. Ask your workspace administrator. If you belong to several workspaces, check the assistant is using the one you meant. |
| The assistant works in the wrong workspace | Tell it which one to use: *"Use the Acme Robotics workspace."* It lists your workspaces with the [Platform](./tools/platform.md) tool and targets that one. |
| A workspace is refused as not accessible | You are not a member of it, or the URL is wrong. Ask the assistant to list your workspaces and pick from the list. |
| The assistant cannot list workspaces or switch to another one | The connection is restricted to one workspace: its URL ends in `.365.altium.com/svc/mcp`. Use a connection to `https://mcp.altium.com` to reach other workspaces, if your administrator allows it. |
| *Too many tool calls for this workspace.* | The workspace hit its rate limit. The message says how many seconds to wait; the assistant can retry after that. |

## Answers

| Symptom | What to do |
| --- | --- |
| Recent changes are missing from the answer | The server reads committed revisions. Commit the change from Altium Designer, wait for Altium 365 to process it, and ask again. |
| *Design data generation is in progress* (or *pending*) | Altium 365 is still processing that revision. Ask again shortly. |
| *Design data generation failed* or *was skipped* | That revision has no design data to read. Use another revision. |
| A variant shows no difference | The variant only overrides parameters, which the design data does not carry. |
| A pin with a no-connect marker is reported as unconnected | Expected: the design data does not record no-connect markers. |
| Counts of component types look wrong | Types come from the workspace library's tags and folders, and are inferred from names, descriptions and pins when that lookup fails. Ask the assistant to list the parts behind the count, or to check descriptions and values instead. |
| An answer looks plausible but wrong | Ask the assistant to show the rows behind it, or to highlight the parts on the schematic. See [Working with the LLM](./working-with-the-llm.md). |
