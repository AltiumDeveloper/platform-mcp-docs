// Markdown helpers shared by the search index (scripts/search-index.mjs) and the LLM surface (scripts/llms.mjs).
import { createRequire } from 'node:module';
import { dirname, join, normalize, relative, sep } from 'node:path';

const require = createRequire(import.meta.url);
const GithubSlugger = require('github-slugger');
const { REPO_ROOT, allPages } = require('../../pages.cjs');

// Images a page shows from elsewhere in the repository (devcenter/images/): the Markdown twins link them under this
// site path, and scripts/llms.mjs copies them there.
export const ASSET_DIR = 'md-assets';
const IMAGE = /\.(?:png|jpe?g|gif|svg|webp)$/i;

// The repository-relative path of an image a page links to (`../../devcenter/images/x.png`), or null.
export function repoImage(target, page) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/') || !IMAGE.test(target.split('#')[0])) return null;
  const full = normalize(join(dirname(page.source), target.split('#')[0]));
  const rel = relative(REPO_ROOT, full);
  return rel.startsWith('..') ? null : rel.split(sep).join('/');
}

const TEXT_LIMIT = 1500;

// Plain text of a Markdown fragment: no markup, links reduced to their text.
export const stripMarkdown = (text) => text
  .replace(/<[^>\n]+>/g, ' ')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/^\s*[-*+>|]\s?/gm, '')
  .replace(/(?:^|\s):?-{3,}:?(?=\s|$)/g, ' ')
  .replace(/[|*`#]+/g, ' ')
  .replace(/(^|\s)_+|_+(?=\s|$)/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

// Heading text as Docusaurus renders it (and slugs it): inline markup and link targets removed.
const headingText = (heading) => heading
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/`([^`]*)`/g, '$1')
  .replace(/\*\*(.+?)\*\*/g, '$1')
  .replace(/\*(.+?)\*/g, '$1')
  // `_` emphasis only at word boundaries: CommonMark leaves intraword underscores (`a365_schematic_script_run`) as text.
  .replace(/(^|[^\p{L}\p{N}_])__(?=\S)(.+?)__(?![\p{L}\p{N}_])/gu, '$1$2')
  .replace(/(^|[^\p{L}\p{N}_])_(?=\S)(.+?)_(?![\p{L}\p{N}_])/gu, '$1$2')
  .replace(/<[^>]+>/g, '')
  .trim();

const FENCE = /^\s*(```|~~~)/;

// The page's `# H1`, or null.
export function pageTitle(source) {
  let fenced = false;
  for (const line of source.split('\n')) {
    if (FENCE.test(line)) fenced = !fenced;
    const match = fenced ? null : /^#\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) return headingText(match[1]);
  }
  return null;
}

// A page split at its `##` / `###` headings. The text before the first heading belongs to the page itself (heading
// null, no anchor). Anchors are github-slugger slugs of the heading text, as Docusaurus generates them; the slugger
// sees every heading level so repeated headings get the same `-1`, `-2` suffixes. Code blocks are left out of the text.
// `keepLines` also returns each section's raw lines (for scripts/search-index.mjs, which reads the tool tables).
export function pageSections(source, { keepLines = false } = {}) {
  const slugger = new GithubSlugger();
  const sections = [{ heading: null, anchor: null, lines: [] }];
  let fenced = false;
  for (const line of source.split('\n')) {
    if (FENCE.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) {
      sections.at(-1).lines.push(line);
      continue;
    }
    const heading = headingText(match[2]);
    const anchor = slugger.slug(heading);
    if (match[1].length === 1) continue;
    if (match[1].length <= 3) sections.push({ heading, anchor, lines: [] });
    else sections.at(-1).lines.push(heading);
  }
  return sections
    .map(({ heading, anchor, lines }) => {
      const text = stripMarkdown(lines.join('\n'));
      return { heading, anchor, text: text.length > TEXT_LIMIT ? `${text.slice(0, TEXT_LIMIT)}…` : text, ...(keepLines && { lines }) };
    })
    .filter((section) => section.heading || section.text);
}

// The Markdown of an MDX page (the home page): its layout wrappers dropped and its card markup turned into Markdown,
// `[<i className="bc-icon …"></i><strong>T</strong> <em>E</em> <span>D</span>](url)` → `[**T**](url) `E`: D`.
export function mdxToMarkdown(source) {
  return source
    .replace(/^<\/?div[^>]*>\n\n?/gm, '')
    .replace(/\[<i [^>]*><\/i><strong>(.*?)<\/strong>\s*(?:<em>(.*?)<\/em>)?\s*(?:<span>(.*?)<\/span>)?\]\(([^)\s]+)\)/g,
      (_, title, extra, text, url) => `- [**${title}**](${url})${extra ? ` \`${extra}\`` : ''}${text ? `: ${text}` : ''}`)
    .replace(/&amp;/g, '&');
}

// The published pages (pages.cjs) with their sources read and titled; MDX pages as Markdown.
export async function readPages() {
  const { readFile } = await import('node:fs/promises');
  return Promise.all(allPages().map(async (page) => {
    const source = await readFile(page.source, 'utf8');
    const text = page.file.endsWith('.mdx') ? mdxToMarkdown(source) : source;
    return { ...page, text, title: pageTitle(text) ?? page.label };
  }));
}

// Rewrites the links of a page's Markdown for a reader outside the site: links to other published pages (relative
// `.md` paths, or site paths like `/tools/`) and in-page anchors become absolute URLs of the pages'
// Markdown twins (`https://…/platform-mcp-docs/setup.md#requirements`). Code is left as it is.
export function absoluteLinks(text, page, pages, siteUrl) {
  const twin = (route) => `${siteUrl}${route === '/' ? '/index' : route.replace(/\/$/, '')}.md`;
  const bySource = new Map(pages.map((p) => [p.source, p]));
  const resolve = (target) => {
    const [path, hash] = target.split('#');
    const fragment = hash ? `#${hash}` : '';
    if (!path) return `${twin(page.route)}${fragment}`;
    // `pathname:///llms.txt`: a file at the site root, not a page.
    if (path.startsWith('pathname://')) return `${siteUrl}${path.slice('pathname://'.length)}${fragment}`;
    if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return null;
    if (path.startsWith('/')) {
      const route = path.endsWith('/') ? path : `${path}/`;
      const match = pages.find((p) => p.route === route);
      return match ? `${twin(match.route)}${fragment}` : null;
    }
    const match = bySource.get(normalize(join(dirname(page.source), path)));
    if (match) return `${twin(match.route)}${fragment}`;
    const image = repoImage(path, page);
    return image ? `${siteUrl}/${ASSET_DIR}/${image}` : null;
  };
  const rewrite = (prose) => prose
    .replace(/\]\(([^)\s]+)\)/g, (all, target) => {
      const url = resolve(target);
      return url ? `](${url})` : all;
    })
    .replace(/href="([^"]+)"/g, (all, target) => {
      const url = resolve(target);
      return url ? `href="${url}"` : all;
    });
  // Fenced blocks and inline code spans pass through unchanged.
  return text
    .split(/(^(?:```|~~~)[^\n]*\n[\s\S]*?^(?:```|~~~)[ \t]*$)/m)
    .map((part, i) => (i % 2 ? part : part.split(/(`+[^`\n]*`+)/).map((bit, j) => (j % 2 ? bit : rewrite(bit))).join('')))
    .join('');
}
