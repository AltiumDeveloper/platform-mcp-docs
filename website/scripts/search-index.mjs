#!/usr/bin/env node
// Writes static/search-index.json for the theme's SearchBar (ranking: src/search/engine.mjs) from the pages listed in
// pages.cjs: one record per page and one per `##` / `###` section. Runs before `docusaurus build`; search:check then
// proves every record's URL and anchor exist in the built site.
//
// Record shape (short keys keep the index small): i id (= array index), n name (heading or page title), k kind (engine
// KINDS), u url (without baseUrl), d text, t page title (sections), c tool group (index into `groups`), x 1 for a
// tool name (shown in monospace).
import { mkdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { pageSections, readPages, stripMarkdown } from './lib/markdown.mjs';

const require = createRequire(import.meta.url);
const { allPages } = require('../pages.cjs');

// The tool groups: the tool pages with a sidebar icon, in sidebar order. A record on one of them carries `c`, its
// index here; the SearchBar shows it as a chip in the icon's colour and filters by it (src/theme/SearchResult,
// src/theme/SearchFilters).
export const TOOL_GROUPS = allPages().filter((page) => page.kind === 'tool' && page.icon)
  .map((page) => ({ route: page.route, title: page.label, slug: page.icon }));

export const TOOL_NAME = /`(a365_[a-z0-9_]+\*?)`/g;

// The tools of a page's tables: every backticked tool name in a row's first cell, with the row's other cells as text,
// and the anchor of the `##` section the table is in (null before the first heading).
export function toolRows(source) {
  const rows = [];
  let anchor = null;
  for (const section of pageSections(source, { keepLines: true })) {
    anchor = section.anchor;
    for (const line of section.lines) {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      if (cells.length < 2) continue;
      const names = [...cells[0].matchAll(TOOL_NAME)].map((m) => m[1]);
      const text = stripMarkdown(cells.slice(1).join(' '));
      for (const name of names) rows.push({ name, text, anchor, cells: cells.slice(1) });
    }
  }
  return rows;
}

// Phrasings readers type for terms the pages spell differently: a query matching `match` also searches for `add`.
const SYNONYMS = [
  { match: 'netlist|connected|wiring|trace', add: 'nets connectivity' },
  { match: 'claude|vs ?code|copilot|client|connector', add: 'connect client' },
  { match: 'login|log in|oauth|authori[sz]e', add: 'sign in' },
  { match: 'tenant|organi[sz]ation|switch workspace', add: 'workspace platform' },
  { match: 'annotation|review comment|reply', add: 'comments' },
  { match: 'commit|who changed|changelog', add: 'history' },
  { match: 'diff|what changed|before and after', add: 'comparing revisions and variants' },
  { match: 'variant|design configuration|not fitted', add: 'variants' },
  { match: 'screenshot|picture|image|show me|cross.?probe', add: 'images highlight' },
  { match: 'privacy|data leaves|permissions?|safe', add: 'security' },
  { match: 'not working|missing|disappeared|error|fails?|licen[cs]e', add: 'troubleshooting' },
]

export async function buildIndex() {
  const records = [];
  const push = (record) => records.push({ i: records.length, ...Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined && v !== '')) });
  const pages = await readPages();
  // Tools a table describes; a prose mention elsewhere (design.md names the diff tool) is not a second home.
  const describedElsewhere = new Set(pages.flatMap((page) => toolRows(page.text).map((row) => row.name)));
  for (const page of pages) {
    const group = TOOL_GROUPS.findIndex((g) => g.route === page.route);
    const c = group === -1 ? undefined : group;
    for (const section of pageSections(page.text)) {
      if (!section.heading) {
        push({ n: page.title, k: page.kind, u: page.route, d: page.description ?? section.text, c });
        continue;
      }
      push({ n: section.heading, k: page.kind, u: `${page.route}#${section.anchor}`, t: page.title, d: section.text, c });
    }
    // One record per tool named in a tool table (the tool pages have no per-tool headings): the tool name, its row's
    // description, and the page (or the section holding the table).
    const rows = toolRows(page.text);
    // A tool page also names tools in prose (a tool it hands over to, say):
    // those count, except the ones it only mentions while another page describes them.
    if (page.kind === 'tool') {
      for (const name of new Set([...page.text.matchAll(TOOL_NAME)].map((m) => m[1]))) {
        if (!rows.some((row) => row.name === name) && !describedElsewhere.has(name)) rows.push({ name, text: page.description, anchor: null });
      }
    }
    for (const tool of rows) {
      push({ n: tool.name, k: 'tool', u: tool.anchor ? `${page.route}#${tool.anchor}` : page.route, t: page.title, d: tool.text, c, x: 1 });
    }
  }
  return { version: 1, synonyms: SYNONYMS, groups: TOOL_GROUPS.map(({ title, slug }) => ({ title, slug })), records };
}

export async function runSearchIndex({ out = 'static/search-index.json' } = {}) {
  const payload = await buildIndex();
  const json = JSON.stringify(payload);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, json);
  return { records: payload.records.length, bytes: statSync(out).size, gzipBytes: gzipSync(json).length, payload };
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  const { records, bytes, gzipBytes, payload } = await runSearchIndex();
  const byKind = {};
  for (const record of payload.records) byKind[record.k] = (byKind[record.k] ?? 0) + 1;
  console.log(`search-index: ${records} records, ${(bytes / 1024).toFixed(0)} KiB (${(gzipBytes / 1024).toFixed(0)} KiB gzip)`);
  console.log(`  ${Object.entries(byKind).map(([kind, count]) => `${kind} ${count}`).join(', ')}`);
}
