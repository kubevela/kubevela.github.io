import React from 'react';
import KindIcon from './KindIcon';

// The glyphs are small, still pictures of each step of How it works, in the
// drawings' vocabulary. They are decoration, so screen readers skip them.

const Glyph = ({ children }) => (
  <svg className="dg" viewBox="0 0 136 76" aria-hidden="true">
    {children}
  </svg>
);

// DefineGlyph: a stack of definitions: a component, a trait and a source.
export function DefineGlyph() {
  return (
    <Glyph>
      {[
        [4, 4, 'component', 40],
        [22, 28, 'trait', 30],
        [40, 52, 'source', 34],
      ].map(([x, y, kind, w]) => (
        <g key={y} className="dg-card">
          <rect x={x} y={y} width="92" height="20" rx="6" />
          <KindIcon kind={kind} x={x + 7} y={y + 5} />
          <rect className="dg-line strong" x={x + 23} y={y + 7.5} width={w} height="5" rx="2.5" />
        </g>
      ))}
    </Glyph>
  );
}

// ComposeGlyph: an application assembled from two components and their traits.
export function ComposeGlyph() {
  return (
    <Glyph>
      <g className="dg-card dg-app on">
        <rect x="18" y="2" width="100" height="72" rx="10" />
        <rect className="dg-line strong" x="28" y="11" width="36" height="5" rx="2.5" />
        {[24, 48].map((y, i) => (
          <g key={y} className="dg-component on">
            <rect className="dg-block" x="26" y={y} width="72" height="18" rx="5" />
            <rect className="dg-type" x="31" y={y + 4} width="10" height="10" rx="2.5" />
            <rect className="dg-line" x="46" y={y + 6.5} width={i ? 22 : 30} height="5" rx="2.5" />
            {Array.from({ length: i ? 1 : 2 }, (_, t) => (
              <rect
                key={t}
                className="dg-trait on"
                x="101"
                y={i ? y + 5 : y + 1 + t * 9}
                width="10"
                height="8"
                rx="4"
              />
            ))}
          </g>
        ))}
      </g>
    </Glyph>
  );
}

// DeliverGlyph: three clusters running the application, all healthy.
export function DeliverGlyph() {
  return (
    <Glyph>
      {[2, 27, 52].map((y, c) => (
        <g key={y} className="dg-card dg-cluster on">
          <rect x="4" y={y} width="128" height="21" rx="6" />
          <circle className="dg-dot" cx="15" cy={y + 10.5} r="3.5" />
          <rect className="dg-line strong" x="24" y={y + 8} width={[30, 24, 34][c]} height="5" rx="2.5" />
          {Array.from({ length: [4, 5, 3][c] }, (_, p) => (
            <rect key={p} className="dg-pod" x={70 + p * 11} y={y + 6} width="8" height="8" rx="2" />
          ))}
        </g>
      ))}
    </Glyph>
  );
}
