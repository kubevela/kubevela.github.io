/**
 * Post-processes the agent-facing files that docusaurus-plugin-llms writes
 * into the build output. Runs as the `postbuild` lifecycle script, after
 * `docusaurus build` (the plugin writes its files in postBuild, which
 * Docusaurus runs concurrently across plugins, so this cannot safely be
 * another plugin).
 *
 * 1. Prepends a pointer to the llms.txt documentation index to every
 *    generated markdown page, so agents that fetch a single page can
 *    discover the full index.
 * 2. Restructures the indexes into the llmstxt.org nested layout so each
 *    file stays within the ~100K character budget agents can ingest in one
 *    read: the CLI subcommand man-pages move into a nested index at
 *    <version>/cli/llms.txt, per-version indexes move under their real
 *    route (/docs/<version>/llms.txt), and the root index links to all of
 *    them. Overly long entry descriptions are shortened.
 */
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const SITE_URL = 'https://kubevela.io';
const DIRECTIVE =
  '> For the complete KubeVela documentation index, see [llms.txt](https://kubevela.io/llms.txt).\n\n';
// CLI subcommand man-pages (vela_*.md); the main `cli/vela.md` page stays.
const CLI_SUBCOMMAND = /\]\([^)]*\/cli\/vela_[^)]*\)/;
const MAX_DESCRIPTION = 160;
// llms-txt-size fails at >= 100K characters (afdocs AGENT_TRUNCATION_LIMIT).
const INDEX_SIZE_LIMIT = 100000;

function walkMarkdown(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdown(full, files);
    } else if (entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function trimDescription(line) {
  const match = line.match(/^(- \[[^\]]*\]\([^)]*\)): (.*)$/);
  if (!match || match[2].length <= MAX_DESCRIPTION) {
    return line;
  }
  const cut = match[2].slice(0, MAX_DESCRIPTION).replace(/\s+\S*$/, '');
  return `${match[1]}: ${cut}...`;
}

/**
 * Split the CLI man-page entries out of an index into a nested index file,
 * trim long descriptions, and append the extra sections provided. Writes the
 * resulting index to destFile and returns its size.
 */
function restructureIndex({ srcFile, destFile, label, routePrefix, extraSections }) {
  const lines = fs.readFileSync(srcFile, 'utf8').split('\n');
  const cliLines = [];
  const kept = [];
  for (const line of lines) {
    if (CLI_SUBCOMMAND.test(line)) {
      cliLines.push(trimDescription(line));
    } else {
      kept.push(trimDescription(line));
    }
  }

  const sections = [...extraSections];
  if (cliLines.length > 0) {
    // The CLI pages live under the version's route (/docs[/<version>]/cli/),
    // which for the root index is not the directory llms.txt sits in.
    const cliIndexFile = path.join(BUILD_DIR, ...routePrefix.split('/').filter(Boolean), 'cli', 'llms.txt');
    const cliIndex = [
      `# KubeVela CLI reference (${label})`,
      '',
      `> Manual pages for every subcommand of the vela command-line tool (${label} documentation).`,
      '',
      '## Commands',
      '',
      ...cliLines,
      '',
    ].join('\n');
    fs.mkdirSync(path.dirname(cliIndexFile), { recursive: true });
    fs.writeFileSync(cliIndexFile, cliIndex);
    sections.unshift({
      heading: '## CLI command reference',
      lines: [
        `- [vela CLI command index](${SITE_URL}${routePrefix}/cli/llms.txt): Nested index of the ${cliLines.length} vela subcommand manual pages.`,
      ],
    });
  }

  let content = kept.join('\n').replace(/\n+$/, '\n');
  for (const section of sections) {
    content += `\n${section.heading}\n\n${section.lines.join('\n')}\n`;
  }

  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, content);
  if (srcFile !== destFile) {
    fs.unlinkSync(srcFile);
  }
  return { size: content.length, cliCount: cliLines.length };
}

if (!fs.existsSync(BUILD_DIR)) {
  console.error(`llms-postprocess: build directory not found at ${BUILD_DIR}`);
  process.exit(1);
}

