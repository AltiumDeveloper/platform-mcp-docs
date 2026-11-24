// Tests for the tool sync loop's decisions (scripts/lib/sync.mjs). Run with `npm test`.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTHOR_TOOLS, REVIEW_TOOLS, claudeArgs, feedbackPrompt, formatFinding, parseClaudeReply, pathBreaches, prBody, runRounds, tail,
} from '../scripts/lib/sync.mjs';

test('pathBreaches: the author may change tool pages, the changelog and remove exemptions, nothing else', () => {
  const exempt = [{ name: 'a365_a' }, { name: 'a365_b' }];
  const ok = { changed: ['content/tools/design.md', 'content/changelog.md', 'tools/not-in-snapshot.json'], added: [] };
  assert.deepEqual(pathBreaches(ok, exempt, [{ name: 'a365_a' }]), []);
  assert.deepEqual(pathBreaches({ changed: ['content/setup.md', 'tools/snapshot.json', 'content/tools/sub/x.md'], added: ['content/tools/new.md'] }, exempt, exempt), [
    'content/setup.md is outside the tool pages',
    'tools/snapshot.json is outside the tool pages',
    'content/tools/sub/x.md is outside the tool pages',
    'content/tools/new.md is a new file',
  ]);
  assert.deepEqual(pathBreaches({ changed: ['tools/not-in-snapshot.json'], added: [] }, exempt, [...exempt, { name: 'a365_c' }]), ['tools/not-in-snapshot.json gained a365_c']);
});

test('the reviewer can only read, and the author can only edit within its paths', () => {
  assert.ok(REVIEW_TOOLS.every((tool) => !/^(Edit|Write|Bash)/.test(tool)));
  assert.ok(AUTHOR_TOOLS.every((tool) => !/^(Write|Bash)/.test(tool) && (!tool.startsWith('Edit') || /^Edit\((content\/tools\/\*\*|content\/changelog\.md|tools\/not-in-snapshot\.json)\)$/.test(tool))));
});

test('feedbackPrompt and formatFinding: the failures to fix or dispute', () => {
  const finding = formatFinding({ file: 'content/tools/design.md', line: 12, rule: 'Wrong or missing', issue: 'The cap is 50.' });
  assert.equal(finding, 'content/tools/design.md:12 (Wrong or missing): The cap is 50.');
  assert.equal(formatFinding({ file: 'content/changelog.md', rule: 'r', issue: 'i' }), 'content/changelog.md (r): i');
  const prompt = feedbackPrompt(2, 'review', [finding]);
  assert.match(prompt, /^Round 2 of 3\. The reviewer found these blocking problems\./);
  assert.ok(prompt.endsWith(`- ${finding}`));
  assert.match(feedbackPrompt(3, 'checks', ['npm test failed']), /These checks failed/);
});

test('prBody: a passing run, and one left for a person', () => {
  const done = prBody({ status: 'done', rounds: 2, summary: 'Added a row.', failures: [], disputes: [], notes: ['Tighter wording.'] });
  assert.match(done, /passed the checks and review in round 2/);
  assert.ok(prBody({ ...{ status: 'done', rounds: 1, summary: '', failures: [], disputes: [], notes: [] } }, 'https://x.test/run/1').includes('[workflow run summary](https://x.test/run/1)'));
  assert.ok(done.includes('## What changed') && done.includes('- Tighter wording.') && !done.includes('## Outstanding'));
  const stuck = prBody({ status: 'needs_human', rounds: 3, summary: '', failures: ['npm test failed'], disputes: [{ failure: 'x', reason: 'the snapshot says y' }], notes: [] });
  assert.match(stuck, /stopped for a person to finish, after 3 of 3 rounds/);
  assert.ok(stuck.includes('- npm test failed') && stuck.includes('- x: the snapshot says y'));
  assert.ok(stuck.includes('## Disputed findings') && !stuck.includes('## What changed') && !stuck.includes('## Review notes'));
  const fenced = prBody({ status: 'needs_human', rounds: 1, summary: '', failures: ['npm test failed:\nline one\nline two'], disputes: [], notes: [] });
  assert.ok(fenced.includes('- ````\n  npm test failed:\n  line one\n  line two\n  ````'));
});

