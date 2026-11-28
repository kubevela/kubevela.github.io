import React from 'react';
import styles from './styles.module.scss';

const CHIP_H = 26;

// Mark is the icon for a kind of Definition, as on the homepage.
function Mark({ kind, x, y, size = 11 }) {
  const h = size / 2;
  switch (kind) {
    case 'component':
      return <rect className={styles.mark} x={x} y={y} width={size} height={size} rx={size / 4} />;
    case 'trait':
      return <rect className={styles.markSoft} x={x} y={y} width={size} height={size} rx={h} />;
    case 'policy':
      return <path className={styles.mark} d={`M ${x + h} ${y} l ${h} ${h} l ${-h} ${h} l ${-h} ${-h} Z`} />;
    case 'workflow':
      return (
        <g>
          <circle className={styles.mark} cx={x + h} cy={y + h} r={h} />
          <path className={styles.tick} d={`M ${x + h * 0.5} ${y + h} l ${h * 0.33} ${h * 0.33} l ${h * 0.62} ${h * -0.66}`} />
        </g>
      );
    default:
      return null;
  }
}

// Chip is a named box, marked with its kind; an external one is dashed.
function Chip({ x, y, w, label, kind, external }) {
  return (
    <g>
      <rect className={external ? styles.external : styles.chip} x={x} y={y} width={w} height={CHIP_H} rx={6} />
      <Mark kind={kind} x={x + 9} y={y + 7.5} />
      <text className={styles.chipText} x={kind ? x + 26 : x + w / 2} y={y + 17} textAnchor={kind ? 'start' : 'middle'}>
        {label}
      </text>
    </g>
  );
}

// link joins two points with right angles and rounded corners, through a
// vertical trunk at xb.
function link(x1, y1, xb, x2, y2) {
  const dy = y2 - y1;
  if (Math.abs(dy) < 1) return `M ${x1} ${y1} H ${x2}`;
  const s = Math.sign(dy);
  const r = Math.min(6, Math.abs(dy) / 2);
  const t = Math.sign(x2 - xb) || 1;
  return `M ${x1} ${y1} H ${xb - Math.sign(xb - x1) * r} Q ${xb} ${y1} ${xb} ${y1 + s * r} V ${y2 - s * r} Q ${xb} ${y2} ${xb + t * r} ${y2} H ${x2}`;
}

// BigArrow is a broad arrow for the two hand-offs, pointing left or right.
function BigArrow({ x1, x2, y }) {
  const dir = Math.sign(x2 - x1);
  const shaft = x2 - dir * 16;
  return <path className={styles.big} d={`M ${x1} ${y - 5} H ${shaft} V ${y - 12} L ${x2} ${y} L ${shaft} ${y + 12} V ${y + 5} H ${x1} Z`} />;
}

// The ApplicationRevision's sections and the chips in each.
const REVISION = [
  { title: 'ComponentDefinition', rows: [[['ref-objects', 'component'], ['webservice', 'component']]] },
  { title: 'TraitDefinition', rows: [[['gateway', 'trait'], ['env', 'trait']], [['scaler', 'trait']]] },
  { title: 'WorkflowStepDefinition', rows: [[['deploy', 'workflow']]] },
  { title: 'External Workflow', rows: [], external: true },
  { title: 'External Policies', rows: [[['topology', 'policy', true], ['override', 'policy', true]]] },
  { title: 'Referred Objects', rows: [[['Deployment', null, true], ['Secret', null, true]]] },
];

