import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import useBaseUrl from '@docusaurus/useBaseUrl';
import KindIcon from './KindIcon';
import Sail from './Sail';
import usePlayOnce from './usePlayOnce';

// The feature drawings share one vocabulary with the hero's: cards, a blue
// accent for what moves, green for what is healthy. Each plays once as it
// scrolls into view and stays on its last frame.

const Svg = React.forwardRef(({ children }, ref) => (
  <svg ref={ref} className="dg" viewBox="0 0 320 190" aria-hidden="true">
    {children}
  </svg>
));

const Flow = ({ d, on }) => (
  <>
    <path className="dg-edge" d={d} />
    <path className={clsx('dg-flow', { on })} d={d} pathLength={1} />
  </>
);

const Label = ({ x, y, children, kind = '', anchor }) => (
  <text className={clsx('dg-text', kind)} x={x} y={y} textAnchor={anchor}>
    {children}
  </text>
);

// OamDiagram: the OAM spec and an Application build up side by side. Each
// kind is written into the spec, then an arrow carries it across and its
// pieces appear in the Application: components, traits, workflow. Then
// KubeVela adds sources and policies, each marked with a plus. Each row of
// the Application says what its kind is for.
export function OamDiagram() {
  const [ref, phase] = usePlayOnce(22, 380);
  const oamLogo = useBaseUrl('img/oam.svg');
  const on = (k) => phase >= k;
  const rows = [
    { y: 42, label: 'sources', what: 'what it reads' },
    { y: 80, label: 'components', what: 'what to run' },
    { y: 118, label: 'traits', what: 'how it behaves' },
    { y: 156, label: 'policies', what: 'where it runs' },
    { y: 194, label: 'workflow', what: 'how it rolls out' },
  ];
  // Each kind from the spec: where it is written, the row label its arrow
  // points at (the kind, not its instances), and
  // its phases (written, arrow drawn and pieces shown, arrow gone).
  const carried = [
    { kind: 'component', name: 'components', y: 70, to: [146, 87], at: 1 },
    { kind: 'trait', name: 'traits', y: 116, to: [146, 125], at: 5 },
    { kind: 'workflow', name: 'workflow', y: 162, to: [146, 201], at: 9 },
  ];
  const Chip = ({ x, y, w, kind, name }) => (
    <>
      <rect className="dg-block" x={x} y={y} width={w} height="20" rx="6" />
      <KindIcon kind={kind} x={x + 6} y={y + 5} />
      <Label x={x + 21} y={y + 13.5}>
        {name}
      </Label>
    </>
  );
  // Plus marks a kind KubeVela adds to the spec, before its row's label.
  const Plus = ({ x, y, show }) => (
    <g className={clsx('dg-component', { on: show })}>
      <circle className="dg-kv-tag" cx={x} cy={y + 7} r="5" />
      <path className="dg-kv-plus" d={`M ${x - 2.5} ${y + 7} h 5 M ${x} ${y + 4.5} v 5`} />
    </g>
  );
  return (
    <svg ref={ref} className="dg" viewBox="0 0 440 252" aria-hidden="true">
      {/* The spec links to oam.dev; the card's text carries the same link for
          keyboards and screen readers, so this one is out of the tab order. */}
      <a href="https://oam.dev" target="_blank" rel="noopener noreferrer" tabIndex={-1} className="dg-spec-link">
      <g className="dg-card dg-spec">
        <path d="M 6 26 h 82 l 16 16 v 184 h -98 Z" />
        <path className="dg-fold" d="M 88 26 v 16 h 16" />
        <Label x={16} y={48} kind="strong">
          OAM Spec
        </Label>
        <image href={oamLogo} x="70" y="204" width="28" height="16" />
        {carried.map((c) => (
          <g key={c.kind} className={clsx('dg-component', { on: on(c.at) })}>
            <KindIcon kind={c.kind} x={16} y={c.y} />
            <Label x={31} y={c.y + 8.5}>
              {c.name}
            </Label>
            <rect className="dg-line" x="16" y={c.y + 18} width="72" height="4" rx="2" />
            <rect className="dg-line" x="16" y={c.y + 27} width="54" height="4" rx="2" />
          </g>
        ))}
      </g>

      </a>

      <g className={clsx('dg-card dg-app', { on: on(22) })}>
        <rect x="124" y="6" width="310" height="240" rx="12" />
        <Label x={136} y={26} kind="strong">
          Application
        </Label>
        <Label x={204} y={26} kind="muted">
          core.oam.dev/v1beta1
        </Label>
        <Sail className="dg-sail" x="404" y="214" width="24" height="24" />
        {rows.map((r) => (
          <g key={r.label}>
            <text className="dg-text stage dg-row-label" x="150" y={r.y + 10}>
              {r.label}
            </text>
            <text className="dg-text muted dg-row-what" x="150" y={r.y + 20}>
              {r.what}
            </text>
          </g>
        ))}
      </g>

      {carried.map((c) => {
        const [x2, y2] = c.to;
        const y1 = c.y + 5;
        const d = `M 92 ${y1} C 122 ${y1}, 112 ${y2}, ${x2 - 6} ${y2}`;
        return (
          <g key={c.kind} className={clsx('dg-carry', { gone: on(c.at + 3) })}>
            <path className={clsx('dg-flow', { on: on(c.at + 1) })} d={d} pathLength={1} />
            <path
              className={clsx('dg-carry-head', { on: on(c.at + 1) })}
              d={`M ${x2 - 6} ${y2 - 3.5} L ${x2} ${y2} L ${x2 - 6} ${y2 + 3.5} Z`}
            />
          </g>
        );
      })}

      <g className={clsx('dg-component', { on: on(2) })}>
        <Chip x={232} y={80} w={72} kind="component" name="api" />
      </g>
      <g className={clsx('dg-component', { on: on(3) })}>
        <Chip x={308} y={80} w={72} kind="component" name="db" />
      </g>
      <g className={clsx('dg-component', { on: on(6) })}>
        <Chip x={232} y={118} w={72} kind="trait" name="scaler" />
        <Chip x={308} y={118} w={72} kind="trait" name="gateway" />
      </g>
      {/* Each trait points up to its badge on api's bottom-right corner. */}
      {[
        { from: [268, 118], to: [288, 104], at: 7 },
        { from: [344, 118], to: [297, 104], at: 8 },
      ].map(({ from, to, at }, i) => (
        <g key={i}>
          <path
            className={clsx('dg-flow dg-trait-link', { on: on(at) })}
            d={`M ${from[0]} ${from[1]} C ${from[0]} ${from[1] - 8}, ${to[0]} ${to[1] + 10}, ${to[0]} ${to[1] + 3}`}
            pathLength={1}
          />
          <path
            className={clsx('dg-carry-head', { on: on(at) })}
            d={`M ${to[0] - 3} ${to[1] + 4} L ${to[0]} ${to[1] - 0.5} L ${to[0] + 3} ${to[1] + 4} Z`}
          />
          <g className={clsx('dg-component', { on: on(at) })}>
            <circle className="dg-trait-corner" cx={to[0]} cy={to[1] - 4} r="4" />
          </g>
        </g>
      ))}
      {['deploy', 'approve', 'promote'].map((name, i) => {
        const x = 244 + i * 56;
        return (
          <g key={name} className={clsx('dg-component', { on: on(10) })}>
            <g className={clsx('dg-step', { on: on(11 + i) })}>
              <circle cx={x} cy="202" r="7" />
              <path d={`M ${x - 3.5} 202 l 2.2 2.2 l 4 -4.4`} />
            </g>
            <Label x={x} y={224} anchor="middle">
              {name}
            </Label>
          </g>
        );
      })}
      {[0, 1].map((i) => (
        <path
          key={i}
          className={clsx('dg-flow', { on: on(12 + i) })}
          d={`M ${251 + i * 56} 202 H ${293 + i * 56}`}
          pathLength={1}
        />
      ))}

      <Plus x={141} y={42} show={on(15)} />
      <g className={clsx('dg-component', { on: on(16) })}>
        <Chip x={232} y={42} w={72} kind="source" name="config" />
      </g>
      <Plus x={141} y={156} show={on(18)} />
      <g className={clsx('dg-component', { on: on(19) })}>
        <Chip x={232} y={156} w={72} kind="policy" name="topology" />
      </g>
      <g className={clsx('dg-component', { on: on(20) })}>
        <Chip x={308} y={156} w={72} kind="policy" name="override" />
      </g>
    </svg>
  );
}

