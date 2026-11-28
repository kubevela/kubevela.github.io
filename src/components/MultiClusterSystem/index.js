import React from 'react';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import Sail from '@site/src/components/home/Sail';
import styles from './styles.module.scss';

const COLUMNS = [140, 300, 460, 620];
const CONTROL = { x: 40, y: 14, w: 680, h: 70 };
const GATEWAY = { x: 40, y: 120, w: 680, h: 40 };
const OCM = { x: 400, y: 222, w: 280, h: 38 };
const TARGET = { y: 302, w: 150, h: 40 };
const TARGETS = [
  { name: 'Managed Kubernetes' },
  { name: 'On-premises', logo: 'k8s.svg' },
  { name: 'On-premises', logo: 'k8s.svg' },
  { name: 'IoT / Edge', device: true },
];
const CLOUDS = ['alibaba-cloud.svg', 'azure.svg', 'aws.svg', 'google-cloud.svg'];

function Arrow({ d }) {
  return <path className={styles.flow} d={d} markerEnd="url(#mcs-head)" />;
}

// MultiClusterSystem shows the KubeVela control plane reaching clusters
// through the cluster gateway: pushing to managed and on-premises clusters
// directly, and pulled by clusters and edge devices registered through Open
// Cluster Management.
export default function MultiClusterSystem() {
  const { withBaseUrl } = useBaseUrlUtils();
  const logo = (f) => withBaseUrl(`img/logs/${f}`);
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 760 388"
        role="img"
        aria-label="The KubeVela control plane reaches every cluster through the cluster gateway. It pushes to managed Kubernetes on Alibaba Cloud, Azure, AWS and Google Cloud, and to on-premises clusters, with no additional control plane overhead. On-premises clusters and IoT or edge devices registered with Open Cluster Management pull from it instead.">
        <defs>
          <marker id="mcs-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        {/* The control plane, and the gateway every cluster is reached through. */}
        <rect className={styles.app} x={CONTROL.x} y={CONTROL.y} width={CONTROL.w} height={CONTROL.h} rx={12} />
        <Sail className={styles.sail} x={246} y={CONTROL.y + 16} width={38} height={38} />
        <text className={styles.big} x={296} y={CONTROL.y + 42}>
          KubeVela Control Plane
        </text>
        <rect className={styles.tile} x={CONTROL.x + CONTROL.w - 34} y={CONTROL.y + 10} width={24} height={24} rx={6} />
        <image href={logo('k8s.svg')} x={CONTROL.x + CONTROL.w - 32} y={CONTROL.y + 12} width={20} height={20} />
        <rect className={styles.group} x={GATEWAY.x} y={GATEWAY.y} width={GATEWAY.w} height={GATEWAY.h} rx={10} />
        <text className={styles.title} x={GATEWAY.x + GATEWAY.w / 2} y={GATEWAY.y + 25} textAnchor="middle">
          Cluster Gateway
        </text>
        {COLUMNS.map((x) => (
          <Arrow key={x} d={`M ${x} ${CONTROL.y + CONTROL.h + 1} V ${GATEWAY.y - 3}`} />
        ))}

        {/* Push: the gateway applies to these clusters directly. */}
        {COLUMNS.slice(0, 2).map((x) => (
          <g key={x}>
            <Arrow d={`M ${x} ${GATEWAY.y + GATEWAY.h + 1} V ${TARGET.y - 3}`} />
            <text className={styles.flowLabel} x={x + 8} y={GATEWAY.y + GATEWAY.h + 26}>
              Push
            </text>
          </g>
        ))}
        <rect className={styles.optional} x={COLUMNS[0] + 14} y={226} width={COLUMNS[1] - COLUMNS[0] - 28} height={42} rx={8} />
        <text className={styles.italic} x={(COLUMNS[0] + COLUMNS[1]) / 2} y={243} textAnchor="middle">
          No additional
        </text>
        <text className={styles.italic} x={(COLUMNS[0] + COLUMNS[1]) / 2} y={258} textAnchor="middle">
          control plane overhead
        </text>

        {/* Pull: these clusters register through Open Cluster Management. */}
        <rect className={styles.card} x={OCM.x} y={OCM.y} width={OCM.w} height={OCM.h} rx={10} />
        <rect className={styles.tile} x={OCM.x + 10} y={OCM.y + 7} width={24} height={24} rx={6} />
        <image href={logo('ocm.svg')} x={OCM.x + 12} y={OCM.y + 9} width={20} height={20} />
        <text className={styles.title} x={OCM.x + OCM.w / 2 + 14} y={OCM.y + 24} textAnchor="middle">
          Open Cluster Management
        </text>
        {COLUMNS.slice(2).map((x) => (
          <g key={x}>
            <Arrow d={`M ${x} ${TARGET.y - 1} V ${OCM.y + OCM.h + 3}`} />
            <Arrow d={`M ${x} ${OCM.y - 1} V ${GATEWAY.y + GATEWAY.h + 3}`} />
            <text className={styles.flowLabel} x={x + 8} y={GATEWAY.y + GATEWAY.h + 26}>
              Pull
            </text>
          </g>
        ))}

        {/* The clusters themselves. */}
        {TARGETS.map((t, i) => {
          const x = COLUMNS[i] - TARGET.w / 2;
          const hasIcon = t.logo || t.device;
          return (
            <g key={i}>
              <rect className={styles.card} x={x} y={TARGET.y} width={TARGET.w} height={TARGET.h} rx={10} />
              {t.logo && (
                <>
                  <rect className={styles.tile} x={x + 10} y={TARGET.y + 9} width={22} height={22} rx={5} />
                  <image href={logo(t.logo)} x={x + 12} y={TARGET.y + 11} width={18} height={18} />
                </>
              )}
              {t.device && (
                <g className={styles.device}>
                  <rect x={x + 12} y={TARGET.y + 11} width={18} height={18} rx={4} />
                  <circle cx={x + 21} cy={TARGET.y + 20} r={3} />
                </g>
              )}
              <text className={styles.title} x={hasIcon ? x + 40 : x + TARGET.w / 2} y={TARGET.y + 25} textAnchor={hasIcon ? 'start' : 'middle'}>
                {t.name}
              </text>
            </g>
          );
        })}
        {CLOUDS.map((f, c) => (
          <g key={f}>
            <rect className={styles.tile} x={COLUMNS[0] - 56 + c * 28} y={TARGET.y + TARGET.h + 10} width={24} height={22} rx={5} />
            <image href={logo(f)} x={COLUMNS[0] - 53 + c * 28} y={TARGET.y + TARGET.h + 13} width={18} height={16} />
          </g>
        ))}
      </svg>
    </figure>
  );
}
