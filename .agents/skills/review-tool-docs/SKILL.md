---
name: review-tool-docs
description: |-
  Trigger to review a change to content/tools/ or content/changelog.md against production's tools: the sync workflow's review
  step, or a person asking whether a tool page change is right. Returns pass or fail with blocking findings and notes.
  Do NOT trigger to make the change (that is /update-tool-docs) or to review guides and other pages.
  Keywords: review tool docs, check tool pages, tool reference review, snapshot, does the doc match the tools
---

# Review a tool reference change

The sync workflow is not built yet; until it is, review by hand. In the sync workflow, your arguments name the tool
diff, the docs diff and the snapshot. By hand, the docs diff is
`git diff --merge-base main -- content/tools content/changelog.md`, the tool diff is
`git diff --merge-base main -- tools/snapshot.json`, and the snapshot is `tools/snapshot.json`; run `git add -N` on
new files first, because `git diff` skips untracked ones. The rules a change must follow are in
`.agents/skills/update-tool-docs/SKILL.md`; read it first and use it as your rubric. Do not restate or relax it.

You are reviewing the result, not a conversation: judge the pages as they now stand against the snapshot.

## What blocks

A finding blocks only when it is one of these:

- **Unsupported:** a claim on a tool page that the tool's `description`, `inputSchema` or `annotations` does not
  support.
- **Wrong or missing:** a fact the snapshot states that a reader would act on, such as a limit, a default, what comes
  back or the Kind, that the page gets wrong or leaves out.
- **A broken rule** in `update-tool-docs`, such as a file outside its scope, a missing changelog entry, or prose
  rewritten where the diff did not call for it.

Everything else is a note: wording, ordering, a better example prompt. Notes never fail a review. If you are unsure
whether something blocks, it is a note.

## How to check

1. Read the tool diff, then for each tool it names, the tool's entry in the snapshot.
2. Read the docs diff, and the full section of each page it touches.
3. Check every changed sentence against the snapshot, and every fact in the tool diff for a place on the page.

Change no file contents.

## Reply

`verdict` `pass` or `fail`; `blocking`, each with `file`, `line`, the `rule` from the list above and the
`issue` in one sentence with the snapshot text it rests on; and `notes`, one sentence each. `fail` exactly when
`blocking` is not empty.