// CuexDiagram: a definition's calls go through CueX, which proxies them to
// your own package servers and, for built-in packages, to the Kubernetes API;
// the responses come back through CueX and fill in the definition.
export function CuexDiagram() {
  const [ref, phase] = usePlayOnce(5, 450);
  const on = (k) => phase >= k;
  const servers = [
    { y: 26, w: 40 },
    { y: 72, w: 30 },
  ];
  return (
    <Svg ref={ref}>
      <Label x={226} y={18} kind="stage">
        your servers
      </Label>
      <Label x={226} y={130} kind="stage">
        built-in
      </Label>
      <Flow d="M 100 88 H 128" on={on(1)} />
      <Flow d="M 192 88 C 208 88, 208 45, 224 45" on={on(2)} />
      <Flow d="M 192 96 C 208 96, 208 157, 224 157" on={on(2)} />
      <path className={clsx('dg-flow dg-return', { on: on(4) })} d="M 128 102 H 100" pathLength={1} />
      <g className={clsx('dg-card dg-app', { on: on(5) })}>
        <rect x="6" y="46" width="94" height="98" rx="11" />
        <KindIcon kind="workflow" x={16} y={57} size={14} />
        <rect className="dg-line strong" x="36" y="61" width="48" height="6" rx="3" />
        <rect className="dg-line" x="16" y="80" width="70" height="5" rx="2.5" />
        {[94, 116].map((y, i) => (
          <rect
            key={y}
            className={clsx('dg-slot-fill', { on: on(5) })}
            x="16"
            y={y}
            width="76"
            height="16"
            rx="5"
            style={{ transitionDelay: `${i * 150}ms` }}
          />
        ))}
      </g>
      <g className={clsx('dg-card dg-app', { on: on(1) })}>
        <rect x="128" y="66" width="64" height="58" rx="11" />
        <Label x={160} y={99} kind="strong" anchor="middle">
          CueX
        </Label>
      </g>
      {servers.map((sv, i) => (
        <g key={sv.y} className={clsx('dg-card dg-resource', { on: i === 0 && on(3) })}>
          <rect x="224" y={sv.y} width="90" height="38" rx="9" />
          <circle className="dg-dot" cx="236" cy={sv.y + 19} r="4" />
          <rect className="dg-line strong" x="246" y={sv.y + 12} width={sv.w} height="5" rx="2.5" />
          <rect className="dg-line" x="246" y={sv.y + 22} width={sv.w + 14} height="4" rx="2" />
        </g>
      ))}
      <g className={clsx('dg-card dg-resource', { on: on(3) })}>
        <rect x="224" y="138" width="90" height="38" rx="9" />
        <circle className="dg-dot" cx="236" cy="157" r="4" />
        <Label x={246} y={155} kind="strong">
          Kubernetes
        </Label>
        <Label x={246} y={166} kind="muted">
          API server
        </Label>
      </g>
    </Svg>
  );
}

