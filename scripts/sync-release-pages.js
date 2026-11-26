#!/usr/bin/env node
// Copy the Release Notes and Upgrade Guides pages into every docs version.
//
// Source of truth (edit these): release-notes/** and upgrade-guides/** at the
// repository root. Each folder is copied to the same path in every docs root:
// docs/ (Next) and versioned_docs/version-<v>/ for each entry in versions.json.
// The copies are git-ignored. Files and folders whose name starts with "_"
// (templates) and README.md (the contributor guide) are not copied.
//
// Links between these pages are relative .md links, and the folders keep the
// same layout in every copy, so a link resolves inside the docs version being
// read. Each copy gets last_update (from the source file's git history, since
// the copies are not tracked) and custom_edit_url (the source file on GitHub)
// front matter.
//
// The script also writes the Releases sidebar group into each
// versioned_sidebars/version-<v>-sidebars.json (docs/ uses sidebars.js).
//
// docusaurus.config.js runs the sync each time Docusaurus loads (start, build,
// deploy and the rest), and its release-pages-sync plugin runs it again when a
// source file changes during `docusaurus start`. `make check-link` runs it
// before checking links.
//
// Usage: node scripts/sync-release-pages.js

const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EDIT_URL_BASE = 'https://github.com/kubevela/kubevela.io/edit/main';
const SIDEBARS_RELEASES = path.join(ROOT, 'sidebars-releases.js');

// Load sidebars-releases.js and the section sidebar files fresh, so edits made
// during `docusaurus start` are picked up.
function loadReleases() {
  const {SECTIONS} = require(SIDEBARS_RELEASES);
  for (const file of [SIDEBARS_RELEASES, ...SECTIONS.map((s) => path.join(ROOT, s.sidebarFile))]) {
    delete require.cache[require.resolve(file)];
  }
  return require(SIDEBARS_RELEASES);
}

function docsRoots() {
  const versions = JSON.parse(fs.readFileSync(path.join(ROOT, 'versions.json'), 'utf8'));
  return [
    {root: path.join(ROOT, 'docs'), sidebar: null},
    ...versions.map((v) => ({
      root: path.join(ROOT, 'versioned_docs', `version-${v}`),
      sidebar: path.join(ROOT, 'versioned_sidebars', `version-${v}-sidebars.json`),
    })),
  ];
}

// Source files that are never published: templates and folders whose name
// starts with "_", and the contributor guide README.md in each folder.
const isUnpublished = (name) => name.startsWith('_') || name === 'README.md';

// All markdown files under dir, as paths relative to dir. With
// sourcesOnly, unpublished files are left out.
function listFiles(dir, {sourcesOnly = true} = {}) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    if (sourcesOnly && isUnpublished(entry.name)) {
      return [];
    }
    if (entry.isDirectory()) {
      return listFiles(path.join(dir, entry.name), {sourcesOnly}).map((f) => path.join(entry.name, f));
    }
    return /\.mdx?$/.test(entry.name) ? [entry.name] : [];
  });
}

// Last commit date and author of every file under the given folders, from one
// git call. Returns a Map of repo-relative path to {date, author}.
function lastUpdates(dirs) {
  const updates = new Map();
  let out = '';
  try {
    out = execFileSync('git', ['log', '--format=%x00%cs%x09%an', '--name-only', '--', ...dirs], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return updates; // Not a git checkout: the copies get no last_update.
  }
  for (const commit of out.split('\0').slice(1)) {
    const [header, ...files] = commit.split('\n');
    const [date, author] = header.split('\t');
    for (const file of files.filter(Boolean)) {
      if (!updates.has(file)) {
        updates.set(file, {date, author});
      }
    }
  }
  return updates;
}

function addFrontMatter(content, lines) {
  const block = lines.join('\n') + '\n';
  return content.startsWith('---\n') ? `---\n${block}${content.slice(4)}` : `---\n${block}---\n\n${content}`;
}

// The copy of each source page, keyed by its path relative to a docs root.
function loadPages(sections) {
  const updates = lastUpdates(sections.map((s) => s.dir));
  const pages = new Map();
  for (const {dir} of sections) {
    for (const relative of listFiles(path.join(ROOT, dir))) {
      const source = path.posix.join(dir, relative.split(path.sep).join('/'));
      const lines = [`custom_edit_url: ${EDIT_URL_BASE}/${source}`];
      const update = updates.get(source);
      if (update) {
        lines.push('last_update:', `  date: ${update.date}`, `  author: ${JSON.stringify(update.author)}`);
      }
      pages.set(path.join(dir, relative), addFrontMatter(fs.readFileSync(path.join(ROOT, source), 'utf8'), lines));
    }
  }
  return pages;
}

function writeIfChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) {
    return;
  }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, content);
}

// Make each section folder in root match pages: write changed copies and
// delete copies whose source is gone. Unchanged files are not touched, so the
// dev server only reloads what changed.
function syncPages(root, sections, pages) {
  for (const {dir} of sections) {
    for (const relative of listFiles(path.join(root, dir), {sourcesOnly: false})) {
      if (!pages.has(path.join(dir, relative))) {
        fs.rmSync(path.join(root, dir, relative));
      }
    }
  }
  for (const [relative, content] of pages) {
    writeIfChanged(path.join(root, relative), content);
  }
}

function syncSidebar(sidebarFile, withReleases) {
  const sidebars = JSON.parse(fs.readFileSync(sidebarFile, 'utf8'));
  sidebars.docs = withReleases(sidebars.docs);
  writeIfChanged(sidebarFile, JSON.stringify(sidebars, null, 2) + '\n');
}

function syncReleasePages() {
  const {SECTIONS, withReleases} = loadReleases();
  const pages = loadPages(SECTIONS);
  for (const {root, sidebar} of docsRoots()) {
    syncPages(root, SECTIONS, pages);
    if (sidebar) {
      syncSidebar(sidebar, withReleases);
    }
  }
}

// Watches the sources during `docusaurus start` and copies them again on a
// change. The docs plugin then sees the new copies and reloads them. The
// first loadContent call is skipped: docusaurus.config.js has just synced.
function releasePagesPlugin() {
  let skipNextLoad = true;
  return {
    name: 'release-pages-sync',
    getPathsToWatch() {
      const {SECTIONS} = require(SIDEBARS_RELEASES);
      return [
        ...SECTIONS.map(({dir}) => path.join(ROOT, dir, '**/*.{md,mdx}')),
        ...SECTIONS.map(({sidebarFile}) => path.join(ROOT, sidebarFile)),
        SIDEBARS_RELEASES,
      ];
    },
    async loadContent() {
      if (skipNextLoad) {
        skipNextLoad = false;
        return;
      }
      syncReleasePages();
    },
  };
}

module.exports = {syncReleasePages, releasePagesPlugin};

if (require.main === module) {
  syncReleasePages();
  console.log('release pages synced into docs/ and versioned_docs/');
}
