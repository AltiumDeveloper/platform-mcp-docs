// Decisions of the tool sync loop (scripts/tool-sync.mjs), kept apart from its process calls so they can be tested.
// The author is the update-tool-docs skill, the reviewer review-tool-docs; both reply through these schemas.

const ROUNDS = 3;

// What the author may change, relative to the repository root. The snapshot is the workflow's, not the author's.
const AUTHOR_PATHS = [/^content\/tools\/[^/]+\.md$/, /^content\/changelog\.md$/, /^tools\/not-in-snapshot\.json$/];
export const AUTHOR_TOOLS = ['Read', 'Glob', 'Grep', 'Skill', 'Edit(content/tools/**)', 'Edit(content/changelog.md)', 'Edit(tools/not-in-snapshot.json)'];
export const REVIEW_TOOLS = ['Read', 'Glob', 'Grep', 'Skill'];
// Neither agent needs the process environment, which holds the API key.
export const DENIED_TOOLS = ['Read(//proc/**)'];

export const AUTHOR_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'needs_human'] },
    summary: { type: 'string' },
    responses: {
      type: 'array',
      items: {
        type: 'object',
        properties: { failure: { type: 'string' }, action: { type: 'string', enum: ['fixed', 'disputed'] }, reason: { type: 'string' } },
        required: ['failure', 'action', 'reason'],
      },
    },
  },
  required: ['status', 'summary', 'responses'],
};

export const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['pass', 'fail'] },
    blocking: {
      type: 'array',
      items: {
        type: 'object',
        properties: { file: { type: 'string' }, line: { type: 'integer' }, rule: { type: 'string' }, issue: { type: 'string' } },
        required: ['file', 'rule', 'issue'],
      },
    },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'blocking', 'notes'],
};

// Why the author's change cannot be accepted at all: a file outside its paths, a new file (a new page needs a person),
// or an entry added to the exemptions.
export function pathBreaches({ changed, added }, exemptBefore, exemptAfter) {
  const breaches = changed.filter((file) => !AUTHOR_PATHS.some((path) => path.test(file))).map((file) => `${file} is outside the tool pages`);
  breaches.push(...added.map((file) => `${file} is a new file`));
  const before = new Set(exemptBefore.map((entry) => entry.name));
  for (const { name } of exemptAfter) if (!before.has(name)) breaches.push(`tools/not-in-snapshot.json gained ${name}`);
  return breaches;
}

export const formatFinding = ({ file, line, rule, issue }) => `${file}${line ? `:${line}` : ''} (${rule}): ${issue}`;

// The claude arguments for one run: the author keeps one session across rounds, the reviewer starts fresh each time.
export function claudeArgs({ prompt, model, tools, denied, schema, budget, session, resume = false }) {
  return [
    '-p', prompt, '--model', model, '--permission-mode', 'dontAsk', '--allowedTools', ...tools, '--disallowedTools', ...denied,
    '--output-format', 'json', '--json-schema', JSON.stringify(schema), '--max-budget-usd', budget,
    ...(session ? [resume ? '--resume' : '--session-id', session] : []),
  ];
}

// The end of a check's output, from a line start where one falls inside it.
export function tail(text, size) {
  const cut = text.slice(-size);
  const start = cut.length < text.length ? cut.indexOf('\n') + 1 : 0;
  return (start > 0 && start < cut.length ? cut.slice(start) : cut).trim();
}

// A headless claude run's outcome: its structured output, or an error saying why there is none.
export function parseClaudeReply({ status, stdout, stderr, error }) {
  if (error?.code === 'ETIMEDOUT') return { error: 'claude ran past its time limit' };
  if (error) return { error: `claude could not start: ${error.message}` };
  let reply;
  try {
    reply = JSON.parse(stdout);
  } catch {
    return { error: `claude exited ${status} without a result: ${(stderr || stdout).trim().slice(-500)}` };
  }
  if (!reply || reply.is_error || !reply.structured_output) return { error: `claude stopped with ${reply?.subtype ?? 'an error'}` };
  return { output: reply.structured_output };
}

