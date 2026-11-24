// The tool reference against production. tools/snapshot.json is the server's tools/list, normalised by
// scripts/tool-snapshot.mjs; tools/not-in-snapshot.json names documented tools the snapshot's credential cannot see.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { TOOL_NAME, toolRows } from '../search-index.mjs';
import { FENCE, readPages } from './markdown.mjs';

const { REPO_ROOT, allPages } = createRequire(import.meta.url)('../../pages.cjs');
const CHANGELOG_ROUTE = '/changelog/';
export const SNAPSHOT = join(REPO_ROOT, 'tools/snapshot.json');
export const NOT_IN_SNAPSHOT = join(REPO_ROOT, 'tools/not-in-snapshot.json');

// Arguments every schema carries that say nothing about one tool: the server's own bookkeeping, and the workspace URL,
// which production lists for this credential on some responses and not others (tools/README.md).
const PLUMBING_ARGS = new Set(['conversation_id', 'workspace_url']);
const TOOL_FIELDS = ['name', 'title', 'description', 'inputSchema', 'annotations', '_meta'];

const sortKeys = (value) => Array.isArray(value) ? value.map(sortKeys)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]))
  : value;

export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

// tools/list entries to the snapshot: documented fields only, plumbing arguments dropped, tools and keys sorted.
export function normaliseTools(tools) {
  return tools.map((tool) => {
    const out = Object.fromEntries(TOOL_FIELDS.filter((field) => tool[field] !== undefined).map((field) => [field, tool[field]]));
    const schema = out.inputSchema;
    if (schema?.properties) {
      const required = schema.required?.filter((name) => !PLUMBING_ARGS.has(name));
      out.inputSchema = {
        ...schema,
        properties: Object.fromEntries(Object.entries(schema.properties).filter(([name]) => !PLUMBING_ARGS.has(name))),
        required,
      };
      if (!required?.length) delete out.inputSchema.required;
    }
    return sortKeys(out);
  }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

const KINDS = ['Read-only', 'Writes', 'Writes, destructive'];

// The Kind column a tool's annotations call for. MCP's destructiveHint defaults to true for a tool that writes.
export const kindOf = (annotations = {}) => annotations.readOnlyHint ? 'Read-only'
  : annotations.destructiveHint === false ? 'Writes' : 'Writes, destructive';

function leafChanges(before, after, path) {
  const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
  if (isObject(before) && isObject(after)) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
      .flatMap((key) => leafChanges(before[key], after[key], path ? `${path}.${key}` : key));
  }
  return JSON.stringify(before) === JSON.stringify(after) ? [] : [{ path, before, after }];
}

export function diffTools(before, after) {
  const old = new Map(before.map((tool) => [tool.name, tool]));
  const now = new Map(after.map((tool) => [tool.name, tool]));
  return {
    added: [...now.keys()].filter((name) => !old.has(name)),
    removed: [...old.keys()].filter((name) => !now.has(name)),
    changed: [...now.values()].filter((tool) => old.has(tool.name))
      .map((tool) => ({ name: tool.name, fields: leafChanges(old.get(tool.name), tool, '') }))
      .filter((change) => change.fields.length),
  };
}

const CODE_FENCE = '```';
const json = (v) => v === undefined ? '(absent)' : `${CODE_FENCE}json\n${JSON.stringify(v, null, 2)}\n${CODE_FENCE}`;
const code = (s) => `\`${s}\``;

// The diff as the author agent's task: every added tool in full, every removed name, every changed field.
export function diffMarkdown({ added, removed, changed }, after) {
  if (!added.length && !removed.length && !changed.length) return 'No changes to the production tools.\n';
  const byName = new Map(after.map((tool) => [tool.name, tool]));
  const out = ['# Tool changes', ''];
  if (added.length) out.push('## Added', '', ...added.flatMap((name) => [`### ${code(name)}`, '', json(byName.get(name)), '']));
  if (removed.length) out.push('## Removed', '', ...removed.map((name) => `- ${code(name)}`), '');
  if (changed.length) {
    out.push('## Changed', '');
    for (const { name, fields } of changed) {
      out.push(`### ${code(name)}`, '');
      for (const { path, before, after: now } of fields) out.push(`#### ${code(path)}`, '', 'Before:', '', json(before), '', 'After:', '', json(now), '');
    }
  }
  return out.join('\n');
}

// The reply to request `id` in a Streamable HTTP response body: JSON, or with an event-stream content type, the
// events whose data lines carry the messages.
export function parseReply(text, id, contentType = '') {
  const messages = /text\/event-stream/.test(contentType)
    ? text.split(/\r?\n\r?\n/).map((event) => event.split(/\r?\n/).filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).replace(/^ /, '')).join('\n')).filter(Boolean).map((data) => JSON.parse(data))
    : [JSON.parse(text)];
  const reply = messages.find((message) => message.id === id);
  if (!reply) throw new Error(`no reply to request ${id}`);
  return reply;
}

