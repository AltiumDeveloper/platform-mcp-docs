# How it works

## The MCP server vs the LLM

Two separate pieces answer your question. The **MCP server**, run by Altium, returns exact data from your workspace:
the components on a net, the fields a commit changed, the text of a comment. The **LLM**, run by your AI provider,
decides which tools to call and turns their results into an answer. When an answer is wrong, it is almost always the
reading that went wrong, not the data. [Working with the LLM](./working-with-the-llm.md) covers how to catch that.

## What the server reads

The server reads what is stored in your Altium 365 workspace, through Altium 365's own platform services, acting as
you. It never sees your PC.

- **Committed revisions, not your working copy.** Each schematic question is answered from a committed revision of the
  project: the latest one unless you name another. Edits you have not committed from Altium Designer are not visible.
- **The compiled design, not the drawing.** The schematic tools see connectivity: components, pins, nets, net classes,
  differential pairs, sheets and parameters, resolved across sheets. Wires, ports, net labels and coordinates are not
  part of that model. When a question is about how a sheet looks, the
  [image tools](./tools/schematic.md#schematic-images) render it.
- **Design data is generated after a commit.** Altium 365 builds the design data for each commit, which takes some
  time. A question about a revision that is still being processed is answered with *Design data generation is in
  progress*; ask again later. A revision whose design data generation failed or was skipped is reported as such; use another
  revision.

## Workspaces

You sign in once, and the server works on your default workspace. Every tool also accepts a workspace URL, so the
assistant can work on any workspace you are a member of, one call at a time, without signing in again. A workspace you
do not belong to is refused. See [Platform](./tools/platform.md). An administrator can instead
[restrict a connection to one workspace](./security.md#restricting-a-connection-to-one-workspace).

## Projects, revisions and variants

The tools identify a project by the id that `a365_design_project_list` returns, and the assistant is instructed to find
projects in each conversation rather than reuse ids from memory. A revision is a full 40-character commit hash; the
assistant gets those from the project history, or from the revisions column of `a365_design_project_details`.

A variant is named by its name in the project. The base design is `[No Variations]`, and it is what the tools read
when no variant is named. With a variant, the schematic data reflects it: Not Fitted components are excluded and
alternate parts replace the originals. A variant that only overrides parameters shows no difference, because the
design data carries no parameter overrides.

## Results built for the assistant

Tools return compact tables, page long results with a cursor, and add suggestions for the next call. When a result is
cut short or a batch is only partly answered, the response says so, so the assistant can tell missing data from an
empty answer. The image tools also return an interactive card, a scrollable strip of the rendered sheets with an
**Open in Altium 365** button, for clients that display it.

## Limits

- **Rate limit.** Tool calls are rate-limited per workspace. A call over the limit fails with *Too many tool calls for
  this workspace. Retry after N seconds.*, and the assistant can wait and retry.
- **Query output.** A query script's result is truncated at 64,000 characters, so the assistant is instructed to return
  only what the question needs.
- **History depth.** Only the newest 500 events of a project's history can be paged through; filters reach further.

## What it does not do (current release)

- **Schematic only.** PCB layout, 3D and BOM data are not exposed.
- **No design edits.** No tool edits a schematic, a library or a project. The tools that write to your workspace are
  marked as such in the [Tool reference](./tools/index.md#how-tools-are-classified).
- **No-connect markers are not visible.** A pin that is on no net reads as unconnected, whether or not it carries a
  no-connect marker.
- **Comments go on components and nets.** Pins cannot take comments, and commenting is supported on schematic documents
  only.
