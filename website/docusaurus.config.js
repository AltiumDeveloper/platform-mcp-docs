// @ts-check
// Docusaurus site for content/, read in place: one docs plugin over the repository root that includes only the pages
// listed in pages.cjs, so nothing is copied, relative links between the files work as they do on GitHub, and "Edit
// this page" opens the real source. devcenter/ is not published here; it goes to Altium Developer Center (see
// devcenter/README.md), and scripts/devcenter-check.mjs checks its links into this site.
// The look (CSS, fonts, logo, "View as Markdown", the search UI) is the theme shared with the other Altium developer
// sites, https://github.com/AltiumDeveloper/docusaurus-theme (installed from its GitHub Release tarball; to update,
// change the version in the package.json URL); search ranking (src/search/engine.mjs) is this site's.
const { themes } = require('prism-react-renderer');
const altiumTheme = require('@altium-developer/docusaurus-theme');
const { REPO_ROOT, DEVELOPER_CENTER, SECTIONS, allPages, docId, frontMatterFor } = require('./pages.cjs');

const REPO = 'https://github.com/AltiumDeveloper/platform-mcp-docs';
const BRANCH = 'main';

// The sidebar, laid out like the other Altium developer sites: the home page link, then one small-caps heading per
// section over its pages, always expanded (the theme styles level-1 categories as headings). Pages with an `icon`
// get its swatch before the label (`bc-<icon>` in src/css/custom.css); `href` entries link to Developer Center.
function sidebarItems() {
  return SECTIONS.map((section) => {
    const items = section.pages.map((page) => (page.href
      ? { type: 'link', label: page.label, href: page.href }
      : { type: 'doc', id: docId(page.file), ...(page.icon && { className: `bc-${page.icon}` }) }));
    if (section.id === 'home') return items[0];
    return { type: 'category', label: section.label, collapsible: false, items };
  });
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Altium 365 MCP Server',
  tagline: 'Reference for the Model Context Protocol server that connects AI assistants to the designs in your Altium 365 workspace',
  url: 'https://docs.developer.altium.com',
  baseUrl: '/platform-mcp-docs/',
  organizationName: 'AltiumDeveloper',
  projectName: 'platform-mcp-docs',
  favicon: 'img/favicon.svg',
  // Directory URLs (/setup/), the form the Developer Center pages link to.
  trailingSlash: true,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    // .md is CommonMark, not MDX: the sources render on GitHub as they do here.
    format: 'detect',
    hooks: { onBrokenMarkdownLinks: 'throw' },
    // Sidebar labels, descriptions and slugs come from pages.cjs, so the sources need no front matter.
    parseFrontMatter: async (params) => {
      const result = await params.defaultParseFrontMatter(params);
      return { ...result, frontMatter: { ...frontMatterFor(params.filePath), ...result.frontMatter } };
    },
  },
  // The theme's img/ (logo, favicon) next to this site's static/.
  staticDirectories: ['static', altiumTheme.staticDir],
  themes: [
    [
      '@altium-developer/docusaurus-theme',
      {
        // The theme's SearchBar over static/search-index.json (npm run search:index), ranked by src/search/engine.mjs.
        search: {
          engine: 'src/search/engine.mjs',
          recentKey: 'platform-mcp-docs-search-recent',
          placeholder: 'Search tools, prompts and guides',
          examples: [
            { query: 'what changed', text: 'comparing revisions' },
            { query: 'a365_schematic_script_run', text: 'a tool by name' },
            { query: ['claude', 'connect'], text: 'connecting a client' },
            { query: 'sign in fails', text: 'troubleshooting' },
          ],
        },
      },
    ],
  ],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        blog: false,
        docs: {
          path: REPO_ROOT,
          routeBasePath: '/',
          include: allPages().map((page) => page.file),
          sidebarPath: require.resolve('./sidebars.js'),
          sidebarItemsGenerator: sidebarItems,
          editUrl: ({ docPath }) => `${REPO}/edit/${BRANCH}/${docPath}`,
        },
        theme: { customCss: './src/css/custom.css' },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: { respectPrefersColorScheme: true },
      navbar: {
        title: 'Altium 365 MCP Server',
        logo: { alt: 'Altium', src: 'img/altium-logo.svg', width: 90, height: 20 },
        items: [
          { href: DEVELOPER_CENTER.home, label: 'Developer Center', position: 'right' },
          { href: REPO, label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Altium',
            items: [
              { label: 'Developer Center', href: DEVELOPER_CENTER.home },
              { label: 'Developer Center documentation', href: DEVELOPER_CENTER.docs },
              { label: 'Altium 365 API reference', href: 'https://docs.developer.altium.com/platform-api-docs/' },
              { label: 'Altium Designer MCP Server', href: 'https://docs.developer.altium.com/ad-mcp-docs/' },
              { label: 'Altium Authentication', href: 'https://docs.developer.altium.com/altium-auth/' },
            ],
          },
          {
            title: 'This site',
            items: [
              { label: 'For AI assistants (llms.txt)', href: 'pathname:///llms.txt' },
              { label: 'Source on GitHub', href: REPO },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Altium.`,
      },
      prism: { theme: themes.github, darkTheme: themes.oneDark, additionalLanguages: ['bash', 'json', 'toml'] },
    }),
};

module.exports = config;
