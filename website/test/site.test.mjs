// Unit tests for the site scripts: page URLs (pages.cjs), Markdown helpers, search ranking and the Developer Center
// page checks. Run with `npm test`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { contentProblems, devcenterPages, linkProblem } from '../scripts/devcenter-check.mjs';
import { absoluteLinks, pageSections, pageTitle, readPages } from '../scripts/lib/markdown.mjs';
import { buildIndex } from '../scripts/search-index.mjs';
import { loadIndex, search } from '../src/search/engine.mjs';

const require = createRequire(import.meta.url);
const { DEVELOPER_CENTER, SECTIONS, allPages } = require('../pages.cjs');

// The published page URLs. The Developer Center pages link to them by absolute URL, so they must not move: add to the
// list, never change or remove an entry.
const PUBLISHED_ROUTES = [
  '/',
  '/setup/', '/sample-prompts/', '/working-with-the-llm/',
  '/how-it-works/', '/security/', '/troubleshooting/', '/glossary/', '/changelog/',
  '/tools/', '/tools/platform/', '/tools/design/', '/tools/schematic/', '/tools/collaboration/',
];

test('every published page keeps its URL', () => {
  assert.deepEqual(allPages().map((page) => page.route).sort(), [...PUBLISHED_ROUTES].sort());
});

test('every page icon has its rule', () => {
  const css = readFileSync(new URL('../src/css/custom.css', import.meta.url), 'utf8');
  const icons = allPages().map((page) => page.icon).filter(Boolean);
  const cards = [...readFileSync(new URL('../../content/index.mdx', import.meta.url), 'utf8').matchAll(/bc-icon bc-([a-z]+)/g)].map((m) => m[1]);
  assert.ok(icons.length > 0 && cards.length > 0);
  for (const icon of new Set([...icons, ...cards])) {
    const rule = new RegExp(`\\.bc-${icon} \\{([^}]*)\\}`).exec(css)?.[1];
    assert.ok(rule?.includes('--bc-img') && rule.includes('--bc-bg'), `.bc-${icon} needs --bc-img and --bc-bg`);
  }
});

