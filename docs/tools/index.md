# Tool reference

You do not have to call these tools by name: the assistant picks them. This section is here so you can tell what the
assistant did, and [steer it](../working-with-the-llm.md#steering-which-tools-get-used) when you want to.

## Naming

Every tool name starts with `a365_`, then the area, the object and the action: `a365_design_project_list`,
`a365_collaboration_commentthread_create`. The name says what a tool is about, not whether it is safe to run; that is
what its kind is for.

## How tools are classified

Every tool declares to your client what kind of tool it is, using the hints the MCP standard defines. Each tool page
lists the kind of each tool, and your client shows the same information wherever it lets you set tool permissions.

| Kind | What it means |
| --- | --- |
| **Read-only** | Reads from your workspace and changes nothing. |
| **Writes** | Changes something in your workspace, such as posting a comment. |
| **Writes, destructive** | Removes something, and the removal cannot be undone. |

Two more hints refine these. An *idempotent* tool has the same effect however many times the same call is repeated,
so a retry is harmless. A tool that is not idempotent, such as posting a comment, repeats its effect on every call.
An *open-world* tool reaches outside your workspace; no tool here does.

Clients use the kinds to decide when to ask you, and give you controls over them:

- **Claude.** An organization owner opens **Organization settings → Connectors**, selects the connector and opens its
  **Tools** tab, where the tools are grouped as read-only tools and write/delete tools. Each group, or each tool, can be
  set to **Always allow**, **Needs approval** or **Blocked**.
- **Claude Code.** `/permissions` sets allow, ask and deny rules for individual tools by their full name.
- **VS Code.** The **Tools** tab of the agent customizations turns individual tools on or off; calls still go through
  its approval prompts.

Your client's tool list always shows the tools the server offers today.

## What every tool shares

- **A workspace.** Every tool accepts an optional workspace URL. Without one, it works on your default workspace. A
  connection restricted to one workspace has no workspace URL argument.
- **Batches.** Tools that take ids take several at once: many projects, revisions, variants, threads or comments in one
  call. Each tool caps the size of a batch. A call over the cap is usually rejected with an error that names the limit;
  a few tools instead answer part of the batch and list what they left out.
- **Field selection.** Most tools return a default set of columns and accept a list of the fields to return instead.
- **Paging.** Long lists come back a page at a time, 50 rows by default, with a cursor for the next page.
- **Partial results.** When some entries of a batch fail, the others are still returned, and the response lists the
  failures and any warnings, such as duplicate entries that were merged.

## Tool groups

Tools are grouped by the area their name names, `a365_<area>_…`:

- [Platform](./platform.md): workspaces
- [Design](./design.md): projects, variants and project history
- [Schematic](./schematic.md): schematic data, images and comparisons
- [Collaboration](./collaboration.md): comment threads and replies