// Discover the non-root versions the plugin generated (top-level <version>/
// output directories holding an llms.txt, e.g. next/, v1.10/). Their real
// routes live under /docs/<version>/.
const versions = fs
  .readdirSync(BUILD_DIR, { withFileTypes: true })
  .filter(
    (e) =>
      e.isDirectory() &&
      /^(next|v\d+\.\d+)$/.test(e.name) &&
      fs.existsSync(path.join(BUILD_DIR, e.name, 'llms.txt'))
  )
  .map((e) => e.name)
  .sort((a, b) => {
    if (a === 'next') return -1;
    if (b === 'next') return 1;
    const [aMaj, aMin] = a.slice(1).split('.').map(Number);
    const [bMaj, bMin] = b.slice(1).split('.').map(Number);
    return bMaj - aMaj || bMin - aMin;
  });

let failed = false;
const report = (name, result) => {
  console.log(
    `llms-postprocess: ${name} — ${result.size} chars, ${result.cliCount} CLI entries nested`
  );
  if (result.size >= INDEX_SIZE_LIMIT) {
    console.error(
      `llms-postprocess: ${name} is over the ${INDEX_SIZE_LIMIT} character agent ingestion budget`
    );
    failed = true;
  }
};

// Per-version indexes: move under /docs/<version>/ and nest their CLI pages.
for (const version of versions) {
  const label = version === 'next' ? 'next, unreleased' : version;
  report(
    `docs/${version}/llms.txt`,
    restructureIndex({
      srcFile: path.join(BUILD_DIR, version, 'llms.txt'),
      destFile: path.join(BUILD_DIR, 'docs', version, 'llms.txt'),
      label,
      routePrefix: `/docs/${version}`,
      extraSections: [],
    })
  );
  const full = path.join(BUILD_DIR, version, 'llms-full.txt');
  if (fs.existsSync(full)) {
    fs.renameSync(full, path.join(BUILD_DIR, 'docs', version, 'llms-full.txt'));
  }
}

// Intermediate index listing the per-version indexes, one level below the
// root so the hierarchy mirrors how the docs are organized: the root index
// covers the latest release, and other versions hang off their own indexes.
const versionsIndexFile = path.join(BUILD_DIR, 'docs', 'versions', 'llms.txt');
fs.mkdirSync(path.dirname(versionsIndexFile), { recursive: true });
fs.writeFileSync(
  versionsIndexFile,
  [
    '# KubeVela documentation versions',
    '',
    `> Indexes of the KubeVela documentation for the in-development (next) and previously released versions. The latest release is indexed at ${SITE_URL}/llms.txt.`,
    '',
    '## Versions',
    '',
    ...versions.map((version) => {
      const label = version === 'next' ? 'Next (unreleased)' : version;
      return `- [${label} documentation index](${SITE_URL}/docs/${version}/llms.txt): Nested index of the ${label} docs.`;
    }),
    '',
  ].join('\n')
);

// Root index (latest released docs): nest its CLI pages and link the
// versions index so agents can find every other version from the root.
report(
  'llms.txt',
  restructureIndex({
    srcFile: path.join(BUILD_DIR, 'llms.txt'),
    destFile: path.join(BUILD_DIR, 'llms.txt'),
    label: 'latest release',
    routePrefix: '/docs',
    extraSections: [
      {
        heading: '## Other documentation versions',
        lines: [
          `- [Documentation versions index](${SITE_URL}/docs/versions/llms.txt): Nested index of all other documentation versions (next and released).`,
        ],
      },
    ],
  })
);

// Pointer to the root index on every generated markdown page.
let markdownUpdated = 0;
for (const file of walkMarkdown(BUILD_DIR)) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.startsWith(DIRECTIVE)) {
    fs.writeFileSync(file, DIRECTIVE + content);
    markdownUpdated++;
  }
}
console.log(`llms-postprocess: added llms.txt pointer to ${markdownUpdated} markdown file(s)`);

if (failed) {
  process.exit(1);
}
