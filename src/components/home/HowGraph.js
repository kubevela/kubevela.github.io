import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { translate } from '@docusaurus/Translate';
import KindIcon from './KindIcon';
import usePlayOnce from './usePlayOnce';

// defs are the KubeVela Definitions a platform team authors.
const defs = [
  { name: 'config', kind: 'source', code: [38, 46, 28] },
  { name: 'webservice', kind: 'component', code: [46, 30, 38] },
  { name: 'postgres', kind: 'component', code: [36, 44, 26] },
  { name: 'cron-task', kind: 'component', code: [40, 28, 34] },
  { name: 'scaler', kind: 'trait', code: [30, 40, 22] },
  { name: 'gateway', kind: 'trait', code: [42, 26, 36] },
];
const defIndex = Object.fromEntries(defs.map((d, i) => [d.name, i]));

// blocks are the application's source and components: each is an instance
// of a definition, with instances of trait definitions clipped to it.
const blocks = [
  { name: 'settings', def: 'config', traits: [] },
  { name: 'api', def: 'webservice', traits: ['scaler', 'gateway'] },
  { name: 'payments-db', def: 'postgres', traits: [] },
];
const usedDefs = new Set(blocks.flatMap((b) => [b.def, ...b.traits]));

const clusters = [
  { name: 'staging', pods: 3 },
  { name: 'prod-eu', pods: 5 },
  { name: 'prod-us', pods: 4 },
];

// The drawing plays once, in phases: each definition is written; then, block
// by block, an instance of its definition appears on the definition and moves
// into the application, and instances of its traits follow and clip on; then
// the workflow delivers the application to each cluster in turn, where its
// database comes up and its pods scale in. Lines appear only as they draw.
const authorPhase = (i) => 1 + i;
const blockPhases = [];
let next = defs.length + 1;
for (const b of blocks) {
  const phases = { spawn: next, place: next + 1 };
  next += 2;
  if (b.traits.length) {
    phases.traitSpawn = next;
    phases.traitPlace = next + 1;
    next += 2;
  }
  blockPhases.push(phases);
}
const composedPhase = next - 1;
const stepPhase = (i) => composedPhase + 1 + i;
const fanPhase = (i) => stepPhase(3) + i * 2;
const runPhase = (i) => fanPhase(i) + 1;
const lastPhase = runPhase(clusters.length - 1);

const across = ([x1, y1], [x2, y2]) =>
  `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
const down = ([x1, y1], [x2, y2]) => `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;

// wide lays the stages out left to right; narrow puts delivery below for a
// phone.
const wide = {
  viewBox: '0 0 720 292',
  labels: [
    [96, 12],
    [337, 38],
    [630, 34],
  ],
  def: (i) => ({ x: 8, y: 24 + i * 44, w: 176 }),
  code: { inset: 56, scale: 1 },
  podGap: 15,
  app: { x: 262, y: 50, w: 150, h: 192 },
  block: (i) => ({ x: 274, y: 88 + i * 50, w: 112 }),
  trunk: [412, 146],
  steps: [
    [444, 146],
    [474, 146],
    [504, 146],
  ],
  fan: across,
  cluster: (i) => ({ x: 548, y: 46 + i * 70, w: 164 }),
  clusterIn: (c) => [c.x, c.y + 30],
};

const narrow = {
  viewBox: '0 0 360 440',
  labels: [
    [82, 12],
    [274, 38],
    [150, 318],
  ],
  def: (i) => ({ x: 8, y: 24 + i * 44, w: 156 }),
  code: { inset: 38, scale: 0.6 },
  podGap: 13,
  app: { x: 196, y: 50, w: 156, h: 192 },
  block: (i) => ({ x: 206, y: 88 + i * 50, w: 116 }),
  trunk: [274, 242],
  steps: [
    [274, 270],
    [274, 298],
    [274, 326],
  ],
  fan: down,
  cluster: (i) => ({ x: 4 + i * 119, y: 372, w: 112 }),
  clusterIn: (c) => [c.x + c.w / 2, c.y],
};

