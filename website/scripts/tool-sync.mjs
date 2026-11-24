#!/usr/bin/env node
// The tool sync fix loop (decisions in lib/sync.mjs): `node scripts/tool-sync.mjs <tool-diff.md>`. Expects the snapshot
// staged, and writes its result next to the diff, in the gitignored .tool-sync/ that the agents can read.
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import {
  AUTHOR_SCHEMA, AUTHOR_TOOLS, DENIED_TOOLS, REVIEW_SCHEMA, REVIEW_TOOLS, claudeArgs, parseClaudeReply, pathBreaches, prBody,
  runRounds, tail,
} from './lib/sync.mjs';
import { NOT_IN_SNAPSHOT, readJson } from './lib/tools.mjs';

const { REPO_ROOT } = createRequire(import.meta.url)('../pages.cjs');
const MODEL = 'claude-opus-5-5';
const BUDGET = { author: '5', review: '2' };
// Dry runs (tools/README.md) swap in a stand-in for claude and a local base ref.
const CLAUDE = process.env.CLAUDE_BIN ?? 'claude';
const BASE = process.env.TOOL_SYNC_BASE ?? 'origin/main';

const git = (...args) => execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
const lines = (text) => text.split('\n').filter(Boolean);

// A hung claude would otherwise run into the job timeout and leave no result for the PR step.
const CLAUDE_TIMEOUT_MS = 20 * 60 * 1000;
const CHECK_TIMEOUT_MS = 10 * 60 * 1000;

function claude(run) {
  const args = claudeArgs({ ...run, model: MODEL, denied: DENIED_TOOLS });
  return parseClaudeReply(spawnSync(CLAUDE, args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: CLAUDE_TIMEOUT_MS }));
}

// The author's work against the staged baseline, checked by the path gate.
function breaches() {
  let after;
  try {
    after = readJson(NOT_IN_SNAPSHOT);
  } catch (error) {
    return [`tools/not-in-snapshot.json is not valid JSON: ${error.message}`];
  }
  if (!Array.isArray(after)) return ['tools/not-in-snapshot.json is not a JSON array'];
  const work = { changed: lines(git('diff', '--name-only')), added: lines(git('ls-files', '--others', '--exclude-standard')) };
  return pathBreaches(work, JSON.parse(git('show', ':tools/not-in-snapshot.json')), after);
}

// The checks a change must pass, run without the API key; each failure keeps the end of its output.
function checks() {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  const failures = [];
  for (const [name, command, args] of [
    ['npm test', 'npm', ['test']],
    ['npm run build', 'npm', ['run', 'build']],
    ['tools-check --base', 'node', ['scripts/tools-check.mjs', '--base', BASE]],
  ]) {
    const run = spawnSync(command, args, { cwd: join(REPO_ROOT, 'website'), encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024, timeout: CHECK_TIMEOUT_MS });
    // Passing test lines say nothing about the failure.
    const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.split('\n').filter((line) => !/^\s*✔/.test(line)).join('\n');
    if (run.status !== 0) failures.push(`${name} failed:\n${tail(output, 3000)}`);
  }
  return failures;
}

if (!process.argv[2]) {
  console.error('usage: tool-sync.mjs <tool-diff.md>');
  process.exit(2);
}
const out = dirname(process.argv[2]);
const diffFile = relative(REPO_ROOT, process.argv[2]);
const session = randomUUID();
const docsDiff = join(out, 'docs.diff');

const result = runRounds({
  firstPrompt: `/update-tool-docs ${diffFile}`,
  workState: () => git('diff') + git('ls-files', '--others', '--exclude-standard'),
  author: (prompt, round) => claude({ prompt, tools: AUTHOR_TOOLS, schema: AUTHOR_SCHEMA, budget: BUDGET.author, session, resume: round > 1 }),
  breaches,
  checks,
  review: () => {
    writeFileSync(docsDiff, git('diff', 'HEAD', '--', 'content/tools', 'content/changelog.md', 'tools/not-in-snapshot.json'));
    const prompt = `/review-tool-docs ${diffFile} ${relative(REPO_ROOT, docsDiff)} tools/snapshot.json`;
    return claude({ prompt, tools: REVIEW_TOOLS, schema: REVIEW_SCHEMA, budget: BUDGET.review });
  },
});

writeFileSync(join(out, 'tool-sync-result.json'), `${JSON.stringify(result, null, 2)}\n`);
const runUrl = process.env.GITHUB_RUN_ID && `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
writeFileSync(join(out, 'tool-sync-pr.md'), prBody(result, runUrl));
console.log(`tool-sync: ${result.status} after ${result.rounds} round(s)`);
