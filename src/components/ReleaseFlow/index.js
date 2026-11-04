import React from 'react';
import styles from './styles.module.scss';

// Lanes run left to right; each commit is [x, kind, label lines].
const R13 = 86;
const MASTER = 240;
const R14 = 410;

const RELEASE_13 = [
  [130, 'fix'],
  [190, 'release', ['Release', '1.10.6']],
  [250, 'fix'],
  [310, 'release', ['Release', '1.10.7']],
  [370, 'fix'],
  [430, 'release', ['Release', '1.10.8']],
  [490, 'fix'],
  [550, 'release', ['Release', '1.10.9']],
  [610, 'fix'],
];
const MAIN = [
  [130, 'fix'],
  [190, 'feature'],
  [250, 'fix'],
  [310, 'feature'],
  [370, 'fix'],
  [430, 'milestone'],
  [490, 'fix'],
  [550, 'feature', ['Pre-release', '1.11.0-alpha.1']],
  [610, 'fix'],
  [680, 'feature', ['Pre-release', '1.11.0-alpha.2']],
  [750, 'feature'],
  [810, 'fix'],
  [900, 'feature', ['Pre-release', '1.12.0-alpha.1']],
];
const RELEASE_14 = [
  [750, 'pre', ['Pre-release', '1.11.0-alpha.6']],
  [810, 'fix'],
  [870, 'release', ['Release', '1.11.0']],
  [920, 'fix'],
];
// Fixes land on master first and are cherry-picked onto the release branch.
const PICKS = [
  [130, MASTER, R13],
  [250, MASTER, R13],
  [370, MASTER, R13],
  [490, MASTER, R13],
  [610, MASTER, R13],
  [810, MASTER, R14],
];

const RADIUS = { fix: 6, feature: 10, pre: 10, release: 10, milestone: 7, idea: 9, design: 9 };

function Lane({ y, x1, x2, name, nameX, anchor = 'end' }) {
  return (
    <g>
      <rect className={styles.lane} x={x1} y={y - 4} width={x2 - x1} height={8} rx={4} />
      <path className={styles.laneHead} d={`M ${x2} ${y - 9} L ${x2 + 14} ${y} L ${x2} ${y + 9} Z`} />
      <text className={styles.strong} x={nameX} y={y + 4} textAnchor={anchor}>
        {name}
      </text>
    </g>
  );
}

function Commit({ x, y, kind, label, below }) {
  return (
    <g>
      <circle className={styles[kind]} cx={x} cy={y} r={RADIUS[kind]} />
      {label &&
        label.map((l, i) => (
          <text key={i} className={i === 0 ? styles.muted : styles.chipText} x={x} y={below ? y + 28 + i * 13 : y - 30 + i * 13} textAnchor="middle">
            {l}
          </text>
        ))}
    </g>
  );
}

// Freeze is a release branch's freeze band, labelled at tx, between the
// cherry-pick arrows that cross it.
function Freeze({ x, y, w, tx }) {
  return (
    <g>
      <rect className={styles.freeze} x={x} y={y} width={w} height={34} rx={6} />
      <text className={styles.freezeText} x={tx} y={y + 14} textAnchor="middle">
        Code freeze:
      </text>
      <text className={styles.freezeText} x={tx} y={y + 27} textAnchor="middle">
        bug fixes only
      </text>
    </g>
  );
}

// ReleaseFlow shows features and fixes landing on master, release branches
// cut from it under a code freeze with fixes cherry-picked across, and the
// pre-releases and releases tagged along each.
export default function ReleaseFlow() {
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 1010 470"
        role="img"
        aria-label="Features and fixes land on master, which also tags alpha pre-releases. A release branch such as release-1.10 is cut from master and frozen to bug fixes, which are cherry-picked from master; it tags patch releases 1.10.6 to 1.10.9. New ideas and issues become designs, and when the designs are finished a new release milestone starts on master. Later release-1.11 is cut the same way, tagging 1.11.0-alpha.6 and then 1.11.0, while master moves on to 1.12.0-alpha.1.">
        <defs>
          <marker id="rf-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* Where each release branch is cut. */}
        <path className={styles.cut} d={`M 104 40 V ${MASTER + 30}`} />
        <text className={styles.muted} x={96} y={170} textAnchor="end">
          cut branch
        </text>
        <path className={styles.cut} d={`M 708 ${MASTER + 52} V 446`} />
        <text className={styles.muted} x={700} y={340} textAnchor="end">
          cut branch
        </text>

        <Lane y={R13} x1={114} x2={640} name="release-1.10" nameX={96} />
        <Freeze x={120} y={104} w={510} tx={310} />
        <Lane y={MASTER} x1={20} x2={950} name="master" nameX={972} anchor="start" />
        <Lane y={R14} x1={718} x2={950} name="release-1.11" nameX={700} />
        <Freeze x={720} y={352} w={230} tx={880} />

        {PICKS.map(([x, from, to]) => {
          const up = to < from;
          const r = RADIUS.fix;
          return <path key={`${x}-${to}`} className={styles.pick} d={`M ${x} ${up ? from - r - 1 : from + r + 1} V ${up ? to + r + 3 : to - r - 3}`} markerEnd="url(#rf-head)" />;
        })}

        {/* Ideas become designs, which start a new release milestone. */}
        <rect className={styles.box} x={20} y={330} width={110} height={90} rx={8} />
        <text className={styles.muted} x={75} y={440} textAnchor="middle">
          New ideas, issues
        </text>
        <rect className={styles.box} x={160} y={330} width={80} height={90} rx={8} />
        <text className={styles.muted} x={200} y={440} textAnchor="middle">
          Design finished
        </text>
        <path className={styles.pick} d="M 95 356 H 189" markerEnd="url(#rf-head)" />
        <path className={styles.pick} d="M 77 396 H 189" markerEnd="url(#rf-head)" />
        <path className={styles.pick} d={`M 210 356 H 422 Q 430 356 430 348 V ${MASTER + 10}`} markerEnd="url(#rf-head)" />
        {[
          [45, 376],
          [86, 356],
          [68, 396],
        ].map(([cx, cy]) => (
          <circle key={cx} className={styles.idea} cx={cx} cy={cy} r={RADIUS.idea} />
        ))}
        {[356, 396].map((cy) => (
          <circle key={cy} className={styles.design} cx={200} cy={cy} r={RADIUS.design} />
        ))}
        <text className={styles.chipText} x={440} y={306}>
          Start new release
        </text>
        <text className={styles.chipText} x={440} y={320}>
          milestone
        </text>

        <rect className={styles.box} x={180} y={276} width={140} height={24} rx={6} />
        <text className={styles.chipText} x={250} y={292} textAnchor="middle">
          new features
        </text>
        <path className={styles.pickSoft} d={`M 190 275 V ${MASTER + 13}`} markerEnd="url(#rf-head)" />
        <path className={styles.pickSoft} d={`M 310 275 V ${MASTER + 13}`} markerEnd="url(#rf-head)" />

        {RELEASE_13.map(([x, kind, label]) => (
          <Commit key={x} x={x} y={R13} kind={kind} label={label} />
        ))}
        {MAIN.map(([x, kind, label]) => (
          <Commit key={x} x={x} y={MASTER} kind={kind} label={label} below />
        ))}
        {RELEASE_14.map(([x, kind, label]) => (
          <Commit key={x} x={x} y={R14} kind={kind} label={label} below />
        ))}
      </svg>
    </figure>
  );
}
