// Tests for the tool reference checks (scripts/lib/tools.mjs): snapshot normalising, diffing, and the problems
// tools-check reports. Run with `npm test`.
import assert from 'node:assert/strict';
import test from 'node:test';
import { SNAPSHOT, checkAll, diffMarkdown, diffTools, kindOf, normaliseTools, parseReply, proseProblems, readJson, toolProblems } from '../scripts/lib/tools.mjs';

const tool = (name, annotations, extra = {}) => ({ name, description: `${name} does a thing.`, annotations, inputSchema: { type: 'object', properties: {} }, ...extra });
const READ = { readOnlyHint: true, destructiveHint: false };
const WRITE = { readOnlyHint: false, destructiveHint: false };
const page = (file, text, kind = 'tool', route = null) => ({ file, text, kind, route });
const table = (...rows) => ['| Tool | Kind | What it does |', '| --- | --- | --- |', ...rows.map(([n, k]) => `| \`${n}\` | ${k} | Does it. |`)].join('\n');

test('the repository: tool pages match the snapshot and follow the writing rules', async () => {
  assert.deepEqual(await checkAll(), []);
});

test('the repository: the snapshot is already normalised', () => {
  assert.deepEqual(normaliseTools(readJson(SNAPSHOT)), readJson(SNAPSHOT));
});

test('normaliseTools: documented fields only, plumbing arguments dropped, sorted', () => {
  const raw = [
    { name: 'a365_b', execution: { x: 1 }, inputSchema: { type: 'object', required: ['conversation_id', 'ids'], properties: { ids: { type: 'array' }, conversation_id: { type: 'string' } } } },
    { name: 'a365_a', title: 'A', annotations: { readOnlyHint: true, destructiveHint: false } },
  ];
  const [a, b] = normaliseTools(raw);
  assert.equal(a.name, 'a365_a');
  assert.deepEqual(Object.keys(a.annotations), ['destructiveHint', 'readOnlyHint']);
  assert.equal(b.execution, undefined);
  assert.deepEqual(b.inputSchema, { properties: { ids: { type: 'array' } }, required: ['ids'], type: 'object' });
  const [only] = normaliseTools([{ name: 'a365_c', inputSchema: { type: 'object', required: ['conversation_id'], properties: { conversation_id: {} } } }]);
  assert.deepEqual(only.inputSchema, { properties: {}, type: 'object' });
});

test('kindOf: read-only, writes, and destructive by default', () => {
  assert.equal(kindOf(READ), 'Read-only');
  assert.equal(kindOf(WRITE), 'Writes');
  assert.equal(kindOf({ readOnlyHint: false }), 'Writes, destructive');
  assert.equal(kindOf(), 'Writes, destructive');
});

test('diffTools and diffMarkdown: added, removed, and each changed field', () => {
  const before = [tool('a365_keep', READ), tool('a365_gone', READ)];
  const after = [tool('a365_keep', READ, { description: 'Now different.' }), tool('a365_new', WRITE)];
  const diff = diffTools(before, after);
  assert.deepEqual(diff.added, ['a365_new']);
  assert.deepEqual(diff.removed, ['a365_gone']);
  assert.deepEqual(diff.changed, [{ name: 'a365_keep', fields: [{ path: 'description', before: 'a365_keep does a thing.', after: 'Now different.' }] }]);
  const md = diffMarkdown(diff, after);
  for (const part of ['## Added', '### `a365_new`', '## Removed', '- `a365_gone`', '#### `description`', 'Now different.']) assert.ok(md.includes(part), part);
  assert.match(diffMarkdown(diffTools(after, after), after), /No changes/);
  const limit = (max) => [tool('a365_keep', READ, { inputSchema: { type: 'object', properties: { ids: { type: 'array', maxItems: max } } } })];
  const nested = diffTools(limit(5), limit(10));
  assert.deepEqual(nested.changed[0].fields, [{ path: 'inputSchema.properties.ids.maxItems', before: 5, after: 10 }]);
  assert.ok(diffMarkdown(nested, limit(10)).includes('#### `inputSchema.properties.ids.maxItems`'));
  const args = (props) => [tool('a365_keep', READ, { inputSchema: { type: 'object', properties: props } })];
  const dropped = diffTools(args({ ids: { type: 'array' }, gone: { type: 'string' } }), args({ ids: { type: 'array' } }));
  assert.deepEqual(dropped.changed[0].fields, [{ path: 'inputSchema.properties.gone', before: { type: 'string' }, after: undefined }]);
  assert.ok(diffMarkdown(dropped, args({ ids: { type: 'array' } })).includes('After:\n\n(absent)'));
});

