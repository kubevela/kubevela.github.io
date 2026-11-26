// Release Notes and Upgrade Guides: the one list of these sections.
//
// The pages are written once, in release-notes/ and upgrade-guides/ at the
// repository root. scripts/sync-release-pages.js copies each folder to the
// same path in every docs version (docs/ and each versioned_docs/version-*/),
// so each version shows them in its own sidebar, under a Releases group.
// sidebars.js uses withReleases() directly, and the sync script writes the same
// group into each versioned_sidebars/*.json file. The sync script, the
// redirects in docusaurus.config.js and scripts/llms-postprocess.js all read
// SECTIONS from here.
//
// The order of the pages comes from each section's sidebar file. Doc ids there
// are relative to the section folder.

const SECTIONS = [
  {dir: 'release-notes', label: 'Release Notes', sidebarFile: 'sidebar-release-notes.js', sidebarKey: 'releaseNotes'},
  {dir: 'upgrade-guides', label: 'Upgrade Guides', sidebarFile: 'sidebar-upgrade.js', sidebarKey: 'upgrade'},
];

const RELEASES_LABEL = 'Releases';
// The Releases group goes right after this top-level sidebar item.
const PLACE_AFTER = 'Developer Guide';

function prefixItem(item, dir) {
  if (typeof item === 'string') {
    return `${dir}/${item}`;
  }
  const out = {...item};
  if (out.id) {
    out.id = `${dir}/${out.id}`;
  }
  if (out.link && out.link.type === 'doc') {
    out.link = {...out.link, id: `${dir}/${out.link.id}`};
  }
  if (out.items) {
    out.items = out.items.map((child) => prefixItem(child, dir));
  }
  return out;
}

function releaseCategory({dir, label, sidebarFile, sidebarKey}) {
  const items = require(`./${sidebarFile}`)[sidebarKey];
  return {
    type: 'category',
    label,
    collapsed: true,
    link: {type: 'doc', id: `${dir}/overview`},
    items: items.filter((item) => item !== 'overview').map((item) => prefixItem(item, dir)),
  };
}

// Return the top-level sidebar items with the Releases group after
// PLACE_AFTER, replacing a Releases group already there.
function withReleases(items) {
  const releases = {
    type: 'category',
    label: RELEASES_LABEL,
    collapsed: true,
    items: SECTIONS.map(releaseCategory),
  };
  const rest = items.filter((item) => !(item && item.label === RELEASES_LABEL));
  const anchor = rest.findIndex((item) => item && item.label === PLACE_AFTER);
  if (anchor === -1) {
    throw new Error(`sidebar has no top-level "${PLACE_AFTER}" item to put Releases after`);
  }
  return [...rest.slice(0, anchor + 1), releases, ...rest.slice(anchor + 1)];
}

module.exports = {SECTIONS, withReleases};
