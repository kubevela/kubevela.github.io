import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import Sail from '@site/src/components/home/Sail';
import styles from './styles.module.scss';

// The ways in, the logos shown on the addon shelf and the delivery targets.
const INTERFACES = ['API', 'CLI', 'VelaUX', 'GitOps', 'Observability'];
const SOURCES = [
  { name: 'CI pipelines' },
  { name: 'Jenkins', logo: 'jenkins.svg' },
  { name: 'GitLab CI', logo: 'gitlab.svg' },
  { name: 'GitHub Actions', logo: 'githubactions.svg' },
];
const STAGES = ['Render', 'Orchestrate', 'Deploy', 'Manage'];
const ADDONS = ['helm.png', 'terraform.png', 'crossplane.svg', 'fluxcd.svg', 'prometheus-icon.svg', 'grafana.png', 'istio.svg', 'keda.svg', 'cert-manager.svg', 'trivy.svg'];
const CLOUDS = ['aws.svg', 'azure.svg', 'google-cloud.svg', 'alibaba-cloud.svg'];

const CARD = { x: 215, y: 84, w: 360, h: 150 };

function Arrow({ d, className }) {
  return <path className={className || styles.flow} d={d} markerEnd="url(#wk-head)" />;
}

// WhatIsKubeVela draws KubeVela between the changes that come into it and the
// places it delivers to, with the stages of delivery inside it.
export default function WhatIsKubeVela() {
  const { withBaseUrl } = useBaseUrlUtils();
  const logo = (f) => withBaseUrl(`img/logs/${f}`);
  const addonLogos = ADDONS.map(logo);
  const cloudLogos = CLOUDS.map(logo);
  const k8s = logo('k8s.svg');
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 -24 760 412"
        role="img"
        aria-label="KubeVela takes changes from CI pipelines, renders, orchestrates, deploys and manages applications, and delivers them to Kubernetes clusters, clouds and edge devices. It is driven through its API, CLI, VelaUX, GitOps and observability, and extended from the addon catalog.">
        <defs>
          <marker id="wk-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* The ways people drive it, along the top. */}
        {INTERFACES.map((name, i) => {
          // One width for all, staggered in two rows so they fit over the
          // card; each arrow drops between its neighbours in the other row.
          const w = 116;
          const cx = CARD.x + (CARD.w * (i + 0.5)) / INTERFACES.length;
          const y = i % 2 === 0 ? -16 : 22;
          return (
            <g key={name}>
              <rect className={styles.chip} x={cx - w / 2} y={y} width={w} height={26} rx={7} />
              <text className={styles.chipText} x={cx} y={y + 17} textAnchor="middle">
                {name}
              </text>
              <Arrow d={`M ${cx} ${y + 27} V ${CARD.y - 3}`} className={styles.flowSoft} />
            </g>
          );
        })}

        {/* Changes coming in, on the left. */}
        <text className={styles.label} x={24} y={74}>
          CHANGES
        </text>
        {SOURCES.map(({ name, logo: file }, i) => {
          const y = CARD.y + i * 38;
          return (
            <g key={name}>
              <rect className={styles.chip} x={24} y={y} width={150} height={26} rx={7} />
              {file ? (
                <>
                  <rect className={styles.tile} x={32} y={y + 4} width={18} height={18} rx={4} />
                  <image href={logo(file)} x={34} y={y + 6} width={14} height={14} />
                </>
              ) : (
                // A generic pipeline: three stages joined in a line.
                <g className={styles.pipeline}>
                  <path d={`M 35 ${y + 13} H 47`} />
                  {[35, 41, 47].map((cx) => (
                    <circle key={cx} cx={cx} cy={y + 13} r={2.4} />
                  ))}
                </g>
              )}
              <text className={styles.chipText} x={56} y={y + 17}>
                {name}
              </text>
              <Arrow d={`M 175 ${y + 13} H ${CARD.x - 3}`} />
            </g>
          );
        })}

        {/* KubeVela, with the stages of delivery. */}
        <rect className={styles.app} x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={14} />
        <Sail className={styles.sail} x={CARD.x + 16} y={CARD.y + 12} width={26} height={26} />
        <text className={styles.title} x={CARD.x + 48} y={CARD.y + 31}>
          KubeVela
        </text>
        <text className={styles.muted} x={CARD.x + CARD.w - 16} y={CARD.y + 31} textAnchor="end">
          control plane
        </text>
        {STAGES.map((name, i) => {
          const x = CARD.x + 16 + i * 84;
          return (
            <g key={name}>
              <rect className={styles.stage} x={x} y={CARD.y + 62} width={72} height={34} rx={8} />
              <text className={styles.stageText} x={x + 36} y={CARD.y + 83} textAnchor="middle">
                {name}
              </text>
              {i < STAGES.length - 1 && <Arrow d={`M ${x + 73} ${CARD.y + 79} H ${x + 82}`} />}
            </g>
          );
        })}
        <text className={styles.muted} x={CARD.x + 16} y={CARD.y + 126}>
          Applications in, running workloads out
        </text>

        {/* The addon catalog extends it from below. */}
        <path className={styles.dashed} d={`M ${CARD.x + CARD.w / 2} 252 V ${CARD.y + CARD.h + 3}`} markerEnd="url(#wk-head)" />
        <rect className={styles.card} x={CARD.x} y={258} width={CARD.w} height={64} rx={12} />
        <text className={styles.label} x={CARD.x + 16} y={278}>
          ADDON CATALOG
        </text>
        {addonLogos.map((href, i) => (
          <g key={href}>
            <rect className={styles.tile} x={CARD.x + 14 + i * 32} y={285} width={26} height={26} rx={6} />
            <image href={href} x={CARD.x + 17 + i * 32} y={288} width={20} height={20} />
          </g>
        ))}

        {/* Where it delivers, on the right. */}
        <text className={styles.label} x={600} y={74}>
          DELIVERS TO
        </text>
        {[
          { y: CARD.y, name: 'Kubernetes' },
          { y: CARD.y + 52, name: 'Clouds' },
          { y: CARD.y + 104, name: 'IoT and edge' },
        ].map(({ y, name }, i) => (
          <g key={name}>
            <rect className={styles.card} x={600} y={y} width={140} height={46} rx={10} />
            <text className={styles.chipText} x={612} y={y + 18}>
              {name}
            </text>
            {i === 0 && (
              <>
                <image href={k8s} x={612} y={y + 25} width={16} height={16} />
                {[0, 1, 2].map((c) => (
                  <rect key={c} className={styles.cluster} x={636 + c * 22} y={y + 27} width={16} height={12} rx={3} />
                ))}
              </>
            )}
            {i === 1 &&
              cloudLogos.map((href, c) => (
                <g key={href}>
                  <rect className={styles.tile} x={610 + c * 28} y={y + 23} width={24} height={20} rx={5} />
                  <image href={href} x={613 + c * 28} y={y + 25} width={18} height={16} />
                </g>
              ))}
            {i === 2 && [0, 1, 2, 3].map((c) => <circle key={c} className={styles.cluster} cx={620 + c * 18} cy={y + 33} r={5} />)}
            <Arrow d={`M ${CARD.x + CARD.w + 1} ${y + 23} H 597`} />
          </g>
        ))}

        {/* The lifecycle it covers, along the bottom. */}
        {[
          { x: 24, w: 187, name: 'CI', cls: styles.phaseCi },
          { x: 215, w: 360, name: 'CD', cls: styles.phaseCd },
          { x: 579, w: 161, name: 'Day-2 operations', cls: styles.phaseOps },
        ].map(({ x, w, name, cls }) => (
          <g key={name}>
            <rect className={cls} x={x} y={350} width={w} height={6} rx={3} />
            <text className={styles.label} x={x + w / 2} y={376} textAnchor="middle">
              {name.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
