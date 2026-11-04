import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import Sail from '@site/src/components/home/Sail';
import styles from './styles.module.scss';

// The capability templates the platform team registers, by kind.
const TEMPLATES = [
  ['source', 'ConfigMap'],
  ['component', 'Web Service'],
  ['component', 'Cron Job'],
  ['component', 'Database'],
  ['trait', 'Autoscale'],
  ['trait', 'Rollout'],
  ['trait', 'Route'],
  ['policy', 'Topology'],
];

const CAPABILITIES = ['Deployment', 'OpenKruise', 'Istio', 'KEDA', 'Flagger', 'Terraform Controller'];

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

// HowItWorks shows the two roles: the platform team registers capability
// templates and initialises environments, and end users choose templates, fill
// in values and deploy an application, which KubeVela runs on Kubernetes and
// the clouds.
export default function HowItWorks() {
  const { withBaseUrl } = useBaseUrlUtils();
  const k8s = withBaseUrl('img/logs/k8s.svg');
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 960 476"
        role="img"
        aria-label="The platform team enforces best practices and deployment confidence: it registers capability templates as X-Definitions, such as a ConfigMap source, web service, cron job and database components, autoscale, rollout and route traits and a topology policy, and initialises staging and production clusters with addons. End users enjoy a PaaS-like experience: they choose a target environment, choose capability templates, fill in values such as image, replicas and host, and deploy the assembled application. KubeVela on Kubernetes renders it onto capabilities such as Deployment, OpenKruise, Istio, KEDA, Flagger and the Terraform controller, which provisions cloud resources.">
        <defs>
          <marker id="hw-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* The two roles, with what each gets out of it. */}
        <Person x={16} y={148} />
        <text className={styles.role} x={46} y={168}>
          Platform Team
        </text>
        <text className={styles.muted} x={16} y={204}>
          Enforce best practices and
        </text>
        <text className={styles.muted} x={16} y={220}>
          deployment confidence
        </text>
        <Person x={16} y={352} />
        <text className={styles.role} x={46} y={372}>
          End Users
        </text>
        <text className={styles.muted} x={16} y={408}>
          Enjoy a PaaS-like experience
        </text>

        {/* What the platform team registers. */}
        <path className={styles.divider} d="M 212 12 V 464 M 640 12 V 464" />
        <text className={styles.label} x={228} y={30}>
          CAPABILITY TEMPLATES: X-DEFINITIONS
        </text>
        {TEMPLATES.map(([kind, name], i) => (
          <Chip key={name} x={228 + (i % 2) * 196} y={42 + Math.floor(i / 2) * 32} w={186} label={name} kind={kind} />
        ))}
        <path className={styles.flow} d="M 190 182 H 728" markerEnd="url(#hw-head)" />
        <text className={styles.arrowText} x={650} y={174}>
          register
        </text>
        <text className={styles.label} x={228} y={208}>
          INITIALISE ENVIRONMENTS: ADDONS
        </text>
        <Chip x={228} y={218} w={186} label="Staging Cluster" />
        <Chip x={424} y={218} w={186} label="Production Cluster" />

        {/* What end users do. */}
        <text className={styles.label} x={228} y={276}>
          TARGET ENVIRONMENT
        </text>
        <Chip x={228} y={288} w={170} label="Production Cluster" />
        <rect className={styles.dashedBox} x={416} y={262} width={208} height={104} rx={10} />
        <text className={styles.label} x={428} y={280}>
          APPLICATION
        </text>
        <Chip x={428} y={290} w={184} label="Web Service" kind="component" />
        <Chip x={428} y={324} w={184} label="Route" kind="trait" />
        <path className={styles.flow} d="M 190 386 H 728" markerEnd="url(#hw-head)" />
        <text className={styles.arrowText} x={650} y={378}>
          deploy
        </text>
        <text className={styles.muted} x={228} y={414}>
          Choose capability templates, fill in
        </text>
        <text className={styles.muted} x={228} y={430}>
          values and assemble them into an app:
        </text>
        <text className={styles.code} x={228} y={454}>
          image=app  replicas=2  host=myapp.io
        </text>

        {/* KubeVela on Kubernetes renders onto capabilities and the clouds. */}
        <rect className={styles.group} x={730} y={20} width={214} height={380} rx={14} />
        <rect className={styles.tile} x={910} y={26} width={28} height={28} rx={6} />
        <image href={k8s} x={912} y={28} width={24} height={24} />
        <rect className={styles.card} x={742} y={150} width={84} height={240} rx={10} />
        <Chip x={748} y={164} w={72} h={36} label="X-Defs" center />
        <Sail className={styles.sail} x={770} y={240} width={28} height={28} />
        <text className={styles.chipText} x={784} y={286} textAnchor="middle">
          KubeVela
        </text>
        <Chip x={748} y={344} w={72} h={36} label="OAM App" center />
        <path className={styles.flow} d="M 827 270 H 841" markerEnd="url(#hw-head)" />
        {CAPABILITIES.map((c, i) => (
          <g key={c}>
            <rect className={styles.capability} x={844} y={64 + i * 48} width={92} height={34} rx={7} />
            {c === 'Terraform Controller' ? (
              <>
                <text className={styles.capText} x={890} y={78 + i * 48} textAnchor="middle">
                  Terraform
                </text>
                <text className={styles.capText} x={890} y={92 + i * 48} textAnchor="middle">
                  Controller
                </text>
              </>
            ) : (
              <text className={styles.capText} x={890} y={85 + i * 48} textAnchor="middle">
                {c}
              </text>
            )}
          </g>
        ))}

        {/* The Terraform controller provisions cloud resources. */}
        <path className={styles.flow} d="M 890 339 V 413" markerEnd="url(#hw-head)" />
        <rect className={styles.card} x={730} y={416} width={214} height={50} rx={10} />
        <text className={styles.title} x={744} y={446}>
          Clouds
        </text>
        {['SLB', 'RDS', 'ECS'].map((c, i) => (
          <Chip key={c} x={808 + i * 44} y={428} w={38} label={c} center />
        ))}
      </svg>
    </figure>
  );
}
