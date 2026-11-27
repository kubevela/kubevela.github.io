import React from 'react';
import Footer from '@theme-original/DocItem/Footer';
import ReportProblem from './ReportProblem';

// The theme's doc footer, followed by the "Report a problem with this page" control.
export default function FooterWrapper(props) {
  return (
    <>
      <Footer {...props} />
      <ReportProblem />
    </>
  );
}
