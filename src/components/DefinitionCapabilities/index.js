import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import Sail from '@site/src/components/home/Sail';
import styles from './styles.module.scss';

const APP = [
  'apiVersion: core.oam.dev/v1beta1',
  'kind: Application',
  'metadata:',
  '  name: my-app',
  'spec:',
  '  components:',
  '    - name: redis',
  '      type: helm',
  '      properties:',
  '        chart: redis-cluster',
  '        version: 6.2.7',
  '        url: https://charts.bitnami.com',
];

// The registered modules: helm is the one the application refers to.
const MODULES = [
  ['webservice', 'component'],
  ['helm', 'component'],
  ['worker', 'component'],
  ['task', 'component'],
  ['scaler', 'trait'],
  ['topology', 'policy'],
  ['deploy', 'workflow'],
  ['git-file', 'source'],
];

const PROVIDERS = [
  { name: 'FluxCD', logo: 'fluxcd.svg', apiVersion: '"helm.toolkit.fluxcd.io/v2"', kind: '"HelmRelease"' },
  { name: 'ArgoCD', logo: 'argo.svg', apiVersion: '"argoproj.io/v1alpha1"', kind: '"Application"' },
];

const ECOSYSTEM = ['helm.png', 'fluxcd.svg', 'argo.svg', 'crossplane.svg', 'terraform.png', 'keda.svg', 'istio.svg', 'prometheus-icon.svg'];

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

// Code colours a line of YAML or CUE: the key, then the rest.
function Code({ x, y, text }) {
  const m = /^(\s*(?:- )?)("?[\w.]+"?)(:)(.*)$/.exec(text);
  if (!m) return <text className={styles.code} x={x} y={y}>{text}</text>;
  return (
    <text className={styles.code} x={x} y={y}>
      {m[1]}
      <tspan className={styles.key}>{m[2]}</tspan>
      {m[3]}
      {m[4]}
    </text>
  );
}

// Panel is an editor window with a title bar.
function Panel({ x, y, w, h, title, children }) {
  return (
    <g>
      <rect className={styles.card} x={x} y={y} width={w} height={h} rx={10} />
      <path className={styles.bar} d={`M ${x} ${y + 26} H ${x + w}`} />
      <text className={styles.file} x={x + w - 12} y={y + 17} textAnchor="end">
        {title}
      </text>
      {children}
    </g>
  );
}

// DefinitionCapabilities shows an end user's application referring to a
// definition by type, the registered definition modules drawn from the CNCF
// ecosystem, and platform builders implementing the same definition with
// different capability providers.
export default function DefinitionCapabilities() {
  const { withBaseUrl } = useBaseUrlUtils();
  const logo = (f) => withBaseUrl(`img/logs/${f}`);
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 932 462"
        role="img"
        aria-label="An end user's OAM Application sets a component's type to helm, which references a registered definition module. Definition modules for components, traits, policies, workflow steps and sources are registered from the CNCF ecosystem. Platform builders implement the helm definition with different capability providers, such as FluxCD's HelmRelease or ArgoCD's Application. OAM Definitions are discoverable, reusable and implementation agnostic modular capabilities.">
        <defs>
          <marker id="dc-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* The end user's application. */}
        <Person x={16} y={10} />
        <text className={styles.title} x={46} y={30}>
          End user
        </text>
        <text className={styles.label} x={16} y={64}>
          OAM APPLICATION
        </text>
        <Panel x={16} y={76} w={292} h={232} title="app.yaml">
          <rect className={styles.highlight} x={109} y={219} width={36} height={18} rx={4} />
          {APP.map((l, i) => (
            <Code key={i} x={28} y={120 + i * 16} text={l} />
          ))}
        </Panel>
        <text className={styles.reference} x={330} y={80}>
          references the definition
        </text>

        {/* The registered definition modules. */}
        <rect className={styles.group} x={336} y={104} width={250} height={196} rx={12} />
        {MODULES.map(([name, kind], i) => (
          <Chip key={name} x={348 + (i % 2) * 120} y={118 + Math.floor(i / 2) * 34} w={106} label={name} kind={kind} />
        ))}
        <Sail className={styles.sail} x={356} y={256} width={22} height={22} />
        <text className={styles.chipText} x={384} y={272}>
          Registered as definitions
        </text>

        {/* The application's type refers to the helm module. */}
        <path className={styles.flow} d="M 146 228 H 312 Q 320 228 320 220 V 96 Q 320 88 328 88 H 513 Q 521 88 521 96 V 115" markerEnd="url(#dc-head)" />

        {/* The CNCF ecosystem they come from. */}
        <rect className={styles.card} x={336} y={340} width={250} height={72} rx={12} />
        <text className={styles.label} x={348} y={360}>
          CNCF ECOSYSTEM
        </text>
        {ECOSYSTEM.map((f, i) => (
          <g key={f}>
            <rect className={styles.tile} x={346 + i * 29} y={370} width={26} height={26} rx={6} />
            <image href={logo(f)} x={349 + i * 29} y={373} width={20} height={20} />
          </g>
        ))}
        <path className={styles.flow} d="M 461 338 V 303" markerEnd="url(#dc-head)" />
        <text className={styles.muted} x={470} y={325}>
          register
        </text>

        {/* Platform builders implement helm with different providers. */}
        <Person x={604} y={10} />
        <text className={styles.title} x={634} y={30}>
          Platform builder
        </text>
        <text className={styles.label} x={604} y={64}>
          OAM DEFINITIONS
        </text>
        {PROVIDERS.map((p, i) => {
          const y = 76 + i * 164;
          const lines = ['"helm": {', '  type: "component"', '}', 'template: output: {', `  apiVersion: ${p.apiVersion}`, `  kind: ${p.kind}`, '}'];
          return (
            <g key={p.name}>
              <Panel x={604} y={y} w={318} h={146} title="helm.cue">
                <rect className={styles.tile} x={612} y={y + 4} width={18} height={18} rx={4} />
                <image href={logo(p.logo)} x={614} y={y + 6} width={14} height={14} />
                <text className={styles.provider} x={636} y={y + 17}>
                  {p.name}
                </text>
                <rect className={styles.band} x={612} y={y + 77} width={302} height={63} rx={5} />
                {lines.map((l, k) => (
                  <Code key={k} x={618} y={y + 44 + k * 15} text={l} />
                ))}
              </Panel>
            </g>
          );
        })}
        <path className={styles.glue} d="M 601 128 H 577" markerEnd="url(#dc-head)" />
        <path className={styles.glue} d="M 601 300 H 599 Q 593 300 593 294 V 143 Q 593 137 587 137 H 577" markerEnd="url(#dc-head)" />

        <text className={styles.caption} x={466} y={448} textAnchor="middle">
          OAM Definitions are discoverable, reusable and implementation agnostic modular capabilities
        </text>
      </svg>
    </figure>
  );
}
