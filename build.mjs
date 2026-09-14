// Precompile SHIFT for deployment: transform the JSX ahead of time and inline
// React, so the page needs no CDN, no in-browser Babel (2.98 MB) and no
// transpile on every load. The authored source stays JSX — this only rewrites
// a copy.
//
//   node build.mjs                      -> build/implied-shift.html (safe default)
//   node build.mjs implied-shift.html   -> overwrite in place (CI, ephemeral checkout)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { transformSync } from '@babel/core';
import presetReact from '@babel/preset-react';

const SRC = 'implied-shift.html';
const OUT = process.argv[2] || 'build/implied-shift.html';
const SW = 'sw.js';

const html = readFileSync(SRC, 'utf8');

// 1 · compile the single JSX block
const open = '<script type="text/babel" data-presets="react">';
const start = html.indexOf(open);
if (start < 0) throw new Error(`${SRC}: no <script type="text/babel"> block found`);
const bodyStart = start + open.length;
const bodyEnd = html.indexOf('</script>', bodyStart);
if (bodyEnd < 0) throw new Error(`${SRC}: unterminated babel script block`);
const jsx = html.slice(bodyStart, bodyEnd);

const { code } = transformSync(jsx, {
  presets: [[presetReact, { runtime: 'classic' }]],
  configFile: false,
  babelrc: false,
  compact: false,
  sourceMaps: false,
});
if (!code) throw new Error('babel produced no output');
if (/<[A-Za-z][^>]*\/?>/.test(code.split('\n').slice(0, 5).join('\n'))) {
  throw new Error('compiled output still looks like JSX');
}

// 2 · inline the React runtimes in place of the CDN tags and their fallbacks
const react = readFileSync(resolve('node_modules/react/umd/react.production.min.js'), 'utf8');
const reactDom = readFileSync(resolve('node_modules/react-dom/umd/react-dom.production.min.js'), 'utf8');

const cdnBlockStart = html.indexOf('<script crossorigin src="https://unpkg.com/react@');
const lastFallback = html.lastIndexOf('jsdelivr.net');
const cdnBlockEnd = lastFallback < 0 ? -1 : html.indexOf('\n', lastFallback);
if (cdnBlockStart < 0 || cdnBlockEnd < 0 || cdnBlockEnd <= cdnBlockStart)
  throw new Error(`${SRC}: could not locate the CDN script block (start=${cdnBlockStart}, end=${cdnBlockEnd})`);

const inlined =
  `<script>${react}</script>\n<script>${reactDom}</script>`;

let out = html.slice(0, cdnBlockStart) + inlined + html.slice(cdnBlockEnd);

// 3 · swap the JSX block for the compiled code (indices shifted, so re-find)
const s2 = out.indexOf(open);
const e2 = out.indexOf('</script>', s2 + open.length);
out = out.slice(0, s2) + '<script>\n' + code + '\n' + out.slice(e2);

// 4 · the boot-failure notice no longer has a CDN to blame
out = out.replace(
  'Could not load React/Babel from the CDN — check your connection and reload.',
  'SHIFT failed to start — please reload.'
);

// 5 · stamp the service worker so each deploy supersedes the last cache.
// Written beside the output, never over the template, and matched by pattern so
// re-running the build always re-stamps rather than silently keeping the first.
const stamp = createHash('sha256').update(out).digest('hex').slice(0, 12);
const swOut = readFileSync(SW, 'utf8')
  .replace(/const CACHE = 'shift-[^']*';/, `const CACHE = 'shift-${stamp}';`);
if (!swOut.includes(`shift-${stamp}`)) throw new Error('service worker cache name was not stamped');

if (out.includes('text/babel')) throw new Error('a text/babel block survived the build');
for (const host of ['unpkg.com', 'cdn.jsdelivr.net']) {
  if (out.includes(host)) throw new Error(`${host} still referenced after the build`);
}

const dir = dirname(resolve(OUT));
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
writeFileSync(OUT, out);
writeFileSync(resolve(dir, 'sw.js'), swOut);

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`build ok  ${OUT}`);
console.log(`  source ${kb(html.length)} + ~2.98 MB of CDN Babel  ->  self-contained ${kb(out.length)}`);
console.log(`  sw cache stamp: shift-${stamp} -> ${resolve(dir, 'sw.js')}`);
