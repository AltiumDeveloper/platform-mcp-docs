#!/usr/bin/env node
// Runs after `docusaurus build`: writes the site's Markdown surface for AI assistants into build/ (https://llmstxt.org).
//   <route>.md     a Markdown twin of every page (/setup/ → /setup.md, the home page → /index.md),
//                  from its source with links made absolute; the theme links each page to its twin
//   llms.txt       the index: every page, by section, with its description (pages.cjs)
//   llms-full.txt  every twin, concatenated in site order
//   md-assets/     the images the twins show from elsewhere in the repository (devcenter/images/)
import { copyFileSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_DIR, absoluteLinks, readPages, repoImage } from './lib/markdown.mjs';

const require = createRequire(import.meta.url);
const { DEVELOPER_CENTER, REPO_ROOT, SECTIONS } = require('../pages.cjs');

export function siteUrlFromConfig() {
  const { url, baseUrl } = require('../docusaurus.config.js');
  return `${url}${baseUrl}`.replace(/\/+$/, '');
}

const twinPath = (route) => (route === '/' ? 'index.md' : `${route.replace(/^\/|\/$/g, '')}.md`);

export function renderIndex(pages, siteUrl) {
  const { title, tagline } = require('../docusaurus.config.js');
  const lines = [
    `# ${title}`,
    '',
    `> ${tagline}. The Altium 365 MCP Server runs in Altium's cloud at https://mcp.altium.com and gives an AI client tools to list the projects in an Altium 365 workspace, read the compiled schematic of any revision, render and highlight sheets, compare revisions and variants, read project history, and manage Altium 365 comments.`,
    '',
    `The introduction and the quick start are on Altium Developer Center (${DEVELOPER_CENTER.docs}). The tool reference lists every tool by name; the guides explain how to get good answers.`,
  ];
  for (const section of SECTIONS) {
    lines.push('', `## ${section.label}`, '');
    for (const page of pages.filter((p) => p.section === section.id)) {
      lines.push(`- [${page.title}](${siteUrl}/${twinPath(page.route)}): ${page.description}`);
    }
  }
  lines.push('', '## Optional', '', `- [Everything on one page](${siteUrl}/llms-full.txt): all pages above, concatenated`);
  return `${lines.join('\n')}\n`;
}

export async function runLlms({ buildDir = 'build', siteUrl = siteUrlFromConfig() } = {}) {
  const pages = await readPages();
  const twins = pages.map((page) => ({ page, markdown: `${absoluteLinks(page.text, page, pages, siteUrl).trimEnd()}\n` }));
  for (const { page, markdown } of twins) {
    const out = join(buildDir, twinPath(page.route));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, markdown);
  }
  // The images the twins link (absoluteLinks → /md-assets/<repository path>), copied next to them.
  for (const page of pages) {
    for (const [, target] of page.text.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const image = repoImage(target, page);
      if (!image) continue;
      const out = join(buildDir, ASSET_DIR, image);
      mkdirSync(dirname(out), { recursive: true });
      copyFileSync(join(REPO_ROOT, image), out);
    }
  }
  writeFileSync(join(buildDir, 'llms.txt'), renderIndex(pages, siteUrl));
  const full = twins.map(({ page, markdown }) => `<!-- ${siteUrl}${page.route} -->\n\n${markdown}`).join('\n---\n\n');
  writeFileSync(join(buildDir, 'llms-full.txt'), full);
  return { pages: twins.length };
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  const { pages } = await runLlms();
  console.log(`llms: ${pages} Markdown pages, llms.txt, llms-full.txt`);
}
