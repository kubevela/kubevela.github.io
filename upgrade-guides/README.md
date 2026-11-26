# Upgrade guides: how to add or update them

This folder is the only place to write KubeVela upgrade guides, one per minor version (`vX.Y/index.md` covers the upgrade from vX.(Y-1) to vX.Y). It is not published as is. Each time the site starts or builds, `scripts/sync-release-pages.js` copies it into every docs version (`docs/upgrade-guides/` and `versioned_docs/version-*/upgrade-guides/`). Each docs version then shows the guides in its sidebar, under **Releases > Upgrade Guides**. You never add a guide to a docs version yourself: a guide added here shows up in every version.

This README is not copied, so it never appears on the site. Do not edit the copies under `docs/` or `versioned_docs/`: git ignores them and the next sync overwrites them.

Release notes work the same way, and share the link rules and checks below. See [`../release-notes/README.md`](../release-notes/README.md).

## Add the guide for a new minor version (vX.Y)

1. Create `vX.Y/index.md`, using the previous version's guide as the model. Give it front matter like:

   ```yaml
   ---
   title: Upgrade from vX.(Y-1) to vX.Y
   sidebar_label: vX.(Y-1) to vX.Y
   ---
   ```

2. Start with a link to the release notes (`../../release-notes/vX.Y/vX.Y.0.md`), then the version-specific steps (CRDs first, then the chart, then anything else).
3. If a topic needs its own page (for example `v1.12/config-migration.md`), put it in the same `vX.Y/` folder and link to it from `index.md`.
4. In `../sidebar-upgrade.js`, add the guide at the top, after `'overview'`. A guide with extra pages is a category whose `link` is the `index` doc. A guide with one page is just `'vX.Y/index'`. Copy the shape of the existing entries.
5. In `overview.mdx`, add a row at the top of the **Upgrade path** table:
   `| vX.(Y-1) to vX.Y | [Upgrade from vX.(Y-1) to vX.Y](./vX.Y/index.md) | [vX.Y.x](../release-notes/vX.Y/index.md) |`

## Update an existing guide

Edit the file in this folder, for example when a patch release changes a step. With `yarn start` running, the change shows in every docs version when you save. If you add a new page to a guide, also add it to `../sidebar-upgrade.js`.

## Links

- To a release note or another guide, use a relative `.md` link, so the reader stays in the docs version they are in. From `vX.Y/index.md`: `../../release-notes/vX.Y/vX.Y.0.md`, `./config-migration.md`, `../vA.B/index.md`.
- To a regular docs page, use an absolute URL: `/docs/next/...` while vX.Y is unreleased, then `/docs/...` once its docs version is cut. `/docs/...` always opens the latest docs version. To show how vX.Y behaved after a newer release, use `/docs/vX.Y/...`. The full rule is in [`../release-notes/README.md`](../release-notes/README.md).

## Check and commit

Follow **Check your change** and **Commit** in [`../release-notes/README.md`](../release-notes/README.md). In short:
- Restart `yarn start` after adding a new page or changing `../sidebar-upgrade.js`. Edits to existing pages reload by themselves.
- Check the guide in more than one docs version.
- Run `make check-link` and `yarn build`.
- Commit the guide, `../sidebar-upgrade.js`, `overview.mdx` and any changed `../versioned_sidebars/*.json`, with `git commit -s`.