// BlocksDiagram: KubeVela Definitions on the left are the parts an
// application on the right is assembled from: a source, components and a
// trait.
export function BlocksDiagram() {
  const [ref, phase] = usePlayOnce(6);
  const on = (k) => phase >= k;
  const defs = [
    { y: 22, name: 'config', kind: 'source' },
    { y: 77, name: 'webservice', kind: 'component' },
    { y: 132, name: 'scaler', kind: 'trait' },
  ];
  const blocks = [
    { y: 46, name: 'settings', kind: 'source', traits: 0, phase: 2 },
    { y: 88, name: 'api', kind: 'component', traits: 1, phase: 3, clip: 4 },
    { y: 130, name: 'web', kind: 'component', traits: 1, phase: 5, clip: 5 },
  ];
  return (
    <Svg ref={ref}>
      {defs.map((d) => (
        <Flow key={d.y} d={`M 126 ${d.y + 18} C 151 ${d.y + 18}, 151 95, 176 95`} on={on(1)} />
      ))}
      {defs.map((d) => (
        <g key={d.name} className="dg-card">
          <rect x="8" y={d.y} width="118" height="36" rx="9" />
          <KindIcon kind={d.kind} x={18} y={d.y + 11} size={14} />
          <Label x={40} y={d.y + 16} kind="strong">
            {d.name}
          </Label>
          <Label x={40} y={d.y + 28} kind="muted">
            {d.kind}
          </Label>
        </g>
      ))}
      <g className={clsx('dg-card dg-app', { on: on(6) })}>
        <rect x="176" y="12" width="136" height="166" rx="12" />
        <Label x={190} y={32} kind="strong">
          payments
        </Label>
        {blocks.map((b) => (
          <g key={b.name} className={clsx('dg-component', { on: on(b.phase) })}>
            <rect className="dg-block" x="188" y={b.y} width="96" height="30" rx="7" />
            <KindIcon kind={b.kind} x={196} y={b.y + 8} size={14} />
            <Label x={218} y={b.y + 19}>
              {b.name}
            </Label>
            {Array.from({ length: b.traits }, (_, t) => (
              <rect
                key={t}
                className={clsx('dg-trait', { on: on(b.clip) })}
                x="288"
                y={b.traits === 1 ? b.y + 10 : b.y + 4 + t * 13}
                width="13"
                height="10"
                rx="5"
              />
            ))}
          </g>
        ))}
      </g>
    </Svg>
  );
}

