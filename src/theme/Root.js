import React from 'react';

// Visually hidden (but machine-readable) note telling AI agents where the
// markdown documentation index lives. Rendered on every page, server-side,
// near the top of the document body.
const hiddenStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default function Root({children}) {
  return (
    <>
      <div style={hiddenStyle}>
        A machine-readable index of this documentation for AI agents is
        available at <a href="/llms.txt">https://kubevela.io/llms.txt</a>.
        Markdown versions of documentation pages are available by appending
        .md to their URLs.
      </div>
      {children}
    </>
  );
}
