import React from 'react';
import Sail from '@site/src/components/home/Sail';
import styles from './styles.module.scss';

const CHIP_H = 28;

// Mark is the icon for a kind of Definition, as on the homepage.
function Mark({ kind, x, y, size = 11 }) {
  const h = size / 2;
  if (kind === 'policy') return <path className={styles.mark} d={`M ${x + h} ${y} l ${h} ${h} l ${-h} ${h} l ${-h} ${-h} Z`} />;
  if (kind === 'workflow')
    return (
      <g>
        <circle className={styles.mark} cx={x + h} cy={y + h} r={h} />
        <path className={styles.tick} d={`M ${x + h * 0.5} ${y + h} l ${h * 0.33} ${h * 0.33} l ${h * 0.62} ${h * -0.66}`} />
      </g>
    );
  return null;
}

function Chip({ x, y, w, label, kind }) {
  return (
    <g>
      <rect className={styles.chip} x={x} y={y} width={w} height={CHIP_H} rx={7} />
      <Mark kind={kind} x={x + 10} y={y + 8.5} />
      <text className={styles.chipText} x={kind ? x + w / 2 + 8 : x + w / 2} y={y + 18.5} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function Arrow({ d, dashed }) {
  return <path className={dashed ? styles.dashed : styles.flow} d={d} markerEnd="url(#mcw-head)" />;
}

// down routes from (x1, y1) down to a bus at yb, across to x2 and down to
// y2: right angles with rounded corners.
function down(x1, y1, yb, x2, y2) {
  const dx = x2 - x1;
  if (Math.abs(dx) < 1) return `M ${x1} ${y1} V ${y2}`;
  const s = Math.sign(dx);
  const r = Math.min(8, Math.abs(dx) / 2);
  return `M ${x1} ${y1} V ${yb - r} Q ${x1} ${yb} ${x1 + s * r} ${yb} H ${x2 - s * r} Q ${x2} ${yb} ${x2} ${yb + r} V ${y2}`;
}

const HUB = { x: 150, y: 12, w: 410, h: 116 };
const APP = { x: 165, y: 48, w: 210, h: 66 };
const OPT = { x: 408, y: 34, w: 138, h: 82 };
const MANAGED = [
  { x: 20, chips: [170, 270] },
  { x: 400, chips: [550, 650] },
];
const MANAGED_Y = 172;
const STEPS = [
  { x: 110, label: 'deploy' },
  { x: 310, label: 'suspend' },
  { x: 510, label: 'deploy' },
];
const STEP = { y: 310, w: 140 };

// MultiClusterWorkflow shows a KubeVela Application in the hub cluster
// dispatched to managed clusters, and a workflow whose deploy steps use
// topology and override policies to choose clusters and patch resources.
export default function MultiClusterWorkflow() {
  const appBottom = APP.y + APP.h;
  const appMid = APP.x + APP.w / 2;
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 760 500"
        role="img"
        aria-label="A KubeVela Application in the hub cluster optionally refers to a policy, such as a topology or override policy, and a workflow made of deploy workflow steps. It dispatches a Deployment and a Service to each managed cluster. In its workflow, a deploy step uses a topology policy for cluster-beijing-1 and cluster-beijing-2, a suspend step waits, and a second deploy step uses a topology policy for cluster-hangzhou and an override policy setting replicas to 3.">
        <defs>
          <marker id="mcw-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* The hub cluster, with the Application and what it may refer to. */}
        <rect className={styles.group} x={HUB.x} y={HUB.y} width={HUB.w} height={HUB.h} rx={12} />
        <text className={styles.label} x={HUB.x + 14} y={HUB.y + 22}>
          HUB CLUSTER
        </text>
        <rect className={styles.app} x={APP.x} y={APP.y} width={APP.w} height={APP.h} rx={10} />
        <Sail className={styles.sail} x={APP.x + 14} y={APP.y + 21} width={24} height={24} />
        <text className={styles.title} x={APP.x + 46} y={APP.y + 38}>
          KubeVela Application
        </text>
        <rect className={styles.optional} x={OPT.x} y={OPT.y} width={OPT.w} height={OPT.h} rx={8} />
        <text className={styles.flowLabel} x={OPT.x + 8} y={OPT.y + 14}>
          optional
        </text>
        <Chip x={OPT.x + 14} y={OPT.y + 20} w={OPT.w - 28} label="Policy" kind="policy" />
        <Chip x={OPT.x + 14} y={OPT.y + 52} w={OPT.w - 28} label="Workflow" kind="workflow" />
        {[OPT.y + 34, OPT.y + 66].map((y) => (
          <Arrow key={y} d={`M ${APP.x + APP.w + 1} ${y} H ${OPT.x + 11}`} />
        ))}
        <text className={styles.flowLabel} x={(APP.x + APP.w + OPT.x) / 2} y={OPT.y + 54} textAnchor="middle">
          refer
        </text>
        <Arrow dashed d={`M ${OPT.x + OPT.w - 13} ${OPT.y + 34} H ${OPT.x + OPT.w + 40}`} />
        <Arrow dashed d={`M ${OPT.x + OPT.w - 13} ${OPT.y + 66} H ${OPT.x + OPT.w + 40}`} />
        <text className={styles.note} x={OPT.x + OPT.w + 48} y={OPT.y + 38}>
          Topology, override policies
        </text>
        <text className={styles.note} x={OPT.x + OPT.w + 48} y={OPT.y + 70}>
          Deploy workflow steps
        </text>

        {/* Dispatched to each managed cluster. */}
        {MANAGED.map((m) => (
          <g key={m.x}>
            <rect className={styles.group} x={m.x} y={MANAGED_Y} width={340} height={64} rx={12} />
            <text className={styles.label} x={m.x + 14} y={MANAGED_Y + 18}>
              MANAGED CLUSTER
            </text>
            {m.chips.map((cx, i) => (
              <g key={cx}>
                <Chip x={cx - 46} y={MANAGED_Y + 26} w={92} label={i === 0 ? 'Deployment' : 'Service'} />
                <Arrow d={down(appMid, appBottom + 1, 152, cx, MANAGED_Y + 23)} />
              </g>
            ))}
          </g>
        ))}
        <text className={styles.flowLabel} x={appMid + 8} y={144}>
          dispatch
        </text>

        <path className={styles.divider} d="M 12 262 H 748" />

        {/* The workflow, as a broad arrow, and the policies its steps use. */}
        <path className={styles.band} d="M 20 284 H 700 V 272 L 744 326 L 700 380 V 368 H 20 Z" />
        <text className={styles.label} x={34} y={302}>
          WORKFLOW
        </text>
        {STEPS.map((s, i) => (
          <g key={i}>
            <Chip x={s.x} y={STEP.y} w={STEP.w} label={s.label} kind="workflow" />
            <text className={styles.italic} x={s.x + 4} y={STEP.y + CHIP_H + 16}>
              Workflow step
            </text>
            {i < STEPS.length - 1 && <Arrow d={`M ${s.x + STEP.w + 1} ${STEP.y + CHIP_H / 2} H ${STEPS[i + 1].x - 3}`} />}
          </g>
        ))}
        {[
          { step: 0, x: 215, label: 'topology', out: 'cluster-beijing-1,', out2: 'cluster-beijing-2' },
          { step: 2, x: 528, label: 'topology', out: 'cluster-hangzhou' },
          { step: 2, x: 652, label: 'override', out: 'replicas=3' },
        ].map((p) => {
          const s = STEPS[p.step];
          // Each step's use of policies leaves from the right of its caption.
          const from = s.x + STEP.w - 35;
          return (
            <g key={p.x}>
              <Arrow d={down(from, STEP.y + CHIP_H + 1, 396, p.x, 408)} />
              <Chip x={p.x - 56} y={410} w={112} label={p.label} kind="policy" />
              <text className={styles.italic} x={p.x - 52} y={452}>
                Policy
              </text>
              <Arrow dashed d={`M ${p.x} ${439} V ${458}`} />
              <text className={styles.chipText} x={p.x} y={472} textAnchor="middle">
                {p.out}
              </text>
              {p.out2 && (
                <text className={styles.chipText} x={p.x} y={486} textAnchor="middle">
                  {p.out2}
                </text>
              )}
            </g>
          );
        })}
        {[0, 2].map((i) => (
          <text key={i} className={styles.flowLabel} x={STEPS[i].x + STEP.w - 27} y={386}>
            use
          </text>
        ))}
      </svg>
    </figure>
  );
}
