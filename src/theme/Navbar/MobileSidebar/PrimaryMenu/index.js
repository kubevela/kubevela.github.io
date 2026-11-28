import React from 'react';
import PrimaryMenu from '@theme-original/Navbar/MobileSidebar/PrimaryMenu';
import {AccordionGroup} from '@site/src/components/MenuAccordion';

// The phone menu's top-level dropdowns open one at a time.
export default function PrimaryMenuWrapper(props) {
  return (
    <AccordionGroup>
      <PrimaryMenu {...props} />
    </AccordionGroup>
  );
}