test('links to Developer Center use the URLs in pages.cjs', async () => {
  const known = new Set(Object.values(DEVELOPER_CENTER));
  const sidebar = SECTIONS.flatMap((section) => section.pages).filter((page) => page.href).map((page) => page.href);
  const sources = [
    ...(await readPages()).map((page) => page.text),
    ...devcenterPages().map((file) => readFileSync(file, 'utf8')),
  ];
  const linked = sources.flatMap((text) => [...text.matchAll(/https:\/\/www\.altium\.com\/documentation\/altium-developer-center[^\s)>"]*/g)].map((m) => m[0]));
  for (const url of [...sidebar, ...linked]) assert.ok(known.has(url), `${url} is not one of DEVELOPER_CENTER in pages.cjs`);
});

test('pageSections: ## and ### sections with Docusaurus anchors, code left out', () => {
  const sections = pageSections([
    '# Title', 'Lead text.', '## a365_schematic_script_run', 'Body `code` here.',
    '```bash', 'curl secret', '```', '### Iterate & rebuild', '#### Deeper', 'More.', '## a365_collaboration_comment_*',
  ].join('\n'));
  assert.deepEqual(sections.map((s) => s.anchor), [null, 'a365_schematic_script_run', 'iterate--rebuild', 'a365_collaboration_comment_']);
  assert.equal(sections[0].text, 'Lead text.');
  assert.ok(!sections[1].text.includes('curl'));
  assert.equal(sections[2].text, 'Deeper More.');
});

test('pageTitle: the first H1 outside code', () => {
  assert.equal(pageTitle('```\n# not this\n```\n# `a365_` tools\n'), 'a365_ tools');
});

test('absoluteLinks: page links become Markdown-twin URLs, other links and code stay', async () => {
  const pages = await readPages();
  const setup = pages.find((p) => p.route === '/setup/');
  const site = 'https://example.test/site';
  const text = [
    '[a](./tools/schematic.md#a365_schematic_script_run) [b](#requirements) [c](/glossary/) [d](https://x.test/y)',
    '<a href="#requirements">e</a> `[f](./security.md)`', '```', '[g](./security.md)', '```',
  ].join('\n');
  assert.equal(absoluteLinks(text, setup, pages, site), [
    `[a](${site}/tools/schematic.md#a365_schematic_script_run) [b](${site}/setup.md#requirements) [c](${site}/glossary.md) [d](https://x.test/y)`,
    `<a href="${site}/setup.md#requirements">e</a> \`[f](./security.md)\``, '```', '[g](./security.md)', '```',
  ].join('\n'));
});

// Queries readers type, and a page (or tool) whose record must rank in the top three.
const EXPECTED = [
  ['a365_schematic_script_run', 'a365_schematic_script_run'],
  ['a365_design_projectvariant_list', 'a365_design_projectvariant_list'],
  ['a365_schematic_object_highlight', 'a365_schematic_object_highlight'],
  ['claude code', 'Getting started'],
  ['vs code', 'Getting started'],
  ['what changed', 'Comparing revisions and variants'],
  ['diff', 'Comparing revisions and variants'],
  ['screenshot', 'Schematic images'],
  ['switch workspace', 'Platform'],
  ['sign in fails', 'Troubleshooting'],
  ['license', 'Troubleshooting'],
  ['commit', 'Project history'],
];

test('search: the expected page ranks in the top three', async () => {
  const { records, synonyms, index } = loadIndex(await buildIndex());
  for (const [query, page] of EXPECTED) {
    const top = search(index, records, query, { synonyms, limit: 3 }).map(({ record }) => record.t ?? record.n);
    const names = search(index, records, query, { synonyms, limit: 3 }).map(({ record }) => record.n);
    assert.ok(top.includes(page) || names.includes(page), `"${query}" → ${JSON.stringify(names)}, expected ${page}`);
  }
});

test('devcenter check: content rules', () => {
  assert.deepEqual(contentProblems('# Title\n\nText with `<b>` in code and <https://x.test/>.\n'), []);
  assert.deepEqual(contentProblems('---\ntitle: x\n---\n# T\n'), ['front matter']);
  assert.deepEqual(contentProblems('Text <div>x</div>\n'), ['no `# H1` title', 'HTML or JSX <div']);
});

test('devcenter check: links into the site must resolve, with their anchors', () => {
  const siteUrl = 'https://docs.example.test/platform-mcp-docs';
  const built = { 'tools/index.html': '<h2 id="naming">Naming</h2>' };
  const options = { siteUrl, pageDir: '/nowhere', readPage: (file) => built[file] ?? null };
  assert.equal(linkProblem(`${siteUrl}/tools/`, options), null);
  assert.equal(linkProblem(`${siteUrl}/tools/#naming`, options), null);
  assert.match(linkProblem(`${siteUrl}/tools/#gone`, options), /no heading #gone/);
  assert.match(linkProblem(`${siteUrl}/tools`, options), /trailing-slash/);
  assert.match(linkProblem(`${siteUrl}/missing/`, options), /no page/);
  assert.equal(linkProblem('https://claude.ai/download', options), null);
  assert.match(linkProblem('../content/setup.md', options), /absolute URL/);
});

test('search: every tool-page record has its tool group, and the filter keeps only that group', async () => {
  const payload = await buildIndex();
  assert.deepEqual(payload.groups.map((g) => g.title), allPages().filter((p) => p.kind === 'tool' && p.icon).map((p) => p.label));
  const tools = payload.records.filter((r) => r.x);
  assert.ok(tools.length >= 21 && tools.every((r) => payload.groups[r.c]), 'every tool name record has a group');
  const { records, synonyms, index } = loadIndex(payload);
  const comments = payload.groups.findIndex((g) => g.slug === 'comments');
  const hits = search(index, records, 'delete', { synonyms, toolGroup: comments });
  assert.ok(hits.length > 0 && hits.every(({ record }) => record.c === comments));
});
