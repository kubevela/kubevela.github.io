import React from 'react';

// KindIcon is the icon for each kind of KubeVela Definition, the same in every
// drawing: a source hexagon, a component square, a trait pill, a policy
// diamond and a checked workflow step.
export default function KindIcon({ kind, x, y, size = 10 }) {
  const h = size / 2;
  switch (kind) {
    case 'source':
      return (
        <path
          className="dg-type"
          d={`M ${x + size * 0.25} ${y} h ${h} l ${size * 0.25} ${h} l ${-size * 0.25} ${h} h ${-h} l ${-size * 0.25} ${-h} Z`}
        />
      );
    case 'component':
      return <rect className="dg-type" x={x} y={y} width={size} height={size} rx={size / 4} />;
    case 'trait':
      return <rect className="dg-trait-badge" x={x} y={y} width={size} height={size} rx={h} />;
    case 'policy':
      return <path className="dg-type" d={`M ${x + h} ${y} l ${h} ${h} l ${-h} ${h} l ${-h} ${-h} Z`} />;
    default:
      return (
        <g className="dg-step on dg-step-icon">
          <circle cx={x + h} cy={y + h} r={h} />
          <path d={`M ${x + h * 0.5} ${y + h} l ${h * 0.33} ${h * 0.33} l ${h * 0.62} ${h * -0.66}`} />
        </g>
      );
  }
}