test('parseClaudeReply: structured output, or why there is none', () => {
  const ok = { status: 0, stdout: JSON.stringify({ type: 'result', subtype: 'success', is_error: false, session_id: 's', structured_output: { status: 'done' } }) };
  assert.deepEqual(parseClaudeReply(ok), { output: { status: 'done' } });
  assert.deepEqual(parseClaudeReply({ status: 1, stdout: JSON.stringify({ subtype: 'error_max_budget_usd', is_error: true }) }), { error: 'claude stopped with error_max_budget_usd' });
  assert.deepEqual(parseClaudeReply({ status: 0, stdout: JSON.stringify({ subtype: 'success', is_error: false }) }), { error: 'claude stopped with success' });
  assert.match(parseClaudeReply({ status: 1, stdout: 'not json', stderr: 'Invalid API key' }).error, /exited 1 without a result: Invalid API key/);
  assert.match(parseClaudeReply({ status: null, stdout: null, error: new Error('spawn claude ENOENT') }).error, /could not start: spawn claude ENOENT/);
  assert.deepEqual(parseClaudeReply({ status: null, stdout: '', error: Object.assign(new Error('spawnSync claude ETIMEDOUT'), { code: 'ETIMEDOUT' }) }), { error: 'claude ran past its time limit' });
  assert.deepEqual(parseClaudeReply({ status: 1, stdout: JSON.stringify({ subtype: 'error_during_execution', is_error: true, structured_output: { status: 'done' } }) }), { error: 'claude stopped with error_during_execution' });
  assert.match(parseClaudeReply({ status: 1, stdout: 'not json', stderr: '' }).error, /without a result: not json$/);
  assert.deepEqual(parseClaudeReply({ status: 0, stdout: 'null' }), { error: 'claude stopped with an error' });
});

// A scripted run: each step returns the next scripted value, and the work changes when the author says so.
function script({ authors, checks = [], reviews = [], breaches = [] }) {
  let work = 0;
  const calls = { prompts: [], reviews: 0 };
  return {
    calls,
    firstPrompt: '/update-tool-docs .tool-sync/tool-diff.md',
    workState: () => String(work),
    author: (prompt) => {
      calls.prompts.push(prompt);
      const reply = authors.shift();
      if (reply.changes !== false) work++;
      return reply.error ? { error: reply.error } : { output: reply.output };
    },
    breaches: () => breaches.shift() ?? [],
    checks: () => checks.shift() ?? [],
    review: () => {
      calls.reviews++;
      return reviews.shift();
    },
  };
}
const done = (summary = 'Updated a row.', responses = []) => ({ output: { status: 'done', summary, responses } });
const pass = { output: { verdict: 'pass', blocking: [], notes: ['Fine.'] } };
const fail = (issue) => ({ output: { verdict: 'fail', blocking: [{ file: 'content/tools/design.md', rule: 'Wrong or missing', issue }], notes: [] } });

test('runRounds: a first-round pass', () => {
  const steps = script({ authors: [done()], reviews: [pass] });
  assert.deepEqual(runRounds(steps), { status: 'done', rounds: 1, summary: 'Updated a row.', failures: [], disputes: [], notes: ['Fine.'], history: [] });
  assert.deepEqual(steps.calls.prompts, ['/update-tool-docs .tool-sync/tool-diff.md']);
});

test('runRounds: review findings go back to the author, and a fix passes', () => {
  const steps = script({ authors: [done(), done('Fixed the cap.', [{ failure: 'cap', action: 'disputed', reason: 'snapshot says 50' }])], reviews: [fail('The cap is 60.'), pass] });
  const result = runRounds(steps);
  assert.equal(result.status, 'done');
  assert.equal(result.rounds, 2);
  assert.match(steps.calls.prompts[1], /^Round 2 of 3\. The reviewer found these blocking problems\.[\s\S]*The cap is 60\./);
  assert.deepEqual(result.disputes, [{ failure: 'cap', action: 'disputed', reason: 'snapshot says 50' }]);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.history, [{ round: 1, failures: ['content/tools/design.md (Wrong or missing): The cap is 60.'] }]);
});

test('runRounds: failed checks go back to the author without a review, and three failures stop the run', () => {
  const steps = script({ authors: [done(), done(), done()], checks: [['npm test failed'], ['npm test failed'], ['npm test failed']] });
  const result = runRounds(steps);
  assert.deepEqual([result.status, result.rounds, result.failures], ['needs_human', 3, ['npm test failed']]);
  assert.equal(steps.calls.reviews, 0);
  assert.match(steps.calls.prompts[2], /^Round 3 of 3\. These checks failed\./);
});