// useNarrow reports whether the drawing should use its phone layout.
function useNarrow() {
  const [narrowView, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return narrowView;
}

const Text = ({ x, y, kind, anchor, children }) => (
  <text className={clsx('dg-text', kind)} x={x} y={y} textAnchor={anchor}>
    {children}
  </text>
);

// Instance is drawn where it ends up, offset back to where it starts: hidden
// until spawned, shown over its definition, then moved into place.
const Instance = ({ from, spawned, placed, className, children }) => (
  <g
    className={clsx('dg-instance', className, { spawned, placed })}
    style={{ transform: placed ? 'none' : `translate(${from[0]}px, ${from[1]}px)` }}
  >
    {children}
  </g>
);

// HowGraph draws How it works: definitions authored, an application composed
// from instances of some of them, and its delivery to three clusters. It is
// decoration, so screen readers skip it.
export default function HowGraph() {
  const L = useNarrow() ? narrow : wide;
  const [ref, phase] = usePlayOnce(lastPhase, 360);
  const on = (k) => phase >= k;
  const stageNames = [
    translate({ id: 'home.what.define.title', message: 'Define' }),
    translate({ id: 'home.what.compose.title', message: 'Compose' }),
    translate({ id: 'home.what.deliver.title', message: 'Deliver' }),
  ];
  // spawnedDefs are the definitions an instance has been taken from so far.
  const spawnedDefs = new Set(
    blocks.flatMap((b, i) => [
      ...(on(blockPhases[i].spawn) ? [b.def] : []),
      ...(b.traits.length && on(blockPhases[i].traitSpawn) ? b.traits : []),
    ]),
  );
  const [tx, ty] = L.trunk;
  const last = L.steps[L.steps.length - 1];
  const fanFrom = L === wide ? [last[0] + 8, last[1]] : [last[0], last[1] + 8];

  return (
    <svg ref={ref} className="dg dg-how" viewBox={L.viewBox} aria-hidden="true">
      {stageNames.map((name, i) => (
        <Text key={i} x={L.labels[i][0]} y={L.labels[i][1]} kind="stage" anchor="middle">
          {name}
        </Text>
      ))}

      {defs.map((d, i) => {
        const box = L.def(i);
        return (
          <g
            key={d.name}
            className={clsx('dg-card dg-def', {
              on: on(authorPhase(i)),
              used: spawnedDefs.has(d.name),
              unused: !usedDefs.has(d.name) && on(composedPhase),
            })}
          >
            <rect x={box.x} y={box.y} width={box.w} height="40" rx="9" />
            <KindIcon kind={d.kind} x={box.x + 11} y={box.y + 13} size={14} />
            <Text x={box.x + 33} y={box.y + 18} kind="strong">
              {d.name}
            </Text>
            <Text x={box.x + 33} y={box.y + 31} kind="muted">
              {d.kind}
            </Text>
            {d.code.map((w, c) => (
              <rect
                key={c}
                className="dg-code-line"
                x={box.x + box.w - L.code.inset}
                y={box.y + 11 + c * 7}
                width={w * L.code.scale}
                height="4"
                rx="2"
                style={{ transitionDelay: `${c * 90}ms` }}
              />
            ))}
          </g>
        );
      })}

      <g className={clsx('dg-card dg-app', { on: on(composedPhase) })}>
        <rect x={L.app.x} y={L.app.y} width={L.app.w} height={L.app.h} rx="12" />
        <Text x={L.app.x + 14} y={L.app.y + 22} kind="strong">
          payments
        </Text>
        {blocks.map((b, i) => {
          const box = L.block(i);
          return (
            <rect
              key={b.name}
              className={clsx('dg-slot', { filled: on(blockPhases[i].place) })}
              x={box.x}
              y={box.y}
              width={box.w}
              height="40"
              rx="8"
            />
          );
        })}
      </g>

      {L.steps.map(([x, y], i) => {
        const [px, py] = i === 0 ? [tx, ty] : L.steps[i - 1];
        const d =
          L === wide ? `M ${i === 0 ? px : px + 8} ${py} H ${x - 8}` : `M ${px} ${i === 0 ? py : py + 8} V ${y - 8}`;
        return <path key={i} className={clsx('dg-flow', { on: on(stepPhase(i)) })} d={d} pathLength={1} />;
      })}
      {clusters.map((c, i) => {
        const d = L.fan(fanFrom, L.clusterIn(L.cluster(i)));
        return (
          <path key={c.name} className={clsx('dg-flow', { on: on(fanPhase(i)) })} d={d} pathLength={1} />
        );
      })}
      {L.steps.map(([x, y], i) => (
        <g key={i} className={clsx('dg-step', { on: on(stepPhase(i)) })}>
          <circle cx={x} cy={y} r="8" />
          <path d={`M ${x - 3.5} ${y} l 2.5 2.5 l 4.5 -5`} />
        </g>
      ))}

      {clusters.map((c, i) => {
        const box = L.cluster(i);
        return (
          <g key={c.name} className={clsx('dg-card dg-cluster', { on: on(runPhase(i)) })}>
            <rect x={box.x} y={box.y} width={box.w} height="60" rx="11" />
            <circle className="dg-dot" cx={box.x + 14} cy={box.y + 20} r="4.5" />
            <Text x={box.x + 26} y={box.y + 24} kind="strong">
              {c.name}
            </Text>
            <g className="dg-db">
              <path d={`M ${box.x + box.w - 24} ${box.y + 33} v 11 a 7 2.6 0 0 0 14 0 v -11`} />
              <ellipse cx={box.x + box.w - 17} cy={box.y + 33} rx="7" ry="2.6" />
            </g>
            {Array.from({ length: c.pods }, (_, p) => (
              <rect
                key={p}
                className="dg-pod"
                x={box.x + 10 + p * L.podGap}
                y={box.y + 35}
                width="10"
                height="10"
                rx="2.5"
                style={{ transitionDelay: `${250 + p * 110}ms` }}
              />
            ))}
          </g>
        );
      })}

      {blocks.map((b, i) => {
        const box = L.block(i);
        const def = L.def(defIndex[b.def]);
        return (
          <React.Fragment key={b.name}>
            <Instance
              from={[def.x + 6 - box.x, def.y - box.y]}
              spawned={on(blockPhases[i].spawn)}
              placed={on(blockPhases[i].place)}
            >
              <rect className="dg-block" x={box.x} y={box.y} width={box.w} height="40" rx="8" />
              <KindIcon kind={defs[defIndex[b.def]].kind} x={box.x + 10} y={box.y + 13} size={14} />
              <Text x={box.x + 32} y={box.y + 18} kind="strong">
                {b.name}
              </Text>
              <Text x={box.x + 32} y={box.y + 31} kind="muted">
                {b.def}
              </Text>
            </Instance>
            {b.traits.map((t, k) => {
              const tdef = L.def(defIndex[t]);
              const x = box.x + box.w + 3;
              const y = b.traits.length === 1 ? box.y + 14 : box.y + 6 + k * 16;
              return (
                <Instance
                  key={t}
                  className="dg-clip"
                  from={[tdef.x + 11 - x, tdef.y + 14 - y]}
                  spawned={on(blockPhases[i].traitSpawn)}
                  placed={on(blockPhases[i].traitPlace)}
                >
                  <rect className="dg-trait-badge" x={x} y={y} width="13" height="12" rx="6" />
                </Instance>
              );
            })}
          </React.Fragment>
        );
      })}
    </svg>
  );
}
