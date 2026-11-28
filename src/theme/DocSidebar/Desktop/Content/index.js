import React from 'react';
import Content from '@theme-original/DocSidebar/Desktop/Content';
import SectionHeader from '@site/src/components/SectionHeader';

export default function ContentWrapper(props) {
  return (
    <>
      <SectionHeader />
      <Content {...props} />
    </>
  );
}
