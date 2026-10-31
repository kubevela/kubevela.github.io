import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import styles from './styles.module.scss';

// The addons column: KubeVela's own first, then the ecosystem's.
const ADDONS = [
  { name: 'VelaUX', own: true },
  { name: 'Vela Prism', own: true },
  { name: 'Vela Workflow', own: true },
  { name: 'Argo', logo: 'argo.svg' },
  { name: 'Flux', logo: 'fluxcd.svg' },
  { name: 'OpenKruise', logo: 'openkruise.svg' },
  { name: 'Dapr', logo: 'dapr.svg' },
  { name: 'Crossplane', logo: 'crossplane.svg' },
  { name: 'Terraform', logo: 'terraform.png' },
  { name: 'OCM', logo: 'ocm.svg' },
  { name: 'OpenYurt' },
  { name: '...' },
];
const COL = { x: 640, y: 10, w: 140 };
const ROW = 30;
const addonY = (i) => COL.y + 40 + i * ROW;

function Arrow({ d }) {
  return <path className={styles.flow} d={d} markerEnd="url(#ha-head)" />;
}

function Note({ x, y, w, lines }) {
  return (
    <g>
      <rect className={styles.note} x={x} y={y} width={w} height={lines.length * 15 + 12} rx={6} />
      {lines.map((l, i) => (
        <text key={i} className={styles.prose} x={x + w / 2} y={y + 19 + i * 15} textAnchor="middle">
          {l}
        </text>
      ))}
    </g>
  );
}