// Problems between the tool pages and the snapshot. With `base` (the snapshot and changelog of an earlier commit),
// every tool added or removed since must be named in a changelog line added since.
export function toolProblems({ snapshot, notInSnapshot, pages, base }) {
  const problems = [];
  const live = new Map(snapshot.map((tool) => [tool.name, tool]));
  const unseen = new Set(notInSnapshot.map((entry) => entry.name));
  const known = [...live.keys(), ...unseen];
  const rows = pages.filter((page) => page.kind === 'tool')
    .flatMap((page) => toolRows(page.text).map((row) => ({ ...row, file: page.file })));

  for (const name of known) {
    const count = rows.filter((row) => row.name === name).length;
    if (count !== 1) problems.push(`${name}: ${count} rows in the tool tables, expected 1`);
  }
  for (const name of unseen) {
    if (live.has(name)) problems.push(`${name} is in the snapshot now: remove it from tools/not-in-snapshot.json`);
  }
  for (const row of rows) {
    const tool = live.get(row.name);
    if (!tool && !unseen.has(row.name)) problems.push(`${row.file}: ${row.name} has a row but is not in the snapshot`);
    if (tool && row.cells[0] !== kindOf(tool.annotations)) {
      problems.push(`${row.file}: ${row.name} has Kind "${row.cells[0]}", its annotations call for "${kindOf(tool.annotations)}"`);
    }
    if (!tool && unseen.has(row.name) && !KINDS.includes(row.cells[0])) problems.push(`${row.file}: ${row.name} has Kind "${row.cells[0]}", not one of ${KINDS.join(' / ')}`);
  }
  // The changelog is history: it names tools that have since been removed.
  for (const page of pages.filter((p) => p.route !== CHANGELOG_ROUTE)) {
    for (const [, name] of page.text.matchAll(TOOL_NAME)) {
      const ok = name.endsWith('*') ? known.some((n) => n.startsWith(name.slice(0, -1))) : known.includes(name);
      if (!ok) problems.push(`${page.file}: names ${name}, which is not in the snapshot`);
    }
  }
  if (base) {
    const { added, removed } = diffTools(base.snapshot, snapshot);
    // Lines beyond the base's count of each: a re-added line identical to an older one still counts as new.
    const left = new Map();
    for (const line of base.changelog.split('\n')) left.set(line, (left.get(line) ?? 0) + 1);
    const changelog = pages.find((page) => page.route === CHANGELOG_ROUTE);
    const newLines = (changelog?.text ?? '').split('\n').filter((line) => {
      const count = left.get(line) ?? 0;
      left.set(line, count - 1);
      return count <= 0;
    }).join('\n');
    for (const name of [...added, ...removed]) {
      if (!newLines.includes(code(name))) problems.push(`${changelog?.file}: ${name} was ${added.includes(name) ? 'added' : 'removed'} but no new line names it`);
    }
  }
  return [...new Set(problems)];
}

const DASHES = String.fromCharCode(0x2013, 0x2014);
const CURLY = String.fromCharCode(0x2018, 0x2019, 0x201c, 0x201d);

// The rules of the Writing section of content/README.md that a pattern can check. Fenced code is skipped.
const PROSE_RULES = [
  ['an em or en dash', new RegExp(`[${DASHES}]`)],
  ['a curly quote', new RegExp(`[${CURLY}]`)],
  ['a parenthesised link', /\(\s*(?:see\s+)?\[[^\]]+\]\([^)]+\)\s*\)/i],
  ['the word "internal"', /\binternal\b/i],
  ['a licence feature id', /Altium_AFS_/],
  ['a number next to a rate limit', /rate.?limit[^.\n]*\b(?!(?:365|429)\b)\d/i],
];

export function proseProblems(text, file) {
  const problems = [];
  let fenced = false;
  text.split('\n').forEach((line, i) => {
    if (FENCE.test(line)) fenced = !fenced;
    if (fenced) return;
    for (const [rule, pattern] of PROSE_RULES) if (pattern.test(line)) problems.push(`${file}:${i + 1}: ${rule}`);
  });
  return problems;
}

// The snapshot and changelog as they were at git `ref`, for toolProblems' `base`.
export function baseAt(ref) {
  const show = (path) => {
    try {
      return execFileSync('git', ['show', `${ref}:${path}`], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      throw new Error(`cannot read ${path} at ${ref}: ${String(error.stderr ?? error.message).trim()}`);
    }
  };
  const changelog = allPages().find((page) => page.route === CHANGELOG_ROUTE).file;
  return { snapshot: JSON.parse(show('tools/snapshot.json')), changelog: show(changelog) };
}

export async function checkAll({ base } = {}) {
  const pages = await readPages();
  return [
    ...toolProblems({ snapshot: readJson(SNAPSHOT), notInSnapshot: readJson(NOT_IN_SNAPSHOT), pages, base }),
    ...pages.flatMap((page) => proseProblems(page.text, page.file)),
  ];
}