// Up to ROUNDS rounds of author, path gate, checks and review. `steps` performs each; this decides what happens next.
export function runRounds(steps) {
  const result = { status: 'needs_human', rounds: 0, summary: '', failures: [], disputes: [], notes: [] };
  let prompt = steps.firstPrompt;
  let outstanding = [];
  for (let round = 1; round <= ROUNDS; round++) {
    result.rounds = round;
    try {
      const before = steps.workState();
      const author = steps.author(prompt, round);
      if (author.error) {
        result.failures = [author.error, ...outstanding];
        break;
      }
      const { status, summary = '', responses = [] } = author.output;
      const disputed = responses.filter((response) => response.action === 'disputed');
      // The first round's summary describes the change; later rounds describe their fixes.
      result.summary = round === 1 ? summary : `${result.summary}\n\nRound ${round}: ${summary}`;
      result.disputes.push(...disputed);
      if (status === 'needs_human') {
        result.failures = [`The author stopped: ${summary}`, ...outstanding];
        break;
      }
      if (round > 1 && steps.workState() === before) {
        const allDisputed = responses.length > 0 && disputed.length === responses.length;
        result.failures = [...outstanding, allDisputed ? 'The author disputed these without changing anything.' : 'The author changed nothing in response to these.'];
        break;
      }
      const breaches = steps.breaches();
      if (breaches.length) {
        result.failures = [...breaches, ...outstanding];
        result.breach = true;
        break;
      }
      const checks = steps.checks();
      if (checks.length) {
        outstanding = checks;
        result.failures = checks;
        result.notes = [];
        prompt = feedbackPrompt(round + 1, 'checks', checks);
        continue;
      }
      const review = steps.review();
      if (review.error) {
        result.failures = [review.error, ...outstanding];
        break;
      }
      result.notes = review.output.notes ?? [];
      const blocking = (review.output.blocking ?? []).map(formatFinding);
      if (review.output.verdict === 'pass' && !blocking.length) {
        result.status = 'done';
        result.failures = [];
        break;
      }
      outstanding = blocking.length ? blocking : ['The reviewer failed the change without naming a blocking problem.'];
      result.failures = outstanding;
      prompt = feedbackPrompt(round + 1, 'review', outstanding);
    } catch (error) {
      result.failures = [`The run failed: ${error.message}`, ...outstanding];
      break;
    }
  }
  return result;
}

// The author's prompt for rounds after the first: the failures to fix or dispute.
export function feedbackPrompt(round, source, failures) {
  return [
    `Round ${round} of ${ROUNDS}. ${source === 'checks' ? 'These checks failed' : 'The reviewer found these blocking problems'}.`,
    'Fix or dispute each one, as Responding to failures in update-tool-docs says.',
    '',
    ...failures.map((failure) => `- ${failure}`),
  ].join('\n');
}

// The pull request body for a run's result; `runUrl` is the workflow run, whose summary holds the tool diff.
export function prBody(result, runUrl) {
  const list = (items) => items.map((item) => (item.includes('\n') ? `- \`\`\`\`\n${item.replace(/^/gm, '  ')}\n  \`\`\`\`` : `- ${item}`)).join('\n');
  const out = [
    result.status === 'done'
      ? `The tool reference was updated from production's tools and passed the checks and review in round ${result.rounds}.`
      : `This run stopped for a person to finish, after ${result.rounds} of ${ROUNDS} rounds.`,
    '',
  ];
  if (result.summary) out.push('## What changed', '', result.summary, '');
  if (result.failures.length) out.push('## Outstanding', '', list(result.failures), '');
  if (result.disputes.length) out.push('## Disputed findings', '', list(result.disputes.map((d) => `${d.failure}: ${d.reason}`)), '');
  if (result.notes.length) out.push('## Review notes', '', list(result.notes), '');
  out.push(runUrl ? `The tool diff this run worked from is in the [workflow run summary](${runUrl}).` : 'The tool diff this run worked from is in the workflow run summary.');
  return `${out.join('\n')}\n`;
}