// ApplicationRevisionArch shows an Application and what it refers to being
// snapshotted into an ApplicationRevision, which the workflow then runs from.
export default function ApplicationRevisionArch() {
  const R = { x: 542, y: 12, w: 266 };
  const inner = { x: R.x + 10, w: R.w - 20 };
  const half = (inner.w - 24 - 8) / 2;
  let y = R.y + 40;
  const sections = REVISION.map((s) => {
    const h = s.external ? 34 : 34 + s.rows.length * (CHIP_H + 6);
    const out = { ...s, y, h };
    y += h + 6;
    return out;
  });
  const revisionH = y - R.y + 4;
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox={`0 0 820 ${revisionH + 24}`}
        role="img"
        aria-label="An Application's components, traits and workflow refer to objects, policies and an external workflow. A snapshot captures them all in an ApplicationRevision: the component, trait and workflow step definitions in use, the external workflow, the external policies and the referred objects. The workflow then runs from the revision.">
        {/* The Application. */}
        <rect className={styles.group} x={12} y={12} width={280} height={300} rx={12} />
        <text className={styles.title} x={28} y={38}>
          KubeVela Application
        </text>
        <rect className={styles.card} x={24} y={52} width={256} height={150} rx={10} />
        <text className={styles.title} x={36} y={74}>
          Components
        </text>
        <rect className={styles.card} x={24} y={214} width={256} height={86} rx={10} />
        <text className={styles.title} x={36} y={236}>
          Workflow
        </text>
        {[
          { trait: 'scaler', comp: 'ref-objects', y: 92 },
          { trait: 'env', comp: 'webservice', y: 150 },
        ].map((r) => (
          <g key={r.comp}>
            <path className={styles.link} d={`M 108 ${r.y + 13} H 132`} />
            <Chip x={36} y={r.y} w={72} label={r.trait} kind="trait" />
            <Chip x={132} y={r.y} w={136} label={r.comp} kind="component" />
          </g>
        ))}
        <Chip x={132} y={256} w={136} label="ref" kind="workflow" />

        {/* What it refers to, outside the Application. */}
        <Chip x={316} y={70} w={146} label="Deployment" external />
        <Chip x={316} y={102} w={146} label="Secret" external />
        <path className={styles.link} d={link(268, 105, 296, 316, 83)} />
        <path className={styles.link} d={link(268, 105, 296, 316, 115)} />
        <Chip x={316} y={150} w={146} label="Topology Policy" kind="policy" external />
        <Chip x={316} y={182} w={146} label="Override Policy" kind="policy" external />
        <rect className={styles.external} x={316} y={250} width={146} height={38} rx={8} />
        <text className={styles.chipText} x={389} y={273} textAnchor="middle">
          External Workflow
        </text>
        <path className={styles.link} d={`M 268 269 H 316`} />
        <path className={styles.link} d={link(462, 163, 476, 462, 262)} />
        <path className={styles.link} d={link(462, 195, 476, 462, 262)} />

        {/* Snapshot, and the workflow running from the revision. */}
        <text className={styles.bigLabel} x={500} y={150} textAnchor="middle">
          Snapshot
        </text>
        <BigArrow x1={480} x2={530} y={166} />
        <text className={styles.bigLabel} x={430} y={revisionH - 30} textAnchor="middle">
          Run workflow
        </text>
        <BigArrow x1={532} x2={316} y={revisionH - 14} />

        {/* The ApplicationRevision. */}
        <rect className={styles.group} x={R.x} y={R.y} width={R.w} height={revisionH} rx={12} />
        <text className={styles.title} x={R.x + 16} y={R.y + 26}>
          ApplicationRevision
        </text>
        {sections.map((s) =>
          s.external ? (
            <g key={s.title}>
              <rect className={styles.external} x={inner.x} y={s.y} width={inner.w} height={s.h} rx={8} />
              <text className={styles.title} x={inner.x + inner.w / 2} y={s.y + 22} textAnchor="middle">
                {s.title}
              </text>
            </g>
          ) : (
            <g key={s.title}>
              <rect className={styles.card} x={inner.x} y={s.y} width={inner.w} height={s.h} rx={8} />
              <text className={styles.title} x={inner.x + 12} y={s.y + 20}>
                {s.title}
              </text>
              {s.rows.map((row, ri) =>
                row.map(([label, kind, ext], ci) => (
                  <Chip key={label} x={inner.x + 12 + ci * (half + 8)} y={s.y + 30 + ri * (CHIP_H + 6)} w={half} label={label} kind={kind} external={ext} />
                ))
              )}
            </g>
          )
        )}
      </svg>
    </figure>
  );
}