test('runRounds: the stops', () => {
  const stopped = (spec) => runRounds(script(spec));
  assert.deepEqual(stopped({ authors: [{ error: 'claude stopped with error_max_budget_usd' }] }).failures, ['claude stopped with error_max_budget_usd']);
  assert.deepEqual(stopped({ authors: [{ output: { status: 'needs_human', summary: 'A new area.', responses: [] } }] }).failures, ['The author stopped: A new area.']);
  const breached = stopped({ authors: [done()], breaches: [['content/setup.md is outside the tool pages']] });
  assert.deepEqual([breached.failures, breached.breach], [['content/setup.md is outside the tool pages'], true]);
  assert.deepEqual(stopped({ authors: [done()], reviews: [{ error: 'claude stopped with an error' }] }).failures, ['claude stopped with an error']);
  const unchanged = stopped({ authors: [done(), { ...done(), changes: false }], reviews: [fail('The cap is 60.')] });
  assert.deepEqual([unchanged.rounds, unchanged.failures.at(-1)], [2, 'The author changed nothing in response to these.']);
  assert.ok(unchanged.failures[0].includes('The cap is 60.'));
  const disputedAll = stopped({ authors: [done(), { ...done('No.', [{ failure: 'cap', action: 'disputed', reason: 'r' }]), changes: false }], reviews: [fail('The cap is 60.')] });
  assert.equal(disputedAll.failures.at(-1), 'The author disputed these without changing anything.');
  const emptySteps = script({ authors: [done(), done(), done()], reviews: [{ output: { verdict: 'fail', blocking: [], notes: [] } }, pass] });
  const emptyFail = runRounds(emptySteps);
  assert.deepEqual([emptyFail.status, emptyFail.rounds], ['done', 2]);
  assert.match(emptySteps.calls.prompts[1], /The reviewer failed the change without naming a blocking problem\./);
  const crashed = runRounds({ ...script({ authors: [done()] }), breaches: () => { throw new Error('bad JSON'); } });
  assert.deepEqual([crashed.status, crashed.failures], ['needs_human', ['The run failed: bad JSON']]);
});

test('runRounds: a pass verdict with blocking findings is a fail', () => {
  const steps = script({ authors: [done(), done()], reviews: [{ output: { verdict: 'pass', blocking: [{ file: 'f.md', rule: 'r', issue: 'Still wrong.' }], notes: [] } }, pass] });
  assert.deepEqual([runRounds(steps).rounds], [2]);
  assert.match(steps.calls.prompts[1], /Still wrong\./);
});

test('runRounds: a first round that needs no page change can pass', () => {
  assert.deepEqual(runRounds(script({ authors: [{ ...done('No page change.'), changes: false }], reviews: [pass] })).status, 'done');
});

test('runRounds: a later stop keeps the findings the author was answering', () => {
  const after = (second, extra = {}) => runRounds({ ...script({ authors: [done(), second], reviews: [fail('The cap is 60.')], ...extra }) }).failures;
  const finding = 'content/tools/design.md (Wrong or missing): The cap is 60.';
  assert.deepEqual(after({ error: 'claude stopped with error_max_budget_usd' }), ['claude stopped with error_max_budget_usd', finding]);
  assert.deepEqual(after({ output: { status: 'needs_human', summary: 'Unsure.', responses: [] } }), ['The author stopped: Unsure.', finding]);
  let calls = 0;
  const thrown = runRounds({ ...script({ authors: [done(), done()], reviews: [fail('The cap is 60.')] }), breaches: () => { if (calls++) throw new Error('bad JSON'); return []; } });
  assert.deepEqual(thrown.failures, ['The run failed: bad JSON', finding]);
});

test('runRounds: disputes add up, notes come from the last review, summaries keep the first', () => {
  const dispute = (reason) => done(`Round fix ${reason}.`, [{ failure: 'x', action: 'disputed', reason }]);
  const result = runRounds(script({
    authors: [done('Changed the cap.'), dispute('one'), dispute('two')],
    reviews: [{ output: { verdict: 'fail', blocking: [{ file: 'f.md', rule: 'r', issue: 'a' }], notes: ['Early note.'] } }, fail('b'), { output: { verdict: 'pass', blocking: [], notes: [] } }],
  }));
  assert.deepEqual(result.disputes.map((d) => d.reason), ['one', 'two']);
  assert.deepEqual(result.notes, []);
  assert.equal(result.summary, 'Changed the cap.\n\nRound 2: Round fix one.\n\nRound 3: Round fix two.');
});

test('claudeArgs: the author starts a session and resumes it, the reviewer has none', () => {
  const base = { prompt: 'p', model: 'm', tools: ['Read'], denied: ['Read(//proc/**)'], schema: { type: 'object' }, budget: '5' };
  const first = claudeArgs({ ...base, session: 'id' });
  assert.deepEqual(first.slice(-2), ['--session-id', 'id']);
  assert.deepEqual(claudeArgs({ ...base, session: 'id', resume: true }).slice(-2), ['--resume', 'id']);
  const review = claudeArgs(base);
  assert.ok(!review.includes('--session-id') && !review.includes('--resume'));
  assert.deepEqual(first.slice(first.indexOf('--permission-mode')), [
    '--permission-mode', 'dontAsk', '--allowedTools', 'Read', '--disallowedTools', 'Read(//proc/**)',
    '--output-format', 'json', '--json-schema', '{"type":"object"}', '--max-budget-usd', '5', '--session-id', 'id',
  ]);
});

