# Working with the LLM

The server gives the assistant accurate data; the assistant decides what to ask for and how to read it. A few habits
make the answers better.

## Name the project

The assistant can only work on a project it has found in this conversation. Name the project, and the workspace if it is
not your default one. If several projects have similar names, name the one you mean, or ask the assistant to list the matches first.

## Say which revision and variant

Without a revision, the tools read the **latest committed revision**. Without a variant, they read the **base design**:
a cloud workspace has no "currently active" variant. Say *"at the last release"*, *"in the Low Cost variant"* or
*"before the commit on Tuesday"* when you mean something else.

## Ask for the whole job in one message

The tools take batches: several projects, revisions, variants or comments in one call. A request such as *"compare the
last three commits"* is answered in one round trip, which is faster and uses less of the conversation's context than
asking for each in turn.

## Steering which tools get used

You never need tool names, but you can use them. *"Use the diff tool, not the history"* or *"run a script to count the
pull-up resistors"* works when the assistant takes a longer route than you want. The
[Tool reference](./tools/index.md) lists every tool and what it is for.

## Check claims that matter

The data is exact; the assistant's reading of it is not always. Component types come from the workspace library
where it classifies a part, and are otherwise inferred from names and descriptions, so a count of "ICs" is approximate. Ask the assistant to show the rows behind a conclusion, or to highlight
the parts on the schematic, before you act on it.

## Approving tool calls

Every tool tells your client whether it is read-only, whether it writes to your workspace, and whether its change is
destructive; [How tools are classified](./tools/index.md#how-tools-are-classified) explains the kinds. Clients use that to decide when to
ask you, and most let you set it per kind or per tool. A sensible default is to allow read-only tools for the
conversation and approve every write yourself. Read what a write is about to do before approving it, and treat a
destructive one as final: it cannot be undone.
