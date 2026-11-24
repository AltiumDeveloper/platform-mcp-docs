# Production tool list

What the production server, `https://mcp.altium.com`, lists as its tools, kept so the tool pages in
[`content/tools/`](../content/tools/) can be checked against it. `npm test` fails when a tool page and this list
disagree, and the planned sync workflow refreshes the list and updates the pages from what changed.

- **Refreshing it:** `npm run tools:snapshot` in `website/` writes the list from production. It needs
  `A365_CLIENT_ID`, `A365_CLIENT_SECRET` and `A365_REFRESH_TOKEN`, a refresh token created in a workspace's
  **Admin → Developer** page.
- **What it cannot see:** that token is bound to one workspace, so the list leaves out tools served only on global
  connections and the `workspace_url` argument. Documented tools the list cannot see are listed, each with its reason,
  in `not-in-snapshot.json`, so the check exempts them.
