# Open issues

Things to confirm or follow up after the first publication. Page text states only what is known; the unknowns are
here.

## Before the first publication

1. **Live walkthrough and screenshots.** The Claude and Claude Code steps in `content/setup.md` match those clients'
   official documentation. Still to do with a production account against `https://mcp.altium.com`:
   - VS Code: the steps follow its current documentation, and 1.106 release notes confirm client ID metadata document
     sign-in. Confirm the **Add Server** flow and the sign-in in the product.
   - Whether a first sign-in needs anything from a workspace administrator.
   - Screenshots of the Claude connector dialog and the Altium sign-in page, in `devcenter/images/` (used by both
     sites, as in ad-mcp-docs).
2. **Single-workspace connections.** `content/security.md#restricting-a-connection-to-one-workspace` is written from the
   source. Walk through it with a real workspace: sign-in from Claude to `https://<workspace>.365.altium.com/svc/mcp`,
   the workspace list absent, a non-member refused.
3. **Site URL.** The pages assume `https://docs.developer.altium.com/platform-mcp-docs/`. The domain is already set on
   the organization's Pages site, so a project site lands there once this repository is public and has
   **Settings → Pages → Source** set to **GitHub Actions**, as ad-mcp-docs does.
4. **Page comments.** The site embeds giscus threads from the **Comments** discussion category. giscus reports it is
   not installed on this repository: install the [giscus app](https://github.com/apps/giscus) for it. Threads load for
   readers once the repository is public.

## Once the Developer Center pages are published

5. **Link the Developer Center pages once they are published.** Put them back in, as ad-mcp-docs will:
   - `website/pages.cjs`: the URLs in `DEVELOPER_CENTER`, and two entries at the top of the Get started section,
     "About the server" and "Quick start";
   - `content/index.mdx`: a sentence after the intro pointing to the overview and the Quick Start Guide;
   - `website/scripts/llms.mjs`: the `llms.txt` lead, which links only the Developer Center docs home for now;
   - `devcenter/altium-365-mcp.md`: the Quick Start Guide as the first item of "Get started" (republish).

## Tool reference

6. **`a365_schematic_variantdiff_details` is documented ahead of production.** Production did not list it on
   2026-11-24. It is exempt in `tools/not-in-snapshot.json`, and `npm test` fails once a refreshed snapshot lists it: remove
   the entry then, or remove its row and changelog line if it does not ship.
