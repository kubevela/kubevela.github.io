import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import Sail from '@site/src/components/home/Sail';
import styles from './styles.module.scss';

const PLATFORM = ['Env Provision', 'Cloud Promotion', 'Deployment as Code', 'CI Integration', 'Multi-Tenants', 'Multi-Cloud Delivery', 'Validation/Compliance', 'Resource Topology'];
const CORE = ['OAM', 'Cloud Resource', 'Workflow', 'Multi-Cluster', 'Observability', 'Security'];
const ADDONS = ['ArgoCD', 'VelaUX', 'OpenKruise', 'Dapr', 'Crossplane', 'Terraform', 'OCM', 'OpenYurt', '...'];

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

// Layer is a row's name in the column on the left.
function Layer({ y, h, lines, className }) {
  return (
    <g>
      <rect className={className} x={16} y={y} width={124} height={h} rx={10} />
      {lines.map((l, i) => (
        <text key={l} className={styles.layerText} x={78} y={y + h / 2 + 5 - ((lines.length - 1) * 9) + i * 18} textAnchor="middle">
          {l}
        </text>
      ))}
    </g>
  );
}

// VelaOverview draws KubeVela's layers: the app delivery platform DevOps
// engineers use, the control plane, and the infrastructure platform builders
// provide, with addons from ISV and SaaS owners extending them.
export default function VelaOverview() {
  const { withBaseUrl } = useBaseUrlUtils();
  const logo = (f) => withBaseUrl(`img/logs/${f}`);
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 960 452"
        role="img"
        aria-label="KubeVela in three layers. DevOps engineers use the app delivery platform: env provision, cloud promotion, deployment as code, CI integration, multi-tenants, multi-cloud delivery, validation and compliance, and resource topology. It runs on the KubeVela control plane: OAM, cloud resources, workflow, multi-cluster, observability and security. Underneath is the infrastructure platform builders provide: cloud providers, Kubernetes clusters and IoT or edge. ISV and SaaS owners extend it with addons such as ArgoCD, VelaUX, OpenKruise, Dapr, Crossplane, Terraform, OCM and OpenYurt.">
        <defs>
          <marker id="vo-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* DevOps engineers use the platform. */}
        <Person x={404} y={8} />
        <text className={styles.title} x={434} y={28}>
          DevOps Engineers
        </text>
        <path className={styles.flow} d="M 414 38 V 59" markerEnd="url(#vo-head)" />

        {/* App delivery platform. */}
        <Layer y={62} h={88} lines={['App Delivery', 'Platform']} className={styles.layerApp} />
        <rect className={styles.card} x={148} y={62} width={704} height={88} rx={10} />
        {PLATFORM.map((p, i) => (
          <Chip key={p} x={160 + (i % 4) * 172} y={76 + Math.floor(i / 4) * 36} w={164} label={p} center />
        ))}
        <path className={styles.flow} d="M 78 151 V 163" markerEnd="url(#vo-head)" />

        {/* Control plane. */}
        <Layer y={166} h={122} lines={['Control Plane']} className={styles.layerCore} />
        <rect className={styles.card} x={148} y={166} width={704} height={122} rx={10} />
        {CORE.map((c, i) => (
          <g key={c}>
            <rect className={styles.coreChip} x={160 + i * 114} y={180} width={108} height={28} rx={7} />
            <text className={styles.coreText} x={214 + i * 114} y={198} textAnchor="middle">
              {c}
            </text>
          </g>
        ))}
        <path className={styles.bracket} d="M 166 214 V 220 H 834 V 214 M 500 220 V 230" />
        <rect className={styles.kubevela} x={160} y={234} width={680} height={40} rx={8} />
        <Sail className={styles.sail} x={448} y={242} width={24} height={24} />
        <text className={styles.title} x={478} y={259}>
          KubeVela
        </text>
        <path className={styles.flow} d="M 78 289 V 301" markerEnd="url(#vo-head)" />

        {/* Infrastructure. */}
        <Layer y={304} h={58} lines={['Infrastructure']} className={styles.layerInfra} />
        {[
          { name: 'Cloud Providers', logos: ['aws.svg', 'azure.svg', 'google-cloud.svg'] },
          { name: 'Kubernetes Clusters', logos: ['k8s.svg'] },
          { name: 'IoT/Edge', dots: true },
        ].map(({ name, logos, dots }, i) => {
          const x = 148 + i * 240;
          return (
            <g key={name}>
              <rect className={styles.card} x={x} y={304} width={224} height={58} rx={10} />
              <text className={styles.infraText} x={x + 14} y={338}>
                {name}
              </text>
              {logos &&
                logos.map((f, k) => (
                  <g key={f}>
                    <rect className={styles.tile} x={x + 196 - (logos.length - 1 - k) * 26} y={321} width={22} height={22} rx={5} />
                    <image href={logo(f)} x={x + 198 - (logos.length - 1 - k) * 26} y={323} width={18} height={18} />
                  </g>
                ))}
              {dots && [0, 1, 2].map((k) => <circle key={k} className={styles.device} cx={x + 172 + k * 16} cy={333} r={5} />)}
            </g>
          );
        })}

        {/* Platform builders provide the infrastructure. */}
        <path className={styles.flow} d="M 414 396 V 365" markerEnd="url(#vo-head)" />
        <Person x={404} y={402} />
        <text className={styles.title} x={434} y={422}>
          Platform Builders
        </text>

        {/* ISV and SaaS owners extend it with addons. */}
        <text className={styles.title} x={944} y={28} textAnchor="end">
          ISV/SaaS Owners
        </text>
        <Person x={802} y={8} />
        <path className={styles.flow} d="M 906 38 V 59" markerEnd="url(#vo-head)" />
        <rect className={styles.card} x={866} y={62} width={78} height={300} rx={10} />
        <rect className={styles.addonsHead} x={866} y={62} width={78} height={30} rx={10} />
        <text className={styles.addonsTitle} x={905} y={82} textAnchor="middle">
          Addons
        </text>
        {ADDONS.map((a, i) => (
          <g key={a}>
            <rect className={styles.chip} x={872} y={100 + i * 28} width={66} height={22} rx={6} />
            <text className={styles.addonText} x={905} y={115 + i * 28} textAnchor="middle">
              {a}
            </text>
          </g>
        ))}
        <path className={styles.flow} d="M 865 227 H 855" markerEnd="url(#vo-head)" />
      </svg>
    </figure>
  );
}
