import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {Collapsible, useHistorySelector} from '@docusaurus/theme-common';
import {
  useActiveDocContext,
  useDocsPreferredVersion,
  useVersions,
} from '@docusaurus/plugin-content-docs/client';
import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import NavbarNavLink from '@theme/NavbarItem/NavbarNavLink';
import {CollapseButton} from '@theme/NavbarItem/DropdownNavbarItem/Mobile';
import {useAccordionItem} from '@site/src/components/MenuAccordion';

// A product in the Documentation menu. On a phone, a versioned product also lists its versions under a caret:
// the product links to its latest docs, a version to the page being read in that version, or that version's
// home. Everywhere else it is a plain link.
export default function ProductNavbarItem({mobile, docsPluginId, ...props}) {
  if (!mobile || !docsPluginId) {
    return <DefaultNavbarItem mobile={mobile} {...props} />;
  }
  return <ProductWithVersions docsPluginId={docsPluginId} {...props} />;
}

function ProductWithVersions({docsPluginId, onClick, className, isDropdownItem, ...props}) {
  const versions = useVersions(docsPluginId);
  const activeDocContext = useActiveDocContext(docsPluginId);
  const {savePreferredVersionName} = useDocsPreferredVersion(docsPluginId);
  const search = useHistorySelector((history) => history.location.search);
  const {collapsed, toggleCollapsed} = useAccordionItem(`product:${docsPluginId}`, false);
  const activeVersion = activeDocContext.activeVersion?.name;
  return (
    <li className={clsx('menu__list-item', {'menu__list-item--collapsed': collapsed})}>
      <div className="menu__list-item-collapsible">
        <NavbarNavLink className={clsx('menu__link', className)} onClick={onClick} {...props} />
        <CollapseButton
          collapsed={collapsed}
          onClick={(e) => {
            e.preventDefault();
            toggleCollapsed();
          }}
        />
      </div>
      <Collapsible lazy as="ul" className="menu__list kv-product-versions" collapsed={collapsed}>
        {versions.map((version) => {
          const doc =
            activeDocContext.alternateDocVersions[version.name] ??
            version.docs.find((d) => d.id === version.mainDocId);
          return (
            <li className="menu__list-item" key={version.name}>
              <Link
                className={clsx('menu__link', {'menu__link--active': version.name === activeVersion})}
                to={`${doc.path}${search}`}
                onClick={() => {
                  savePreferredVersionName(version.name);
                  onClick?.();
                }}>
                {version.label}
              </Link>
            </li>
          );
        })}
      </Collapsible>
    </li>
  );
}
