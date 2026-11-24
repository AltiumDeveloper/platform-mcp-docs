#!/usr/bin/env node
// Runs after `docusaurus build`: checks the Developer Center pages (devcenter/*.md, see devcenter/README.md). They are
// published on another site, so they link here by absolute URL, and a page moved or a heading renamed here would break
// them silently. Fails on:
//   - a link to this site that does not resolve to a built page (in its trailing-slash form) and, for a #fragment, to
//     an id on that page;
//   - a relative link other than to an existing file in devcenter/images/;
//   - front matter, HTML or JSX, or a missing `# H1` (the pages are pasted into the portal as they are).
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractLinks, stripCode } from './llms-check.mjs';
import { siteUrlFromConfig } from './llms.mjs';
import { htmlIds, pageTarget } from './search-check.mjs';

const DEVCENTER_DIR = fileURLToPath(new URL('../../devcenter/', import.meta.url));
const IMAGES_DIR = join(DEVCENTER_DIR, 'images');
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const HTML_TAG = /<\/?[A-Za-z][A-Za-z0-9-]*(?=[\s/>])/;

// The pages to publish: every Markdown file in devcenter/ except its README.
export function devcenterPages(dir = DEVCENTER_DIR) {
  return readdirSync(dir).filter((name) => name.endsWith('.md') && name !== 'README.md').sort().map((name) => join(dir, name));
}

// Problems with a page's own content (not its links).
export function contentProblems(text) {
  const problems = [];
  if (/^---\s*\n/.test(text)) problems.push('front matter');
  if (!/^# \S/m.test(stripCode(text))) problems.push('no `# H1` title');
  const prose = stripCode(text).replace(/<(?:https?|mailto):[^>\s]+>/g, '');
  const tag = HTML_TAG.exec(prose);
  if (tag) problems.push(`HTML or JSX ${tag[0]}`);
  return problems;
}

// Problem with one link of a page, or null. `readPage(file)` returns a built page's HTML or null.
export function linkProblem(url, { siteUrl, pageDir, readPage }) {
  if (!SCHEME.test(url)) {
    if (url.startsWith('#')) return null;
    const target = normalize(resolve(pageDir, url.split('#')[0]));
    if (!target.startsWith(IMAGES_DIR + sep)) return `relative link ${url}: link the reference site by absolute URL; only images/ may be relative`;
    return existsSync(target) ? null : `missing image ${url}`;
  }
  const base = siteUrl.replace(/\/+$/, '');
  if (url !== base && !url.startsWith(`${base}/`)) return null;
  const path = url.slice(base.length) || '/';
  const [route] = path.split('#');
  if (!route.endsWith('/')) return `${url}: use the trailing-slash URL (${route}/)`;
  const { file, anchor } = pageTarget(path);
  const html = readPage(file);
  if (html === null) return `${url}: no page build/${file}`;
  if (anchor !== null && !htmlIds(html).has(anchor)) return `${url}: no heading #${anchor} on that page`;
  return null;
}

export function runDevcenterCheck({ buildDir = 'build', siteUrl = siteUrlFromConfig(), dir = DEVCENTER_DIR } = {}) {
  if (!existsSync(buildDir)) throw new Error(`devcenter:check: ${buildDir} not found; run docusaurus build first`);
  const readPage = (file) => {
    const path = join(buildDir, file);
    return existsSync(path) ? readFileSync(path, 'utf8') : null;
  };
  const problems = [];
  const pages = devcenterPages(dir);
  let links = 0;
  for (const source of pages) {
    const name = relative(join(dir, '..'), source).split(sep).join('/');
    const text = readFileSync(source, 'utf8');
    for (const message of contentProblems(text)) problems.push({ file: name, message });
    for (const url of new Set(extractLinks(text))) {
      links += 1;
      const problem = linkProblem(url, { siteUrl, pageDir: dir, readPage });
      if (problem) problems.push({ file: name, message: problem });
    }
  }
  return { pages: pages.length, links, problems };
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  const { pages, links, problems } = runDevcenterCheck();
  for (const { file, message } of problems) console.error(`devcenter:check: ${file}: ${message}`);
  console.log(`devcenter:check: ${pages} pages, ${links} distinct links checked, ${problems.length} problem(s)`);
  if (problems.length) process.exit(1);
}