// formCode is the self-service drawing's definition: typed in Go with defkit,
// then shown as the CUE it generates.
const formCode = {
  cue: ['parameter: {', '  image:    string', '  replicas: *1 | int', '}'],
  go: ['defkit.NewComponent("web").', '  Params(', '    defkit.String("image"),', '    defkit.Int("replicas").', '      Default(1),', '  )'],
};

// typedLength is how many characters of the lines are typed by time t (ms),
// at a character every perChar ms.
const typedLength = (t, perChar) => Math.max(0, Math.floor(t / perChar));

// TypedLines draws code lines up to n characters, with a cursor at the end
// while it types.
const TypedLines = ({ lines, n, x, y, typing }) => {
  let left = n;
  return lines.map((line, i) => {
    const shown = line.slice(0, Math.max(0, left));
    const cursor = typing && left >= 0 && left <= line.length;
    left -= line.length + 1;
    return (
      <text key={i} className="dg-code dg-code-typed" x={x} y={y + i * 12}>
        {colourise(shown)}
        {cursor && <tspan className="dg-cursor">|</tspan>}
      </text>
    );
  });
};

// colourise marks keys, types and strings in a line of CUE or Go.
function colourise(line) {
  const parts = line.split(/("[^"]*"?|\b(?:string|int|Default|Params|NewComponent|String|Int)\b|^\s*[a-z]+:)/);
  return parts.map((p, i) =>
    p.startsWith('"') ? (
      <tspan key={i} className="t">
        {p}
      </tspan>
    ) : /^(string|int)$/.test(p) ? (
      <tspan key={i} className="t">
        {p}
      </tspan>
    ) : /:$/.test(p) || /^[A-Z]/.test(p) ? (
      <tspan key={i} className="k">
        {p}
      </tspan>
    ) : (
      p
    ),
  );
}

// FormDiagram: a definition's parameters are typed in Go with defkit and
// shown as the CUE they generate; KubeVela turns them into an OpenAPI schema,
// VelaUX turns the schema into a form, and a team fills it in and deploys.
export function FormDiagram() {
  const [ref, visible] = usePlayOnce(1);
  const [t, setT] = useState(0);
  const goChars = formCode.go.join('\n').length;
  const goStart = 300;
  const perChar = 16;
  const goEnd = goStart + goChars * perChar;
  // lineDone is when line k of the Go has been typed: a parameter appears in
  // the schema as soon as its line is finished.
  const lineDone = (k) => goStart + (formCode.go.slice(0, k + 1).join('\n').length + 1) * perChar;
  // Once the Go is typed, the form shows empty and the CUE tab shows what
  // defkit generated; then the form fills and Deploy is clicked.
  const formAt = goEnd + 300;
  const cueAt = goEnd + 500;
  const end = formAt + 3600;
  useEffect(() => {
    if (!visible) {
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setT(end);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      const now = Date.now() - start;
      setT(Math.min(now, end));
      if (now >= end) {
        clearInterval(timer);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [visible, end]);
  const tab = t < cueAt ? 'go' : 'cue';
  const at = (ms) => t >= ms;
  const fields = [
    ['image', 'web:v2'],
    ['replicas', '3'],
  ];
  return (
    <Svg ref={ref}>
      <g className="dg-codecard">
        <rect x="4" y="16" width="152" height="158" rx="10" />
        {[
          ['go', 'Go · defkit', 6, 64],
          ['cue', 'CUE', 72, 38],
        ].map(([key, label, x, w]) => (
          <g key={key} className={clsx('dg-tab', { on: tab === key })}>
            <rect x={x + 6} y="22" width={w} height="16" rx="5" />
            <text x={x + 6 + w / 2} y="33" textAnchor="middle">
              {label}
            </text>
          </g>
        ))}
        {tab === 'go' ? (
          <TypedLines lines={formCode.go} n={typedLength(t - goStart, 16)} x={14} y={56} typing={t < goEnd} />
        ) : (
          <g className="dg-generated">
            <TypedLines lines={formCode.cue} n={999} x={14} y={56} typing={false} />
            <text className="dg-code dg-code-typed dg-note" x="14" y="160">
              generated by defkit
            </text>
          </g>
        )}
      </g>
      <Flow d="M 156 95 H 168" on={at(lineDone(2) - 200)} />
      <g className={clsx('dg-card dg-app', { on: at(lineDone(4)) })}>
        <rect x="168" y="50" width="66" height="90" rx="10" />
        <Label x={176} y={66} kind="strong">
          OpenAPI
        </Label>
        <Label x={176} y={77} kind="muted">
          v3 schema
        </Label>
        {[
          ['image', 'string'],
          ['replicas', 'integer'],
        ].map(([k, v], i) => (
          <g key={k} className={clsx('dg-component', { on: at(lineDone(i === 0 ? 2 : 4)) })}>
            <rect className="dg-block" x="174" y={86 + i * 24} width="54" height="20" rx="5" />
            <text className="dg-code dg-code-typed" x="178" y={95 + i * 24}>
              <tspan className="k">{k}</tspan>
            </text>
            <text className="dg-code dg-code-typed" x="178" y={103 + i * 24}>
              <tspan className="t">{v}</tspan>
            </text>
          </g>
        ))}
      </g>
      <Flow d="M 234 95 H 244" on={at(formAt - 200)} />
      <g className={clsx('dg-card dg-app', { on: at(formAt + 2000) })}>
        <rect x="244" y="16" width="72" height="158" rx="10" />
        {fields.map(([label, value], i) => (
          <g key={label} className={clsx('dg-component', { on: at(formAt + i * 150) })}>
            <Label x={252} y={38 + i * 42} kind="muted">
              {label}
            </Label>
            <rect className="dg-input" x="251" y={43 + i * 42} width="58" height="18" rx="5" />
            <text className={clsx('dg-text dg-value', { on: at(formAt + 900 + i * 350) })} x="255" y={55 + i * 42}>
              {value}
            </text>
          </g>
        ))}
        <g className={clsx('dg-button', { on: at(formAt + 1800), pressed: at(formAt + 2600), done: at(formAt + 2800) })}>
          <rect x="251" y="146" width="58" height="18" rx="6" />
          <text x="280" y="158" textAnchor="middle">
            {at(formAt + 2800) ? 'Deployed' : 'Deploy'}
          </text>
        </g>
      </g>
      <g
        className={clsx('dg-pointer', { shown: at(formAt + 1800) })}
        style={{ transform: at(formAt + 2200) ? 'translate(298px, 158px)' : 'translate(296px, 118px)' }}
      >
        <path d="M 0 0 L 0 11 L 3 8 L 5.5 13 L 7.5 12 L 5 7 L 9 7 Z" />
      </g>
    </Svg>
  );
}

// DeliverDiagram: an application's workflow rolls it out to three clusters.
export function DeliverDiagram() {
  const [ref, phase] = usePlayOnce(6);
  const on = (k) => phase >= k;
  const steps = [112, 140, 168];
  const clusters = [
    { top: 18, name: 'staging', pods: 2 },
    { top: 72, name: 'prod-eu', pods: 5 },
    { top: 126, name: 'prod-us', pods: 4 },
  ];
  return (
    <Svg ref={ref}>
      <path className="dg-edge" d="M 80 95 H 175" />
      <path className={clsx('dg-flow', { on: on(1) })} d="M 80 95 H 105" pathLength={1} />
      <path className={clsx('dg-flow', { on: on(3) })} d="M 119 95 H 133" pathLength={1} />
      <path className={clsx('dg-flow', { on: on(4) })} d="M 147 95 H 161" pathLength={1} />
      {clusters.map((c) => (
        <Flow key={c.top} d={`M 175 95 C 192 95, 192 ${c.top + 23}, 206 ${c.top + 23}`} on={on(5)} />
      ))}
      <g className="dg-card dg-app on">
        <rect x="8" y="70" width="72" height="50" rx="10" />
        {[16, 30, 44].map((x) => (
          <rect key={x} className="dg-type" x={x} y="80" width="10" height="10" rx="2.5" />
        ))}
        <rect className="dg-line strong" x="16" y="100" width="40" height="6" rx="3" />
      </g>
      {steps.map((x, i) => (
        <g key={x} className={clsx('dg-step', { on: on(2 + i) })}>
          <circle cx={x} cy="95" r="7" />
          <path d={`M ${x - 3} 95 l 2.2 2.2 l 4 -4.4`} />
        </g>
      ))}
      {clusters.map((c, ci) => (
        <g key={c.top} className={clsx('dg-card dg-cluster', { on: on(6) })}>
          <rect x="206" y={c.top} width="106" height="46" rx="10" />
          <circle className="dg-dot" cx="218" cy={c.top + 14} r="4" />
          <Label x={228} y={c.top + 17} kind="strong">
            {c.name}
          </Label>
          {Array.from({ length: c.pods }, (_, p) => (
            <rect
              key={p}
              className="dg-pod"
              x={214 + p * 13}
              y={c.top + 26}
              width="9"
              height="9"
              rx="2.5"
              style={{ transitionDelay: `${ci * 120 + p * 60}ms` }}
            />
          ))}
        </g>
      ))}
    </Svg>
  );
}

// InfraDiagram: an application's components are wired to the cloud resources
// provisioned alongside them.
export function InfraDiagram() {
  const [ref, phase] = usePlayOnce(4);
  const on = (k) => phase >= k;
  const resources = [
    { top: 14, name: 'orders-db', kind: 'rds-postgres', from: 84 },
    { top: 73, name: 'assets', kind: 's3-bucket', from: 84 },
    { top: 132, name: 'events', kind: 'sqs-queue', from: 120 },
  ];
  return (
    <Svg ref={ref}>
      {resources.map((r) => (
        <Flow key={r.top} d={`M 114 ${r.from} C 153 ${r.from}, 153 ${r.top + 22}, 192 ${r.top + 22}`} on={on(1)} />
      ))}
      <g className="dg-card dg-app on">
        <rect x="8" y="40" width="118" height="110" rx="12" />
        <Label x={20} y={60} kind="strong">
          orders
        </Label>
        {[
          [70, 'api'],
          [106, 'worker'],
        ].map(([y, name]) => (
          <g key={name}>
            <rect className="dg-block" x="18" y={y} width="96" height="28" rx="7" />
            <rect className="dg-type" x="26" y={y + 7} width="14" height="14" rx="3.5" />
            <Label x={48} y={y + 18}>
              {name}
            </Label>
          </g>
        ))}
      </g>
      {resources.map((r, i) => (
        <g key={r.top} className={clsx('dg-card dg-resource', { on: on(2 + i) })}>
          <rect x="192" y={r.top} width="120" height="44" rx="10" />
          <rect className="dg-cloud" x="202" y={r.top + 12} width="20" height="20" rx="6" />
          <Label x={230} y={r.top + 19} kind="strong">
            {r.name}
          </Label>
          <Label x={230} y={r.top + 32} kind="muted">
            {r.kind}
          </Label>
          <circle className="dg-dot" cx="300" cy={r.top + 22} r="4" />
        </g>
      ))}
    </Svg>
  );
}

// health maps a state to its pill's colour class and label.
const health = {
  pending: ['', 'Pending'],
  progressing: ['wait', 'Progressing'],
  healthy: ['ok', 'Healthy'],
};

const Pill = ({ x, y, state, width = 66 }) => {
  const [kind, label] = health[state];
  return (
    <g className={clsx('dg-pill', kind)}>
      <rect x={x} y={y} width={width} height="16" rx="8" />
      <circle className="dg-pill-dot" cx={x + 10} cy={y + 8} r="3" />
      <text x={x + 17} y={y + 11.5}>
        {label}
      </text>
    </g>
  );
};

// healthRows are the application's components, each with its timeline: from
// a phase on, the component's state and the state of its two clusters' dots.
const healthRows = [
  {
    name: 'api',
    detail: 'webservice',
    timeline: [
      [1, 'pending', ['', '']],
      [4, 'progressing', ['ok', 'wait']],
      [5, 'healthy', ['ok', 'ok']],
    ],
  },
  {
    name: 'web',
    detail: 'webservice',
    timeline: [
      [2, 'pending', ['', '']],
      [5, 'progressing', ['ok', 'wait']],
      [7, 'healthy', ['ok', 'ok']],
    ],
  },
  {
    name: 'payments-db',
    detail: 'postgres',
    timeline: [
      [3, 'pending', ['', '']],
      [6, 'progressing', ['wait', '']],
      [7, 'progressing', ['ok', 'wait']],
      [8, 'healthy', ['ok', 'ok']],
    ],
  },
];
const healthLast = 8;

// HealthDiagram: an application's health, component by component across two
// clusters, as VelaUX shows it, as each comes up healthy.
export function HealthDiagram() {
  const [ref, phase] = usePlayOnce(healthLast, 450);
  const now = (row) => row.timeline.filter(([from]) => phase >= from).pop();
  const rows = healthRows.map((r) => ({ ...r, at: now(r) }));
  const states = rows.map((r) => (r.at ? r.at[1] : null));
  const healthyCount = states.filter((st) => st === 'healthy').length;
  const appState = healthyCount === rows.length ? 'healthy' : phase >= 1 ? 'progressing' : 'pending';
  return (
    <Svg ref={ref}>
      <g className="dg-card dg-panel">
        <rect x="8" y="8" width="304" height="174" rx="12" />
        <Label x={22} y={33} kind="title">
          payments
        </Label>
        <Pill x={92} y={21} state={appState} width={72} />
        <Label x={172} y={33} kind="muted">
          {`${healthyCount}/${rows.length} components healthy`}
        </Label>
        {rows.map((r, i) => {
          const y = 50 + i * 42;
          const [state, dots] = r.at ? [r.at[1], r.at[2]] : ['pending', ['', '']];
          return (
            <g key={r.name} className={clsx('dg-component dg-row', state, { on: !!r.at })}>
              <rect className="dg-block" x="18" y={y} width="284" height="34" rx="8" />
              <rect className="dg-type" x="28" y={y + 10} width="14" height="14" rx="3.5" />
              <Label x={50} y={y + 15} kind="strong">
                {r.name}
              </Label>
              <Label x={50} y={y + 27} kind="muted">
                {r.detail}
              </Label>
              {dots.map((d, c) => (
                <circle key={c} className={clsx('dg-dot', d)} cx={186 + c * 12} cy={y + 17} r="3.5" />
              ))}
              <Pill x={218} y={y + 9} state={state} width={76} />
            </g>
          );
        })}
      </g>
    </Svg>
  );
}

// addonKinds are what each addon in the registry brings; the last stays
// uninstalled.
const addonKinds = [
  ['source', 'component', 'trait'],
  ['policy', 'workflow', 'trait'],
  ['component', 'workflow', 'source'],
  ['trait', 'component'],
];
const shelves = [
  ['source', 'sources'],
  ['component', 'components'],
  ['trait', 'traits'],
  ['policy', 'policies'],
  ['workflow', 'workflow steps'],
];
const installedAddons = 3;

// AddonsDiagram: addons from a registry bring KubeVela Definitions of every
// kind into KubeVela, one addon at a time.
export function AddonsDiagram() {
  const [ref, phase] = usePlayOnce(installedAddons * 2, 450);
  const on = (k) => phase >= k;
  const tileY = (i) => 36 + i * 36;
  const shelfY = (k) => 34 + k * 29;
  // Each installed addon's icons take the next free slot on their kind's shelf.
  const filled = Object.fromEntries(shelves.map(([kind]) => [kind, 0]));
  const copies = addonKinds.slice(0, installedAddons).flatMap((kinds, i) =>
    kinds.map((kind, j) => {
      const shelf = shelves.findIndex(([k]) => k === kind);
      const slot = filled[kind]++;
      return {
        key: `${i}-${j}`,
        kind,
        to: [248 + slot * 15, shelfY(shelf) + 7],
        from: [26 + j * 15, tileY(i) + 15],
        spawn: 1 + i * 2,
        place: 2 + i * 2,
      };
    }),
  );
  return (
    <Svg ref={ref}>
      <g className="dg-card">
        <rect x="8" y="10" width="118" height="170" rx="12" />
        <Label x={18} y={27} kind="stage">
          registry
        </Label>
        {addonKinds.map((kinds, i) => {
          const y = tileY(i);
          const state = i >= installedAddons ? '' : on(2 + i * 2) ? 'ok' : on(1 + i * 2) ? 'wait' : '';
          return (
            <g key={i} className={clsx('dg-row', { installed: state === 'ok' })}>
              <rect className="dg-block" x="16" y={y} width="102" height="30" rx="7" />
              <rect className="dg-line strong" x="26" y={y + 7} width={[38, 30, 44, 34][i]} height="5" rx="2.5" />
              <circle className={clsx('dg-dot', state)} cx="108" cy={y + 9.5} r="3.2" />
              {kinds.map((kind, j) => (
                <KindIcon key={j} kind={kind} x={26 + j * 15} y={y + 15} />
              ))}
            </g>
          );
        })}
      </g>
      <g className={clsx('dg-card dg-app', { on: on(installedAddons * 2) })}>
        <rect x="140" y="10" width="172" height="170" rx="12" />
        <Label x={150} y={27} kind="stage">
          kubevela
        </Label>
        {shelves.map(([kind, label], k) => (
          <g key={kind}>
            <rect className="dg-slot" x="148" y={shelfY(k)} width="156" height="24" rx="7" />
            <Label x={157} y={shelfY(k) + 15} kind="muted">
              {label}
            </Label>
          </g>
        ))}
      </g>
      {copies.map((c) => (
        <g
          key={c.key}
          className={clsx('dg-instance', { spawned: on(c.spawn), placed: on(c.place) })}
          style={{ transform: on(c.place) ? 'none' : `translate(${c.from[0] - c.to[0]}px, ${c.from[1] - c.to[1]}px)` }}
        >
          <KindIcon kind={c.kind} x={c.to[0]} y={c.to[1]} />
        </g>
      ))}
    </Svg>
  );
}
