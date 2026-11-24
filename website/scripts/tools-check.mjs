#!/usr/bin/env node
// Fails when the tool pages disagree with tools/snapshot.json (lib/tools.mjs toolProblems) or a published page breaks a
// writing rule. `--base <git ref>` also requires a new changelog line naming every tool added or removed since it.
import { baseAt, checkAll } from './lib/tools.mjs';

const at = process.argv.indexOf('--base');
if (at > 0 && !process.argv[at + 1]) {
  console.error('usage: tools-check.mjs [--base <git ref>]');
  process.exit(2);
}
let problems;
try {
  problems = await checkAll({ base: at > 0 ? baseAt(process.argv[at + 1]) : undefined });
} catch (error) {
  console.error(`tools-check: ${error.message}`);
  process.exit(2);
}
for (const problem of problems) console.error(`tools-check: ${problem}`);
if (problems.length) process.exit(1);
console.log('tools-check: the tool pages match the snapshot');
