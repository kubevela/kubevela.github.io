# Release notes: how to add or update them

This folder is the only place to write KubeVela release notes. It is not published as is. Each time the site starts or builds, `scripts/sync-release-pages.js` copies it into every docs version (`docs/release-notes/` and `versioned_docs/version-*/release-notes/`). Each docs version then shows the notes in its sidebar, under **Releases > Release Notes**. You never add a note to a docs version yourself: a note added here shows up in Next, the latest version and every older version.

This README and the `_template-*.md` files are not copied, so they never appear on the site.

Upgrade guides work the same way. See [`../upgrade-guides/README.md`](../upgrade-guides/README.md).

## Do not edit the copies

Do not edit anything under `docs/release-notes/`, `docs/upgrade-guides/`, `versioned_docs/*/release-notes/` or `versioned_docs/*/upgrade-guides/`. Git ignores those folders, and the next sync overwrites them, so a change made there is lost.

## Add a patch release (vX.Y.Z)

Example: v1.11.3.

1. Copy `_template-patch.md` to `vX.Y/vX.Y.Z.md` (for example `v1.11/v1.11.3.md`) and fill it in. The comment at the top of the template says what each section holds.
2. In `vX.Y/index.md`, add a row at the top of the **Releases** table:
   `| [vX.Y.Z](./vX.Y.Z.md) | YYYY-MM-DD | One-line summary. |`
3. In `../sidebar-release-notes.js`, add `'vX.Y/vX.Y.Z'` as the first item of the `vX.Y.x` category. The list is newest first.
4. In `overview.md`, change the **Latest release** cell of the `vX.Y.x` row to `[vX.Y.Z](./vX.Y/vX.Y.Z.md)`.
5. If this is the newest release line, update the top banner (`announcementBar` in `../docusaurus.config.js`) to link to the new page.
6. If the patch changes the upgrade steps (a CRD, chart or flag change people must act on), update the upgrade guide too. See [`../upgrade-guides/README.md`](../upgrade-guides/README.md).

## Add a minor release (vX.Y.0)

Do this before the docs version for vX.Y is cut. The full release checklist is in `docs/contributor/release-process.md`.

1. Create the folder `vX.Y/`.
2. Copy `_template-minor.md` to `vX.Y/vX.Y.0.md` and fill it in.
3. Write `vX.Y/index.md` by hand, using the previous minor's `index.md` as the model (status, Releases table, Pre-releases table). There is no template for it.
4. In `../sidebar-release-notes.js`, add a `vX.Y.x` category at the top of the list, with `link: {type: 'doc', id: 'vX.Y/index'}` and `items: ['vX.Y/vX.Y.0']`. Copy the shape of the existing categories.
5. In `overview.md`, add a row for `vX.Y.x` at the top of the **Supported versions** table, and update the status of older lines.
6. Add the upgrade guide for vX.Y. See [`../upgrade-guides/README.md`](../upgrade-guides/README.md).

## Add notes for a release line that has no folder

The site has notes from v1.9 onwards. Older lines (v1.8 and earlier) link to their GitHub releases instead. To add notes for an older line, follow **Add a minor release** for that line: create its folder with an `index.md`, add its category to `../sidebar-release-notes.js` in version order, and add its row to `overview.md`.

## Update an existing note

Edit the file in this folder. With `yarn start` running, the change shows in every docs version when you save. If the change affects the summary, update the matching row in `vX.Y/index.md` and, for the latest release, in `overview.md`.

## Links

- To another release note or upgrade guide, use a relative `.md` link. The folders keep the same layout in every copy, so the link stays in the docs version the reader is in. From `vX.Y/vX.Y.Z.md`:
  - another note in the same line: `./vX.Y.(Z-1).md`
  - another line's overview: `../vA.B/index.md`
  - the upgrade guide: `../../upgrade-guides/vX.Y/index.md` (add `#anchor` for a section)
- To a regular docs page, use an absolute URL: `/docs/next/...` until the vX.Y docs version is cut, then `/docs/...`.
- To GitHub (PRs, releases, compare views), use the full `https://github.com/...` URL.

## Check your change

1. Start the site with `yarn start`. If it was already running when you **added a new page** or changed `../sidebar-release-notes.js`, stop and start it again: the page itself loads at once, but its sidebar entry only appears after a restart. Edits to existing pages reload by themselves.
2. Open the page in more than one docs version and check the content and the sidebar entry, for example:
   - `http://localhost:3000/docs/release-notes/vX.Y/vX.Y.Z/` (latest version)
   - `http://localhost:3000/docs/next/release-notes/vX.Y/vX.Y.Z/` (Next)
   - `http://localhost:3000/docs/v1.10/release-notes/vX.Y/vX.Y.Z/` (an older version)
3. Run `make check-link` and `yarn build`. Both must pass.

## Commit

Commit your files in this folder, `../sidebar-release-notes.js`, and any other file you changed (`overview.md`, `../docusaurus.config.js`, the upgrade guide). Also commit `../versioned_sidebars/*.json` if they changed: the sync writes the Releases group into them, so a new page adds a line there. Sign off each commit (`git commit -s`), because the repository checks for a DCO sign-off.