test('tail: the end of the output, from a line start', () => {
  assert.equal(tail('abc\ndef\nghi', 5), 'ghi');
  assert.equal(tail('abcdefghij', 4), 'ghij');
  assert.equal(tail('short', 100), 'short');
  assert.equal(tail('abc\ndef\n', 4), 'def');
});

test('runRounds: fixed findings are not disputes, and a mixed reply that changes nothing says so', () => {
  const mixed = [{ failure: 'a', action: 'fixed', reason: 'done' }, { failure: 'b', action: 'disputed', reason: 'no' }];
  const result = runRounds(script({ authors: [done(), done('Mixed.', mixed)], reviews: [fail('a'), pass] }));
  assert.deepEqual(result.disputes.map((d) => d.failure), ['b']);
  const unchanged = runRounds(script({ authors: [done(), { ...done('Mixed.', mixed), changes: false }], reviews: [fail('a')] }));
  assert.equal(unchanged.failures.at(-1), 'The author changed nothing in response to these.');
});

test('runRounds: breaches and reviewer errors keep the findings, and failed checks clear stale notes', () => {
  const finding = 'content/tools/design.md (Wrong or missing): a';
  let calls = 0;
  const breached = runRounds({ ...script({ authors: [done(), done()], reviews: [fail('a')] }), breaches: () => (calls++ ? ['content/setup.md is outside the tool pages'] : []) });
  assert.deepEqual(breached.failures, ['content/setup.md is outside the tool pages', finding]);
  assert.deepEqual(runRounds(script({ authors: [done(), done()], reviews: [fail('a'), { error: 'claude stopped with an error' }] })).failures, ['claude stopped with an error', finding]);
  const noted = { output: { verdict: 'fail', blocking: [{ file: 'f.md', rule: 'r', issue: 'i' }], notes: ['Old note.'] } };
  const result = runRounds(script({ authors: [done(), done(), done()], reviews: [noted], checks: [[], ['npm test failed'], ['npm test failed']] }));
  assert.deepEqual([result.status, result.notes], ['needs_human', []]);
});

test('runRounds: failed checks replace an earlier review finding as what is outstanding', () => {
  const result = runRounds(script({ authors: [done(), done(), { error: 'budget' }], reviews: [fail('old finding')], checks: [[], ['npm test failed']] }));
  assert.deepEqual(result.failures, ['budget', 'npm test failed']);
  const unchanged = runRounds(script({ authors: [done(), { ...done(), changes: false }], checks: [['npm test failed']] }));
  assert.deepEqual(unchanged.failures, ['npm test failed', 'The author changed nothing in response to these.']);
});

test('normaliseTools drops workspace_url, which production lists inconsistently', async () => {
  const { normaliseTools } = await import('../scripts/lib/tools.mjs');
  const [tool] = normaliseTools([{ name: 'a365_x', inputSchema: { type: 'object', properties: { ids: {}, workspace_url: {} } } }]);
  assert.deepEqual(Object.keys(tool.inputSchema.properties), ['ids']);
});

test('runRounds: a run that stops before the gate still has its work checked', () => {
  const page = ['content/tools/bom.md is a new file'];
  const stoppedAuthor = runRounds({ ...script({ authors: [{ output: { status: 'needs_human', summary: 'A new area.', responses: [] } }] }), breaches: () => page });
  assert.deepEqual([stoppedAuthor.breach, stoppedAuthor.failures], [true, ['The author stopped: A new area.', ...page]]);
  const errored = runRounds({ ...script({ authors: [{ error: 'claude stopped with error_max_budget_usd' }] }), breaches: () => page });
  assert.equal(errored.breach, true);
  const clean = runRounds(script({ authors: [{ output: { status: 'needs_human', summary: 'Unsure.', responses: [] } }] }));
  assert.equal(clean.breach, undefined);
  const broken = runRounds({ ...script({ authors: [{ error: 'x' }] }), breaches: () => { throw new Error('bad JSON'); } });
  assert.deepEqual([broken.breach, broken.failures.at(-1)], [true, 'The path gate failed: bad JSON']);
  let gateCalls = 0;
  runRounds({ ...script({ authors: [done()], reviews: [pass] }), breaches: () => { gateCalls++; return []; } });
  assert.equal(gateCalls, 1);
});