// HaDeploy shows which parts of a KubeVela installation scale out as stateless
// replicas and which run in master-slave mode, and that every addon in use
// needs a high availability deployment of its own.
export default function HaDeploy() {
  const { withBaseUrl } = useBaseUrlUtils();
  const k8s = withBaseUrl('img/logs/k8s.svg');
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 930 432"
        role="img"
        aria-label="VelaUX runs a stateless Nginx frontend and a stateless APIServer in front of a high availability MongoDB cluster. The KubeVela controller runs as a master with slaves on standby. The Terraform controller runs in master-slave mode like the KubeVela controller, and the cluster gateway is stateless, so scale its replicas. Addons such as VelaUX and Vela Prism are stateless, Vela Workflow runs in master-slave mode, and every addon in use should be deployed for high availability.">
        <defs>
          <marker id="ha-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* VelaUX: two stateless tiers in front of an HA database. */}
        <rect className={styles.region} x={10} y={30} width={600} height={104} rx={14} />
        <text className={styles.title} x={26} y={54}>
          VelaUX
        </text>
        {[
          ['Stateless frontend', 'Nginx'],
          ['Stateless APIServer'],
          ['HA MongoDB', 'clusters'],
        ].map((lines, i) => {
          const x = 26 + i * 196;
          return (
            <g key={i}>
              <rect className={styles.system} x={x} y={66} width={176} height={52} rx={8} />
              {lines.map((l, k) => (
                <text key={k} className={styles.chipText} x={x + 88} y={lines.length === 1 ? 96 : 88 + k * 16} textAnchor="middle">
                  {l}
                </text>
              ))}
              {i < 2 && <Arrow d={`M ${x + 177} 92 H ${x + 193}`} />}
            </g>
          );
        })}
        <Arrow d="M 310 135 V 159" />

        {/* The controller: one master, slaves on standby. */}
        <rect className={styles.app} x={10} y={162} width={600} height={100} rx={14} />
        <rect className={styles.tile} x={22} y={174} width={28} height={28} rx={6} />
        <image href={k8s} x={24} y={176} width={24} height={24} />
        <rect className={styles.system} x={64} y={176} width={380} height={34} rx={7} />
        <text className={styles.chipText} x={254} y={198} textAnchor="middle">
          Master
        </text>
        {[0, 1].map((r) => (
          <g key={r}>
            <rect className={styles.card} x={456} y={176 + r * 20} width={140} height={16} rx={4} />
            <text className={styles.muted} x={526} y={188 + r * 20} textAnchor="middle">
              Slave
            </text>
          </g>
        ))}
        <text className={styles.big} x={310} y={246} textAnchor="middle">
          KubeVela Controller
        </text>

        {/* What it reaches, each through its own component. */}
        {[
          { x: 10, chip: 'Terraform Controller', name: 'Cloud providers' },
          { x: 216, chip: 'Cluster Gateway', name: 'Multi Kubernetes clusters' },
          { x: 422, name: 'IoT / Edge' },
        ].map(({ x, chip, name }) => (
          <g key={name}>
            {chip && (
              <>
                <rect className={styles.system} x={x + 14} y={286} width={160} height={26} rx={6} />
                <text className={styles.chipText} x={x + 94} y={303} textAnchor="middle">
                  {chip}
                </text>
              </>
            )}
            <rect className={styles.target} x={x} y={318} width={188} height={36} rx={8} />
            <text className={styles.strong} x={x + 94} y={340} textAnchor="middle">
              {name}
            </text>
          </g>
        ))}
        <Arrow d="M 310 263 V 283" />
        <path className={styles.link} d="M 104 355 V 372" />
        <Note x={14} y={372} w={180} lines={['Master-slave mode, same', 'as the KubeVela controller']} />
        <path className={styles.link} d="M 310 355 V 372" />
        <Note x={220} y={372} w={180} lines={['Stateless, just scale', 'replicas for it']} />

        {/* Addons, and what each kind needs. */}
        <rect className={styles.card} x={COL.x} y={COL.y} width={COL.w} height={addonY(ADDONS.length) - COL.y + 6} rx={12} />
        <rect className={styles.header} x={COL.x} y={COL.y} width={COL.w} height={32} rx={12} />
        <text className={styles.headerText} x={COL.x + COL.w / 2} y={COL.y + 21} textAnchor="middle">
          Addons
        </text>
        {ADDONS.map(({ name, own, logo }, i) => {
          const y = addonY(i);
          return (
            <g key={name}>
              <rect className={own ? styles.system : styles.card} x={COL.x + 8} y={y} width={COL.w - 16} height={24} rx={6} />
              {logo && (
                <>
                  <rect className={styles.tile} x={COL.x + 13} y={y + 3} width={18} height={18} rx={4} />
                  <image href={withBaseUrl(`img/logs/${logo}`)} x={COL.x + 15} y={y + 5} width={14} height={14} />
                </>
              )}
              <text className={styles.chipText} x={logo ? COL.x + 38 : COL.x + COL.w / 2} y={y + 16} textAnchor={logo ? 'start' : 'middle'}>
                {name}
              </text>
            </g>
          );
        })}
        <Arrow d={`M ${COL.x - 1} 212 H 613`} />

        <path className={styles.link} d={`M ${COL.x + COL.w - 8} ${addonY(0) + 12} H 788 V ${addonY(1) + 12} H ${COL.x + COL.w - 8} M 788 ${addonY(0) + 24} H 796`} />
        <Note x={796} y={addonY(0) + 2} w={124} lines={['Stateless, just', 'scale replicas']} />
        <path className={styles.link} d={`M ${COL.x + COL.w - 8} ${addonY(2) + 12} H 784 Q 792 ${addonY(2) + 12} 792 ${addonY(2) + 20} V ${addonY(3) + 6} Q 792 ${addonY(3) + 14} 796 ${addonY(3) + 14}`} />
        <Note x={796} y={addonY(3) - 6} w={124} lines={['Master-slave mode,', 'same as the', 'KubeVela controller']} />
        <path className={styles.link} d={`M ${COL.x + COL.w + 4} ${addonY(3) + 30} V ${addonY(ADDONS.length - 1) + 12}`} />
        <path className={styles.link} d={`M ${COL.x + COL.w + 4} ${addonY(7) + 12} H 796`} />
        {['Make sure every', 'addon you use has', 'a high availability', 'deployment'].map((l, i) => (
          <text key={i} className={styles.emph} x={800} y={addonY(7) - 12 + i * 16}>
            {l}
          </text>
        ))}
      </svg>
    </figure>
  );
}
