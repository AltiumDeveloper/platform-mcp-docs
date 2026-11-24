// The site's pages: which Markdown files are published, under which URL, in which sidebar section and order, with
// which description. docusaurus.config.js (docs plugin `include`, sidebar, front matter), scripts/search-index.mjs,
// scripts/llms.mjs and scripts/devcenter-check.mjs all read this list, so a page is added in one place.
//
// The sources stay plain GitHub-flavoured Markdown with no front matter, so they render on GitHub as they do here.
// Titles come from each file's `# H1`; everything else Docusaurus needs is here and injected at build time
// (`frontMatterFor` → markdown.parseFrontMatter in docusaurus.config.js).
//
// Page URLs never change once published: the Developer Center pages (devcenter/) link to them by absolute URL, and
// test/site.test.mjs pins the list.
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

// Altium Developer Center. The pages built from devcenter/ (see devcenter/README.md) are not linked yet: add their
// URLs here (and the sidebar links and page links listed in OPEN-ISSUES.md) once they are published.
const DEVELOPER_CENTER = {
  home: 'https://developer.altium.com/',
  docs: 'https://www.altium.com/documentation/altium-developer-center',
};

// The sidebar sections, in sidebar order. The home page is a single link; the others are small-caps headings over
// their pages. `kind` is the search kind (src/search/engine.mjs KINDS). Page `file`s are repository-relative; `route`
// is the page URL below the base URL; `icon` puts a swatch before the page's sidebar label (`.bc-<icon>` in
// src/css/custom.css, the same icons as the home page cards). An entry with `href` instead of `file` is a sidebar link
// to another site, not a page.
const SECTIONS = [
  {
    id: 'home',
    label: 'Overview',
    kind: 'guide',
    pages: [
      { file: 'docs/index.mdx', route: '/', label: 'Overview', description: 'Reference for the Altium 365 MCP Server: tools, sample prompts and guides.' },
    ],
  },
  {
    id: 'start',
    label: 'Get started',
    kind: 'guide',
    pages: [
      { file: 'docs/setup.md', route: '/setup/', label: 'Getting started', description: 'Requirements, connecting Claude, Claude Code or VS Code, signing in, and choosing a workspace.' },
      { file: 'docs/sample-prompts.md', route: '/sample-prompts/', label: 'Try it now', description: 'Prompts to try on a project in your workspace: overview, connectivity, changes, variants and comments.' },
    ],
  },
  {
    id: 'guides',
    label: 'Guides',
    kind: 'guide',
    pages: [
      { file: 'docs/working-with-the-llm.md', route: '/working-with-the-llm/', label: 'Working with the LLM', description: 'Good prompts, naming the project, steering tool use and approving tool calls.' },
      { file: 'docs/how-it-works.md', route: '/how-it-works/', label: 'How it works', description: 'What the server reads, workspaces, revisions and variants, limits, and what it does not do.' },
      { file: 'docs/security.md', route: '/security/', label: 'Is it safe?', description: 'Sign-in, permissions, the write surface, the sandboxed query tool, and what leaves your workspace.' },
    ],
  },
  {
    id: 'tools',
    label: 'Tool reference',
    kind: 'tool',
    pages: [
      { file: 'docs/tools/index.md', route: '/tools/', label: 'All tools', description: 'Tool naming, the arguments every tool shares, and the tool groups.' },
      // One page per bounded context, the area in the tool names; the labels and order of the home page cards.
      { file: 'docs/tools/platform.md', route: '/tools/platform/', label: 'Platform', icon: 'workspace', description: 'The Altium 365 workspaces you can reach, and targeting one of them.' },
      { file: 'docs/tools/design.md', route: '/tools/design/', label: 'Design', icon: 'design', description: 'Projects, their details, revisions and variants, and their history.' },
      { file: 'docs/tools/schematic.md', route: '/tools/schematic/', label: 'Schematic', icon: 'schematic', description: 'Schematic data and the query tool, sheet images and highlighting, and comparing revisions and variants.' },
      { file: 'docs/tools/collaboration.md', route: '/tools/collaboration/', label: 'Collaboration', icon: 'comments', description: 'Altium 365 comment threads and replies on schematic components and nets.' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    kind: 'help',
    pages: [
      { file: 'docs/troubleshooting.md', route: '/troubleshooting/', label: 'Troubleshooting', description: 'Symptoms and fixes for connecting, signing in, workspaces, licensing and answers.' },
      { file: 'docs/glossary.md', route: '/glossary/', label: 'Glossary', description: 'LLM, MCP, clients and servers, tools, workspaces, revisions, variants and comment threads.' },
      { file: 'CHANGELOG.md', route: '/changelog/', label: 'Changelog', description: 'What changed in each release of the server, newest first.' },
    ],
  },
];

// Docusaurus' doc id: the repository-relative path without its extension.
const docId = (file) => file.replace(/\.mdx?$/, '');

// Every published page, in site order, with the absolute path of its source. Sidebar links (`href`) are not pages.
function allPages() {
  return SECTIONS.flatMap((section) => section.pages.filter((page) => page.file).map((page) => ({
    ...page,
    section: section.id,
    kind: section.kind,
    id: docId(page.file),
    source: path.join(REPO_ROOT, page.file),
  })));
}

// Front matter injected into a source file at build time, or undefined for a file that is not a listed page.
function frontMatterFor(filePath) {
  const page = allPages().find((p) => p.source === path.resolve(filePath));
  if (!page) return undefined;
  return { slug: page.route, sidebar_label: page.label, description: page.description };
}

module.exports = { REPO_ROOT, DEVELOPER_CENTER, SECTIONS, docId, allPages, frontMatterFor };
