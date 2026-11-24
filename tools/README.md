# Production tool list

What the production server, `https://mcp.altium.com`, lists as its tools, kept so the tool pages in
[`content/tools/`](../content/tools/) can be checked against it. `npm test` fails when a tool page and this list
disagree.

- **Refreshing it:** `npm run tools:snapshot` in `website/` writes the list from production. It needs
  `A365_CLIENT_ID`, `A365_CLIENT_SECRET` and `A365_REFRESH_TOKEN`, a refresh token created in a workspace's
  **Admin → Developer** page.
- **What it cannot see:** that token is bound to one workspace, so the list leaves out tools served only on global
  connections and the `workspace_url` argument. Documented tools the list cannot see are listed, each with its reason,
  in `not-in-snapshot.json`, so the check exempts them.

## The tool sync workflow

`.github/workflows/tool-sync.yml`, run by hand from `main`, refreshes the list. When it changed, an agent updates
the tool pages, the checks run and a second agent reviews the result, and failures go back to the author, for up to
three rounds in all (`ROUNDS` in `website/scripts/lib/sync.mjs`). It then opens a pull request from `bot/tool-sync`.
One that could not finish is labelled `needs-human` and asks the maintainers to review; one that passed asks no one.
It never merges. GitHub starts no workflow for a pull request the workflow's own token opens, so the Docs checks do
not run on it; the sync ran the same checks itself, and a person's push to the branch starts them.

It needs:

- **Secrets:** `ANTHROPIC_API_KEY`, and the three `A365_*` values above.
- **Variable:** `A365_REFRESH_TOKEN_EXPIRES`, the refresh token's expiry as `YYYY-MM-DD`. From 30 days before, a run
  opens an issue to replace the token, unless one is already open.
- **Repository setting:** Actions, General, "Allow GitHub Actions to create and approve pull requests".

For a dry run without the API, set `CLAUDE_BIN` to a stand-in for `claude` and `TOOL_SYNC_BASE` to a local ref, then
run `node scripts/tool-sync.mjs ../.tool-sync/tool-diff.md` in `website/` with the new snapshot staged. The diff must
be in the gitignored `.tool-sync/`, or the path gate counts it as a new file.
