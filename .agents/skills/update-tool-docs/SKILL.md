---
name: update-tool-docs
description: |-
  Trigger when the tool reference in content/tools/ must change because production's tools changed: the tool diff from
  the sync workflow, a new or removed a365_ tool, a changed description, schema, limit or annotation, or a review's
  findings on such a change. Also when someone edits a tool page by hand and wants the rules. Do NOT trigger for guides,
  setup, security or other pages outside content/tools/, or to review a change (that is /review-tool-docs).
  Keywords: tool docs, tool reference, content/tools, snapshot, tool-diff, a365_, new tool, removed tool, Kind column
---

# Update the tool reference

The tool pages document what production serves. `tools/snapshot.json` is production's `tools/list`. You are in the
sync workflow, `.github/workflows/tool-sync.yml`, when your arguments name a tool diff under `.tool-sync/`; the change
to make is in that diff. Otherwise you are working by hand, and the change is whatever you were asked to document.

## Source of truth

- **In the sync workflow, the snapshot and nothing else.** Every claim you add or change must follow from the tool's
  `description`, `inputSchema` or `annotations`; never add one from memory or from another product. Change existing
  text only where the snapshot now contradicts it or the diff changed what it describes. A fact the snapshot does not
  mention stays: it was written from the Platform MCP source by hand.
- **By hand**, the Platform MCP source, as the Source of truth table in `content/README.md` describes.
- **Two things the snapshot cannot see.** Its credential is bound to one workspace, so:
  - Tools in `tools/not-in-snapshot.json` are documented but absent from the snapshot: global-only tools, and tools
    documented ahead of their release. Leave their rows alone. When one appears in the snapshot, remove its entry
    and document it from the snapshot like any other tool. In the sync workflow, never add an entry; by hand, add
    one with a `reason` when you document a tool the snapshot cannot see.
  - The snapshot leaves out the `workspace_url` argument, which production lists on some responses and not others.
    Its absence is not a change; keep the pages' mentions of it.

## What you may change

In the sync workflow, this table is your whole scope. By hand, it marks what needs a person's sign-off.

| May | Stop and reply `needs_human` | May not |
| --- | --- | --- |
| Rows, the detail bullets under a table and typical uses on the existing pages in `content/tools/`; the Tool groups list in `content/tools/index.md`; a `content/changelog.md` entry; removing entries from `tools/not-in-snapshot.json` | A tool in a new area, which needs a new page, a `website/pages.cjs` entry and an icon; a removed tool that a guide outside `content/tools/` links to or names; a read-only tool that now writes, or a write that became destructive | Any other file. |

## Where a tool goes

The area in `a365_<area>_<object>_<action>` names the page, `content/tools/<area>.md`. Within the page, the row goes
in the table that holds the tools closest to it, normally the same object; a page with one table takes it there.
Start a new `##` section only when no section's intro covers the tool, and in the sync workflow reply
`needs_human` instead.

## Page anatomy

Each tool page has an intro, then one or more `##` sections (none on a one-table page), each with:

1. One or two sentences on what the section covers.
2. A table `| Tool | Kind | What it does |`: one tool per row, the backticked name in the first column, which is
   where search and `tools-check` find it.
3. Optionally, detail bullets under a lead-in line, such as "A few details that are not obvious from the names:";
   each bullet starts with a bold lead-in that names a new fact.
4. **Typical uses:** one or two example prompts, each a blockquote in italics: `> *"..."*`.

## Writing a row

- **Kind** comes from the annotations: `readOnlyHint` true is `Read-only`; otherwise `destructiveHint` false is
  `Writes`, and anything else is `Writes, destructive`. Write the cell as that plain text, with no formatting;
  `tools-check` fails on any other value.
- **What it does** says what comes back to the reader, not how the server works. Rewrite the description for a
  person: it is written for the model, so drop instructions such as "call this first" or "IMPORTANT", or report them as
  "the assistant is instructed to ...".
- **Limits and defaults from the schema:** `maxItems` is "up to N <things> per call", `default` on a page size is "N
  per page by default", `maximum` is "up to N". Quote only the limits a reader would hit.
- **Never list which tools write in prose;** describe changes in kinds and link to
  `./index.md#how-tools-are-classified` from the tool page.

## Change as little as possible

Change what the diff calls for and leave other rows' wording alone, so each merge is easy to read. A changed
description often needs one row and no bullets changed.

## Changelog entry

Add one entry per change at the top of `content/changelog.md`, under the intro, newest first:

```markdown
## YYYY-MM-DD

- **Added** `a365_x_y_z` to [Schematic](./tools/schematic.md#section): what it does, in one line.
- **Changed** `a365_x_y_z`: what changed for the reader.
- **Removed** `a365_x_y_z`.
```

Name every tool added or removed in backticks; `tools-check --base <git ref>` fails without them. A change no
reader would notice, such as reworded model instructions, needs no entry.

## Writing

Follow the Writing section of `content/README.md`; `tools-check` enforces the rules there that a pattern can check.

## Responding to failures

In the sync workflow, from round 2 you get the failing checks or the reviewer's blocking findings. For each, either
fix it or dispute it with a reason that cites the snapshot or a rule above. A disputed finding is listed in the pull
request for whoever merges it; do not dispute to avoid work.

## Before you finish

- **In the sync workflow,** run nothing yourself; the workflow runs `npm test`, the build and `tools-check` after
  you. Reply with `status` `done` or `needs_human`, a one-line `summary` of what changed or why you stopped, and
  a `responses` entry for each failure you were given.
- **By hand,** run `npm test` and `npm run build` in `website/` and report the result.
