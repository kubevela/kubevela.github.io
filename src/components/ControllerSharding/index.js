import React from 'react';
import styles from './styles.module.scss';

// The master's controllers, two to a row.
const MASTER = [
  ['ComponentDefinitionController', 'PolicyDefinitionController'],
  ['TraitDefinitionController', 'WorkflowStepDefinitionController'],
  ['ApplicationController', 'ApplicationMutatingWebhook'],
  ['DynamicDiscoveryScheduler', 'Others...'],
];
const CHIP_W = 230;
const SLAVE = { y: 252, w: 278, h: 72 };
const SLAVE_X = [10, 296, 582];

function Arrow({ d, className }) {
  return <path className={className || styles.flow} d={d} markerEnd="url(#cs-head)" />;
}

// ControllerSharding shows vela-core in master mode running every controller
// and scheduling Applications onto shards, and vela-core in slave mode running
// only the ApplicationController for the shard it is given.
export default function ControllerSharding() {
  const chipX = (c) => 22 + c * (CHIP_W + 8);
  const chipY = (r) => 48 + r * 34;
  const webhook = { x: chipX(1) + CHIP_W, y: chipY(2) + 14 };
  const scheduler = { x: chipX(0) + CHIP_W / 2, y: chipY(3) + 28 };
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 870 336"
        role="img"
        aria-label="vela-core in master mode runs the definition controllers, the ApplicationController, the ApplicationMutatingWebhook and the DynamicDiscoveryScheduler. When a user creates or updates an Application, the webhook schedules it onto a shard, here shard-2. The scheduler discovers three vela-core instances in slave mode, each running only an ApplicationController for its shard, and the shard-2 controller watches and reconciles the Application.">
        <defs>
          <marker id="cs-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        <rect className={styles.app} x={10} y={10} width={CHIP_W * 2 + 32} height={186} rx={12} />
        <text className={styles.title} x={24} y={34}>
          vela-core
        </text>
        <text className={styles.muted} x={102} y={34}>
          master mode
        </text>
        {MASTER.map((row, r) =>
          row.map((name, c) => (
            <g key={name}>
              <rect className={styles.system} x={chipX(c)} y={chipY(r)} width={CHIP_W} height={28} rx={6} />
              <text className={styles.chipText} x={chipX(c) + CHIP_W / 2} y={chipY(r) + 18} textAnchor="middle">
                {name}
              </text>
            </g>
          )),
        )}

        {/* An Application is created, then scheduled onto a shard by the webhook. */}
        <rect className={styles.card} x={600} y={24} width={200} height={34} rx={8} />
        <text className={styles.strong} x={700} y={45} textAnchor="middle">
          Application
        </text>
        <rect className={styles.card} x={600} y={124} width={200} height={44} rx={8} />
        <text className={styles.strong} x={700} y={142} textAnchor="middle">
          Application
        </text>
        <text className={styles.muted} x={700} y={158} textAnchor="middle">
          shard-id: shard-2
        </text>
        <g className={styles.user}>
          <circle cx={846} cy={34} r={7} />
          <path d="M 832 56 Q 832 44 846 44 Q 860 44 860 56" />
        </g>
        <Arrow d="M 828 41 H 803" />
        <text className={styles.label} x={860} y={78} textAnchor="end">
          create / update
        </text>
        <Arrow d="M 700 59 V 121" />
        <path className={styles.feed} d={`M ${webhook.x + 1} ${webhook.y} H 552 Q 560 ${webhook.y} 560 ${webhook.y - 8} V 100 Q 560 92 568 92 H 700`} />
        <text className={styles.label} x={692} y={84} textAnchor="end">
          schedule
        </text>

        {/* The scheduler discovers the shards. */}
        {SLAVE_X.map((x, i) => {
          const cx = x + 64;
          const r = 8;
          const s = Math.sign(cx - scheduler.x);
          const d =
            s === 0
              ? `M ${scheduler.x} ${scheduler.y + 1} V ${SLAVE.y - 3}`
              : `M ${scheduler.x} ${scheduler.y + 1} V ${222 - r} Q ${scheduler.x} 222 ${scheduler.x + s * r} 222 H ${cx - s * r} Q ${cx} 222 ${cx} ${222 + r} V ${SLAVE.y - 3}`;
          return <Arrow key={x} d={d} />;
        })}
        {SLAVE_X.map((x, i) => (
          <g key={x}>
            <rect className={styles.app} x={x} y={SLAVE.y} width={SLAVE.w} height={SLAVE.h} rx={12} />
            <text className={styles.title} x={x + 14} y={SLAVE.y + 30}>
              vela-core
            </text>
            <text className={styles.muted} x={x + 14} y={SLAVE.y + 48}>
              slave mode
            </text>
            <rect className={styles.system} x={x + 104} y={SLAVE.y + 14} width={160} height={44} rx={6} />
            <text className={styles.chipText} x={x + 184} y={SLAVE.y + 33} textAnchor="middle">
              ApplicationController
            </text>
            <text className={styles.muted} x={x + 184} y={SLAVE.y + 49} textAnchor="middle">
              shard-id: shard-{i}
            </text>
          </g>
        ))}

        {/* The shard-2 controller watches and reconciles its Application. */}
        <Arrow d={`M ${SLAVE_X[2] + 184} ${SLAVE.y + 13} V 171`} className={styles.ok} />
        <text className={styles.okLabel} x={SLAVE_X[2] + 176} y={206} textAnchor="end">
          watch &amp; reconcile
        </text>
      </svg>
    </figure>
  );
}
