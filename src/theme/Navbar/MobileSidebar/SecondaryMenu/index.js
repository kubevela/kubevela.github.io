import React from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useNavbarSecondaryMenu} from '@docusaurus/theme-common/internal';
import Translate from '@docusaurus/Translate';
import SectionHeader from '@site/src/components/SectionHeader';

// Ejected from theme-classic 3.10.2 to put the docs section header between the back button and the docs sidebar,
// which wrapping can't reach: the sidebar arrives as opaque menu content.
function SecondaryMenuBackButton(props) {
  return (
    <button {...props} type="button" className="clean-btn navbar-sidebar__back">
      <Translate
        id="theme.navbar.mobileSidebarSecondaryMenu.backButtonLabel"
        description="The label of the back button to return to main menu, inside the mobile navbar sidebar secondary menu (notably used to display the docs sidebar)">
        ← Back to main menu
      </Translate>
    </button>
  );
}

export default function NavbarMobileSidebarSecondaryMenu() {
  const isPrimaryMenuEmpty = useThemeConfig().navbar.items.length === 0;
  const secondaryMenu = useNavbarSecondaryMenu();
  return (
    <>
      {!isPrimaryMenuEmpty && <SecondaryMenuBackButton onClick={() => secondaryMenu.hide()} />}
      <SectionHeader />
      {secondaryMenu.content}
    </>
  );
}
