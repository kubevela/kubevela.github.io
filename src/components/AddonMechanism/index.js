import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import styles from './styles.module.scss';

// Addons in the registry, drawn as a stack: the front one shows its files.
const ADDONS = [
  { x: 52, y: 64 },
  { x: 38, y: 78 },
  { x: 24, y: 92 },
];
const FRONT = { w: 178, h: 280 };
const APP = { x: 286, y: 150, w: 140, h: 96 };
const CONTROL = { x: 494, y: 104, w: 100, h: 266 };
// Managed clusters, stacked the other way so each shows its left edge.
const MANAGED = [
  { x: 646, y: 96, label: 'Managed cluster' },
  { x: 632, y: 142, label: 'Managed cluster' },
  { x: 618, y: 188, label: 'Managed cluster' },
];
const MANAGED_SIZE = { w: 124, h: 182 };

function Arrow({ d, className }) {
  return <path className={className || styles.flow} d={d} markerEnd="url(#adm-head)" />;
}

// AddonMechanism shows an addon going from the registry, rendered into an
// Application by the CLI or UI, and applied by the controller to the control
// cluster and on to the managed clusters.
export default function AddonMechanism() {
  const { withBaseUrl } = useBaseUrlUtils();
  const k8s = withBaseUrl('img/logs/k8s.svg');
  const front = ADDONS[ADDONS.length - 1];
  const files = { x: front.x + 12, y: front.y + 44, w: FRONT.w - 24, h: 118 };
  const defs = { x: front.x + 12, y: front.y + 178, w: FRONT.w - 24, h: 86 };
  const defsY = defs.y + defs.h / 2;
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 780 386"
        role="img"
        aria-label="Addon mechanism. In the addon registry, each addon holds a metadata file, a template and resources, and its definitions and UI schema. Enabling an addon with the KubeVela CLI or UI renders it into an Application, which the KubeVela app controller applies to the control cluster and from there to the managed clusters, each running services and deployments. The definitions and UI schema are applied to the control cluster directly.">
        <defs>
          <marker id="adm-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* The three stages, divided. */}
        {[
          { x: 128, text: 'ADDON REGISTRY' },
          { x: 356, text: 'KUBEVELA CLI / UI' },
          { x: 632, text: 'KUBEVELA APP CONTROLLER' },
        ].map((h) => (
          <text key={h.text} className={styles.label} x={h.x} y={20} textAnchor="middle">
            {h.text}
          </text>
        ))}
        <path className={styles.divider} d="M 252 32 V 378 M 466 32 V 378" />

        {/* The registry's addons; only the front one is opened up. */}
        {ADDONS.map((a, i) => (
          <g key={i}>
            <rect className={styles.card} x={a.x} y={a.y} width={FRONT.w} height={FRONT.h} rx={10} />
          </g>
        ))}
        <rect className={styles.chip} x={front.x + 12} y={front.y + 10} width={FRONT.w - 24} height={24} rx={6} />
        <text className={styles.chipText} x={front.x + FRONT.w / 2} y={front.y + 26} textAnchor="middle">
          Addon
        </text>
        <rect className={styles.group} x={files.x} y={files.y} width={files.w} height={files.h} rx={8} />
        {['metadata.yaml', 'template.yaml', '(or template.cue)', 'resources/'].map((f, i) => (
          <text key={f} className={i === 2 ? styles.note : styles.chipText} x={files.x + 12} y={files.y + 24 + i * 26}>
            {f}
          </text>
        ))}
        <rect className={styles.group} x={defs.x} y={defs.y} width={defs.w} height={defs.h} rx={8} />
        {['definitions/', 'schemas/', '(UI schemas)'].map((f, i) => (
          <text key={f} className={i === 2 ? styles.note : styles.chipText} x={defs.x + 12} y={defs.y + 24 + i * 24}>
            {f}
          </text>
        ))}

        {/* Enabling an addon renders each addon's files into an Application. */}
        <text className={styles.note} x={356} y={70} textAnchor="middle">
          enable addon
        </text>
        {ADDONS.map((a, i) => {
          const y = APP.y + 24 + (ADDONS.length - 1 - i) * 24;
          return <Arrow key={i} d={`M ${a.x + FRONT.w + 1} ${y} H ${APP.x - 3}`} />;
        })}
        <text className={styles.flowLabel} x={(ADDONS[0].x + FRONT.w + APP.x) / 2} y={APP.y + 8} textAnchor="middle">
          render
        </text>
        <rect className={styles.app} x={APP.x} y={APP.y} width={APP.w} height={APP.h} rx={12} />
        <text className={styles.title} x={APP.x + APP.w / 2} y={APP.y + APP.h / 2 + 5} textAnchor="middle">
          Application
        </text>

        {/* The controller applies it to the control cluster. */}
        <Arrow d={`M ${APP.x + APP.w + 1} ${APP.y + APP.h / 2} H ${CONTROL.x - 3}`} />
        <text className={styles.flowLabel} x={(APP.x + APP.w + CONTROL.x) / 2} y={APP.y + APP.h / 2 - 8} textAnchor="middle">
          apply
        </text>
        <Arrow d={`M ${defs.x + defs.w + 1} ${defsY} H ${CONTROL.x - 3}`} />
        <text className={styles.flowLabel} x={(APP.x + APP.w / 2 + 20)} y={defsY - 8} textAnchor="middle">
          apply definitions and UI schemas
        </text>

        <rect className={styles.card} x={CONTROL.x} y={CONTROL.y} width={CONTROL.w} height={CONTROL.h} rx={12} />
        <rect className={styles.tile} x={CONTROL.x + CONTROL.w / 2 - 13} y={CONTROL.y + 92} width={26} height={26} rx={6} />
        <image href={k8s} x={CONTROL.x + CONTROL.w / 2 - 10} y={CONTROL.y + 95} width={20} height={20} />
        <text className={styles.title} x={CONTROL.x + CONTROL.w / 2} y={CONTROL.y + 142} textAnchor="middle">
          Control
        </text>
        <text className={styles.title} x={CONTROL.x + CONTROL.w / 2} y={CONTROL.y + 160} textAnchor="middle">
          cluster
        </text>

        {/* And on to each managed cluster. */}
        {MANAGED.map((m, i) => (
          <g key={i}>
            <rect className={styles.card} x={m.x} y={m.y} width={MANAGED_SIZE.w} height={MANAGED_SIZE.h} rx={10} />
            <text className={styles.title} x={m.x + 12} y={m.y + 22}>
              {m.label}
            </text>
            <Arrow d={`M ${CONTROL.x + CONTROL.w + 1} ${m.y + 18} H ${m.x - 3}`} />
          </g>
        ))}
        {(() => {
          const m = MANAGED[MANAGED.length - 1];
          return ['service', 'deployment'].map((r, i) => (
            <g key={r}>
              <rect className={styles.chip} x={m.x + 12} y={m.y + 40 + i * 32} width={MANAGED_SIZE.w - 24} height={24} rx={6} />
              <text className={styles.chipText} x={m.x + MANAGED_SIZE.w / 2} y={m.y + 56 + i * 32} textAnchor="middle">
                {r}
              </text>
            </g>
          ));
        })()}
        <text className={styles.note} x={MANAGED[2].x + MANAGED_SIZE.w / 2} y={MANAGED[2].y + 124} textAnchor="middle">
          and more
        </text>
      </svg>
    </figure>
  );
}
