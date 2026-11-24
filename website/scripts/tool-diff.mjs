#!/usr/bin/env node
// Prints, as Markdown, what changed between two snapshots: `node scripts/tool-diff.mjs <before.json> <after.json>`.
// The output is the author agent's task (.agents/skills/update-tool-docs).
import { diffMarkdown, diffTools, readJson } from './lib/tools.mjs';

const files = process.argv.slice(2);
if (files.length !== 2) {
  console.error('usage: tool-diff.mjs <before.json> <after.json>');
  process.exit(2);
}
const [before, after] = files.map(readJson);
process.stdout.write(diffMarkdown(diffTools(before, after), after));