test('toolProblems: rows, kinds, unknown names, and the not-in-snapshot list', () => {
  const snapshot = [tool('a365_read', READ), tool('a365_write', WRITE), tool('a365_seen', READ)];
  const notInSnapshot = [{ name: 'a365_hidden' }, { name: 'a365_seen' }];
  const pages = [
    page('content/tools/x.md', table(['a365_read', 'Writes'], ['a365_hidden', '*Read-only*'], ['a365_extra', 'Read-only'], ['a365_seen', 'Read-only'])),
    page('content/tools/y.md', table(['a365_seen', 'Read-only'])),
    page('content/guide.md', 'Use `a365_typo` or `a365_read`, or any `a365_wr*`, not `a365_zz*`. Again, `a365_typo`.', 'guide'),
  ];
  assert.deepEqual(toolProblems({ snapshot, notInSnapshot, pages }).sort(), [
    'a365_seen is in the snapshot now: remove it from tools/not-in-snapshot.json',
    'a365_seen: 2 rows in the tool tables, expected 1',
    'a365_write: 0 rows in the tool tables, expected 1',
    'content/tools/x.md: a365_hidden has Kind "*Read-only*", not one of Read-only / Writes / Writes, destructive',
    'content/guide.md: names a365_typo, which is not in the snapshot',
    'content/guide.md: names a365_zz*, which is not in the snapshot',
    'content/tools/x.md: a365_extra has a row but is not in the snapshot',
    'content/tools/x.md: names a365_extra, which is not in the snapshot',
    'content/tools/x.md: a365_read has Kind "Writes", its annotations call for "Read-only"',
  ].sort());
});

test('toolProblems: with a base, a new changelog line names every tool added or removed', () => {
  const snapshot = [tool('a365_new', READ)];
  const older = '# Changelog\n\nIntro.\n\n## First release\n\n- `a365_new` and `a365_old`.\n';
  const base = { snapshot: [tool('a365_old', READ)], changelog: older };
  const pages = [page('content/tools/x.md', table(['a365_new', 'Read-only'])), page('content/changelog.md', older, 'help', '/changelog/')];
  assert.deepEqual(toolProblems({ snapshot, notInSnapshot: [], pages, base }), [
    'content/changelog.md: a365_new was added but no new line names it',
    'content/changelog.md: a365_old was removed but no new line names it',
  ]);
  pages[1].text = older.replace('## First release', '## 2026-12-01\n\n- Added `a365_new`; removed `a365_old`.\n\n## First release');
  assert.deepEqual(toolProblems({ snapshot, notInSnapshot: [], pages, base }), []);
  const again = '# Changelog\n\n## 2026-11-01\n\n- **Added** `a365_new`.\n';
  const readded = [page('content/tools/x.md', table(['a365_new', 'Read-only'])), page('content/changelog.md', `# Changelog\n\n## 2026-12-01\n\n- **Added** \`a365_new\`.\n\n${again.slice(13)}`, 'help', '/changelog/')];
  assert.deepEqual(toolProblems({ snapshot, notInSnapshot: [], pages: readded, base: { snapshot: [], changelog: again } }), []);
});

test('toolProblems: a table on a guide page is not a tool row', () => {
  const pages = [page('content/tools/x.md', table(['a365_read', 'Read-only'])), page('content/guide.md', table(['a365_read', 'Read-only']), 'guide')];
  assert.deepEqual(toolProblems({ snapshot: [tool('a365_read', READ)], notInSnapshot: [], pages }), []);
});

test('toolProblems: a tool name with digits is found in its row', () => {
  const pages = [page('content/tools/x.md', table(['a365_design_project3d_capture', 'Read-only']))];
  assert.deepEqual(toolProblems({ snapshot: [tool('a365_design_project3d_capture', READ)], notInSnapshot: [], pages }), []);
});

test('parseReply: JSON, or the matching event of an event stream', () => {
  assert.deepEqual(parseReply('{"jsonrpc":"2.0","id":2,"result":{"tools":[]}}', 2), { jsonrpc: '2.0', id: 2, result: { tools: [] } });
  const stream = [
    'event: message', 'data: {"jsonrpc":"2.0","method":"notifications/message","params":{}}', '',
    'event: message', 'data: {"jsonrpc":"2.0","id":2,', 'data: "result":{"tools":[{"name":"a365_x"}]}}', '',
  ].join('\n');
  assert.equal(parseReply(stream, 2, 'text/event-stream').result.tools[0].name, 'a365_x');
  assert.throws(() => parseReply(stream, 3, 'text/event-stream'), /no reply to request 3/);
  assert.equal(parseReply('{"id":1,"result":{"description":"data: in text"}}', 1, 'application/json').result.description, 'data: in text');
  assert.equal(parseReply('event: message\r\ndata:{"id":4,"result":{"ok":true}}\r\n\r\n', 4, 'text/event-stream; charset=utf-8').result.ok, true);
});

test('proseProblems: each writing rule, with fenced code skipped', () => {
  const dash = String.fromCharCode(0x2014);
  const quote = String.fromCharCode(0x201c);
  const text = [
    `One${dash}two.`, `A ${quote}quote.`, 'Read this (see [Setup](./setup.md)).', 'An internal tool.',
    'Needs Altium_AFS_Extensibility_MCP_Core.', 'The rate limit is 60 calls a minute.', '```', `code${dash}is fine`, '```', 'Plain text.',
    'The rate limit applies to every `a365_` tool.', 'The rate limit is shared by every Altium 365 workspace.', 'Past the rate limit, the client shows HTTP 429.', '~~~', `tilde${dash}fenced`, '~~~',
  ].join('\n');
  assert.deepEqual(proseProblems(text, 'p.md'), [
    'p.md:1: an em or en dash', 'p.md:2: a curly quote', 'p.md:3: a parenthesised link', 'p.md:4: the word "internal"',
    'p.md:5: a licence feature id', 'p.md:6: a number next to a rate limit',
  ]);
});
