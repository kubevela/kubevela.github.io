import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.scss';

const SOURCES = ['ConfigMap', 'Git file', 'HTTP', 'Config'];
const TRAITS = ['Scaling', 'Rollout', 'Route', 'Metrics', 'Traffic'];
const POLICIES = ['Override', 'Topology', 'Security', 'Apply-once'];
const STEPS = ['Validation', 'Deploy', 'Suspend', 'Deploy', 'Notification'];

// Mark is the icon for a kind of Definition, as on the homepage.
function Mark({ kind, x, y, size = 12 }) {
  const h = size / 2;
  switch (kind) {
    case 'source':
      return <path className={styles.mark} d={`M ${x + size * 0.25} ${y} h ${h} l ${size * 0.25} ${h} l ${-size * 0.25} ${h} h ${-h} l ${-size * 0.25} ${-h} Z`} />;
    case 'component':
      return <rect className={styles.mark} x={x} y={y} width={size} height={size} rx={size / 4} />;
    case 'trait':
      return <rect className={styles.markSoft} x={x} y={y} width={size} height={size} rx={h} />;
    case 'policy':
      return <path className={styles.mark} d={`M ${x + h} ${y} l ${h} ${h} l ${-h} ${h} l ${-h} ${-h} Z`} />;
    default:
      return (
        <g>
          <circle className={styles.mark} cx={x + h} cy={y + h} r={h} />
          <path className={styles.tick} d={`M ${x + h * 0.5} ${y + h} l ${h * 0.33} ${h * 0.33} l ${h * 0.62} ${h * -0.66}`} />
        </g>
      );
  }
}

// Chip is a labelled box, with an optional kind mark before the label.
function Chip({ x, y, w, h = 26, label, kind, center }) {
  const tx = kind ? x + 28 : center ? x + w / 2 : x + 12;
  return (
    <g>
      <rect className={styles.chip} x={x} y={y} width={w} height={h} rx={7} />
      {kind && <Mark kind={kind} x={x + 10} y={y + h / 2 - 6} />}
      <text className={styles.chipText} x={tx} y={y + h / 2 + 4} textAnchor={center && !kind ? 'middle' : 'start'}>
        {label}
      </text>
    </g>
  );
}

// Person is a simple head-and-shoulders glyph for a role.
function Person({ x, y }) {
  return (
    <g className={styles.person}>
      <circle cx={x + 10} cy={y + 6} r={6} />
      <path d={`M ${x} ${y + 24} a 10 9 0 0 1 20 0 Z`} />
    </g>
  );
}

// OamConcept draws an Application as the sources it reads, its components
// with their traits, its policies and its workflow steps, each glued to
// Kubernetes by CRD controllers.
export default function OamConcept() {
  const k8s = useBaseUrl('img/logs/k8s.svg');
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 800 440"
        role="img"
        aria-label="An Application holds sources such as a ConfigMap, Git file, HTTP endpoint or Config; components such as a web service, with traits for scaling, rollout, route, metrics and traffic; policies for override, topology, security and apply-once; and workflow steps from validation through deploy, suspend, deploy and notification. Each is implemented on Kubernetes by CRD controllers.">
        <defs>
          <marker id="oc-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* The Application. */}
        <rect className={styles.group} x={10} y={36} width={624} height={394} rx={14} />
        <text className={styles.title} x={26} y={418}>
          Application
        </text>

        {/* Sources. */}
        <rect className={styles.card} x={26} y={52} width={124} height={256} rx={10} />
        <Mark kind="source" x={38} y={64} />
        <text className={styles.title} x={58} y={75}>
          Sources
        </text>
        {SOURCES.map((s, i) => (
          <Chip key={s} x={38} y={94 + i * 50} w={100} label={s} center />
        ))}

        {/* Components, stacked to show there can be several, each with traits. */}
        <rect className={styles.dashedBox} x={182} y={52} width={290} height={248} rx={10} />
        <rect className={styles.dashedBox} x={174} y={58} width={290} height={248} rx={10} />
        <rect className={styles.card} x={166} y={64} width={290} height={244} rx={10} />
        <rect className={styles.card} x={200} y={128} width={140} height={104} rx={8} />
        <Mark kind="component" x={212} y={140} />
        <text className={styles.title} x={232} y={151}>
          Component
        </text>
        <Chip x={212} y={178} w={116} label="Web Service" center />
        <rect className={styles.card} x={352} y={76} width={92} height={220} rx={8} />
        <Mark kind="trait" x={362} y={86} />
        <text className={styles.title} x={380} y={97}>
          Traits
        </text>
        {TRAITS.map((t, i) => (
          <Chip key={t} x={362} y={110 + i * 36} w={72} label={t} center />
        ))}
        <path className={styles.flow} d="M 351 192 H 343" markerEnd="url(#oc-head)" />
        {/* Components read their sources. */}
        <path className={styles.flow} d="M 151 180 H 197" markerEnd="url(#oc-head)" />

        {/* Policies. */}
        <rect className={styles.card} x={490} y={52} width={130} height={256} rx={10} />
        <Mark kind="policy" x={502} y={64} />
        <text className={styles.title} x={522} y={75}>
          Policies
        </text>
        {POLICIES.map((p, i) => (
          <Chip key={p} x={502} y={94 + i * 50} w={106} label={p} center />
        ))}

        {/* Workflow steps. */}
        <rect className={styles.card} x={26} y={324} width={594} height={74} rx={10} />
        <Mark kind="workflow" x={38} y={336} />
        <text className={styles.title} x={58} y={347}>
          Workflow steps
        </text>
        {STEPS.map((s, i) => {
          const x = 38 + i * 116;
          return (
            <g key={i}>
              <Chip x={x} y={360} w={100} label={s} center />
              {i < STEPS.length - 1 && <path className={styles.flow} d={`M ${x + 101} 373 H ${x + 113}`} markerEnd="url(#oc-head)" />}
            </g>
          );
        })}

        {/* Kubernetes glues each part in through CRD controllers. */}
        <rect className={styles.tile} x={692} y={188} width={64} height={64} rx={12} />
        <image href={k8s} x={698} y={194} width={52} height={52} />
        <text className={styles.title} x={724} y={272} textAnchor="middle">
          Kubernetes
        </text>
        <text className={styles.muted} x={724} y={290} textAnchor="middle">
          glued in by
        </text>
        <text className={styles.muted} x={724} y={305} textAnchor="middle">
          CRD controllers
        </text>
        <path className={styles.glue} d="M 714 188 V 30 Q 714 22 706 22 H 96 Q 88 22 88 30 V 49" markerEnd="url(#oc-head)" />
        <path className={styles.glue} d="M 270 22 V 125" markerEnd="url(#oc-head)" />
        <path className={styles.glue} d="M 398 22 V 73" markerEnd="url(#oc-head)" />
        <path className={styles.glue} d="M 691 180 H 623" markerEnd="url(#oc-head)" />
        <path className={styles.glue} d="M 734 314 V 353 Q 734 361 726 361 H 623" markerEnd="url(#oc-head)" />
      </svg>
    </figure>
  );
}
