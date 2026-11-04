import React from 'react';
import styles from './styles.module.scss';

// The sample manifest, one entry per line. A line may start a section, which
// runs until the next section starts.
const LINES = [
  'apiVersion: core.oam.dev/v1beta1',
  'kind: Application',
  'metadata:',
  '  name: shop',
  'spec:',
  ['source', '  sources:'],
  '    - name: settings',
  '      type: configmap-local',
  '      properties:',
  '        name: shop-settings',
  ['component', '  components:'],
  '    - name: frontend',
  '      type: webservice',
  '      properties:',
  '        image: $(source.settings.data.image)',
  '        port: 8000',
  ['trait', '      traits:'],
  '        - type: scaler',
  '          properties:',
  '            replicas: 2',
  '        - type: gateway',
  '          properties:',
  '            domain: shop.example.com',
  ['policy', '  policies:'],
  '    - name: production',
  '      type: topology',
  '      properties:',
  '        clusters: ["prod-eu", "prod-us"]',
  ['workflow', '  workflow:'],
  '    steps:',
  '      - name: deploy',
  '        type: deploy',
  '        properties:',
  '          policies: ["production"]',
];

const CALLOUTS = {
  source: { title: 'Sources', what: 'what it reads', body: ['Values from outside the app,', 'here a ConfigMap'], side: 'left' },
  component: { title: 'Components', what: 'what to run', body: ['Images, Helm charts,', 'cloud services'], side: 'right' },
  trait: { title: 'Traits', what: 'how it behaves', body: ['Scaling, gateways and', 'storage, per component'], side: 'left' },
  policy: { title: 'Policies', what: 'where it runs', body: ['Clusters, overrides,', 'security, for the whole app'], side: 'right' },
  workflow: { title: 'Workflow', what: 'how it rolls out', body: ['Deploy, approve, notify,', 'in order or as a DAG'], side: 'left' },
};

const PANEL = { x: 196, y: 10, w: 368 };
const CARD_W = 166;
const TOP = PANEL.y + 44;
const STEP = 14;
const lineY = (i) => TOP + i * STEP;

// sections works out each section's first and last line.
function sections() {
  const out = [];
  LINES.forEach((l, i) => {
    if (Array.isArray(l)) out.push({ kind: l[0], from: i, to: LINES.length - 1 });
    if (out.length > 1 && Array.isArray(l)) out[out.length - 2].to = i - 1;
  });
  return out;
}

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

// Line colours a YAML line: the key, then its value, with a source read
// picked out.
function Line({ text, y }) {
  const m = /^(\s*(?:- )?)([\w.]+)(:)(.*)$/.exec(text);
  if (!m) return <text className={styles.code} x={PANEL.x + 40} y={y}>{text}</text>;
  const [, lead, key, colon, rest] = m;
  const read = /\$\(source\.[^)]*\)/.exec(rest);
  return (
    <text className={styles.code} x={PANEL.x + 40} y={y}>
      {lead}
      <tspan className={styles.key}>{key}</tspan>
      {colon}
      {read ? (
        <>
          {rest.slice(0, read.index)}
          <tspan className={styles.read}>{read[0]}</tspan>
          {rest.slice(read.index + read[0].length)}
        </>
      ) : (
        rest
      )}
    </text>
  );
}

// ApplicationModel is an Application manifest with each section called out:
// what it reads, what to run, how it behaves, where it runs and how it rolls
// out.
export default function ApplicationModel() {
  const secs = sections();
  const height = lineY(LINES.length) + 6 - PANEL.y;
  const readLine = LINES.findIndex((l) => typeof l === 'string' && l.includes('$(source'));
  const src = secs.find((s) => s.kind === 'source');
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox={`0 0 760 ${height + 20}`}
        role="img"
        aria-label="An Application manifest with its sections called out: sources are what it reads, components what to run, traits how each component behaves, policies where it runs and the workflow how it rolls out. The frontend component reads its image from a ConfigMap through a source.">
        <rect className={styles.panel} x={PANEL.x} y={PANEL.y} width={PANEL.w} height={height} rx={12} />
        <path className={styles.bar} d={`M ${PANEL.x} ${PANEL.y + 26} H ${PANEL.x + PANEL.w}`} />
        {[0, 1, 2].map((d) => (
          <circle key={d} className={styles.dot} cx={PANEL.x + 16 + d * 12} cy={PANEL.y + 13} r={4} />
        ))}
        <text className={styles.file} x={PANEL.x + PANEL.w / 2} y={PANEL.y + 17} textAnchor="middle">
          app.yaml
        </text>

        {secs.map((s) => {
          const y0 = lineY(s.from) - 11;
          const y1 = lineY(s.to) + 5;
          const c = CALLOUTS[s.kind];
          const mid = (y0 + y1) / 2;
          const left = c.side === 'left';
          const cx = left ? 12 : 760 - 12 - CARD_W;
          return (
            <g key={s.kind}>
              <rect className={styles.band} x={PANEL.x + 8} y={y0} width={PANEL.w - 16} height={y1 - y0} rx={6} />
              <rect className={styles.edge} x={PANEL.x + 8} y={y0} width={3} height={y1 - y0} rx={1.5} />
              <rect className={styles.card} x={cx} y={mid - 40} width={CARD_W} height={80} rx={10} />
              <Mark kind={s.kind} x={cx + 12} y={mid - 29} />
              <text className={styles.title} x={cx + 30} y={mid - 19}>
                {c.title}
              </text>
              <text className={styles.what} x={cx + 30} y={mid - 5}>
                {c.what}
              </text>
              {c.body.map((b, k) => (
                <text key={k} className={styles.body} x={cx + 12} y={mid + 15 + k * 14}>
                  {b}
                </text>
              ))}
              <path
                className={styles.flow}
                d={left ? `M ${cx + CARD_W + 1} ${mid} H ${PANEL.x - 3}` : `M ${cx - 1} ${mid} H ${PANEL.x + PANEL.w + 3}`}
                markerEnd="url(#am-head)"
              />
            </g>
          );
        })}

        {/* The image is read from the source: a dashed link back up to it. */}
        <path
          className={styles.reads}
          d={`M ${PANEL.x + PANEL.w - 18} ${lineY(readLine) - 12} V ${lineY(src.to) - 2}`}
          markerEnd="url(#am-head)"
        />
        <text className={styles.readsLabel} x={PANEL.x + PANEL.w - 24} y={(lineY(readLine) + lineY(src.to)) / 2 + 2} textAnchor="end">
          reads
        </text>

        {LINES.map((l, i) => {
          const text = Array.isArray(l) ? l[1] : l;
          return (
            <g key={i}>
              <text className={styles.num} x={PANEL.x + 30} y={lineY(i)} textAnchor="end">
                {i + 1}
              </text>
              <Line text={text} y={lineY(i)} />
            </g>
          );
        })}

        <defs>
          <marker id="am-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>
      </svg>
    </figure>
  );
}
