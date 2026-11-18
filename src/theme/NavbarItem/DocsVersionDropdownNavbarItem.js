import React from 'react';
import {useLocation} from '@docusaurus/router';
import {translate} from '@docusaurus/Translate';
import {
  useVersions,
  useDocsVersionCandidates,
  useDocsPreferredVersion,
} from '@docusaurus/plugin-content-docs/client';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import OriginalDocsVersionDropdownNavbarItem from '@theme-original/NavbarItem/DocsVersionDropdownNavbarItem';

// Pages served by the unversioned release-notes and upgrade docs plugins.
// They are the same for every docs version, so switching versions there
// only records the preferred version instead of leaving the page.
const UNVERSIONED_PATH_PREFIXES = ['/release-notes/', '/upgrade-guides/'];

function UnversionedPageVersionDropdown({
  mobile,
  docsPluginId,
  dropdownItemsBefore = [],
  dropdownItemsAfter = [],
  dropdownActiveClassDisabled,
  versions: _versions,
  ...props
}) {
  const {pathname, search, hash} = useLocation();
  const versions = useVersions(docsPluginId);
  const [displayedVersion] = useDocsVersionCandidates(docsPluginId);
  const {savePreferredVersionName} = useDocsPreferredVersion(docsPluginId);
  const currentPage = `${pathname}${search}${hash}`;

  const items = [
    ...dropdownItemsBefore,
    ...versions.map((version) => ({
      label: version.label,
      to: currentPage,
      isActive: () => version === displayedVersion,
      onClick: () => savePreferredVersionName(version.name),
    })),
    ...dropdownItemsAfter,
  ];

  const label = mobile
    ? translate({
        id: 'theme.navbar.mobileVersionsDropdown.label',
        message: 'Versions',
        description: 'The label for the navbar versions dropdown on mobile view',
      })
    : displayedVersion.label;

  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      label={label}
      to={mobile ? undefined : currentPage}
      items={items}
      isActive={dropdownActiveClassDisabled ? () => false : undefined}
    />
  );
}

export default function DocsVersionDropdownNavbarItem(props) {
  const {pathname} = useLocation();
  const isUnversionedPage = UNVERSIONED_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (isUnversionedPage) {
    return <UnversionedPageVersionDropdown {...props} />;
  }
  return <OriginalDocsVersionDropdownNavbarItem {...props} />;
}
