# Production tool list

What the production server, `https://mcp.altium.com`, lists as its tools, kept so the tool pages in
[`content/tools/`](../content/tools/) can be checked against it. `npm test` fails when a tool page and this list
disagree.

- **Refreshing it:** `npm run tools:snapshot` in `website/` writes the list from production. It needs
  `A365_CLIENT_ID`, `A365_CLIENT_SECRET` and `A365_REFRESH_TOKEN`, a refresh token created in a workspace's
  **Admin → Developer** page.
- **What it cannot see:** that token is bound to one workspace, so the list leaves out tools served only on global
  connections. Documented tools the list cannot see are listed, each with its reason, in `not-in-snapshot.json`, so the
  check exempts them. The `workspace_url` argument is dropped from every schema. Production offers it only to an
  unscoped token on `mcp.altium.com`, yet some responses to this workspace-scoped token have included it.

## The tool sync workflow

`.github/workflows/tool-sync.yml`, run daily at 04:00 UTC or by hand, refreshes the list. When it changed, an agent
updates the tool pages, the checks run and a second agent reviews the result, and failures go back to the author, for up
to three rounds in all (`ROUNDS` in `website/scripts/lib/sync.mjs`). It then opens a pull request from `bot/tool-sync`
into the branch it ran from. One that passed merges itself on a scheduled run, or on a run by hand with `auto_merge`
set, and a merge into the default branch starts the Docs deploy. One that could not finish, or could not merge, is
labelled `needs-human` and asks the maintainers to review. Its pull request shows a failed Docs check: GitHub holds a
run for a pull request the workflow's own token opens, and it ends without running. The sync ran the same checks itself,
and a person's push to the branch starts them for real. A run skips the agents when the open pull request already has
the new snapshot. A run that finds production matching the branch again closes an open bot pull request, or comments on
it once if a person has committed to it. Closing a sync pull request without merging declines its snapshot: later runs
skip the agents until production changes again.

It needs:

- **Secrets:** `ANTHROPIC_API_KEY`, the three `A365_*` values above, and `A365_REFRESH_TOKEN_EXPIRES`, the refresh
  token's expiry as `YYYY-MM-DD`. From 30 days before it, a run opens an issue to replace the token, unless one is
  already open.
- **Repository setting:** Actions, General, "Allow GitHub Actions to create and approve pull requests".

For a dry run without the API, set `CLAUDE_BIN` to a stand-in for `claude`, then run
`node scripts/tool-sync.mjs ../.tool-sync/tool-diff.md` in `website/` with the new snapshot staged. The diff must be in
the gitignored `.tool-sync/`, or the path gate counts it as a new file.
