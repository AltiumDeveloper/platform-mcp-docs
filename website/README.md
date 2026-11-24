# Site build

Builds the reference site from [`content/`](../content/README.md) with Docusaurus, on the theme shared with the other
Altium developer sites, and runs the checks that keep the site, its search, its `llms.txt` surface and the
Developer Center links correct. `pages.cjs` is the one list of published pages: their files, URLs, sidebar and
descriptions.

Node 22 or later:

```bash
npm ci
npm start        # live preview
npm test         # unit tests, and the tool pages against tools/
npm run build    # the CI checks: links, anchors, search index, llms.txt, Developer Center links
```

`npm run tools:snapshot` and `npm run tools:check` refresh and check the [production tool list](../tools/README.md).

The theme, [`@altium-developer/docusaurus-theme`](https://github.com/AltiumDeveloper/docusaurus-theme), installs from
its GitHub Release tarball. To update it, change the version in the URL in `package.json` (twice: the tag and the file
name) and run `npm install`.
