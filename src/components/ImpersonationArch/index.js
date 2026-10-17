import React from 'react';
import styles from './styles.module.scss';

const W = 180;
const H = 30;

function Arrow({ d, dashed }) {
  return <path className={dashed ? styles.dashed : styles.flow} d={d} markerEnd="url(#ia-head)" />;
}

function Box({ x, y, w = W, name, kind = 'system' }) {
  return (
    <g>
      <rect className={styles[kind]} x={x} y={y} width={w} height={H} rx={7} />
      <text className={styles.chipText} x={x + w / 2} y={y + 19} textAnchor="middle">
        {name}
      </text>
    </g>
  );
}

// ImpersonationArch follows a request from a user through the hub cluster,
// where the Application carries their identity, to the managed cluster, where
// that identity is authorized against the cluster's own RBAC.
export default function ImpersonationArch() {
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.dg}
        viewBox="0 0 860 430"
        role="img"
        aria-label="A user's request carries their username and group. In the hub cluster the mutating admission webhook stamps that identity on the KubeVela Application, the ApplicationController reconciles it and sends requests with impersonation through ClusterGateway, which redirects them to the managed cluster's Kube ApiServer. There they are authorized against Roles and RoleBindings before Deployments and Services are dispatched.">
        <defs>
          <marker id="ia-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path className={styles.head} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
        </defs>

        <Box x={10} y={52} w={76} name="User" kind="card" />

        <rect className={styles.region} x={196} y={10} width={650} height={180} rx={14} />
        <text className={styles.title} x={214} y={36}>
          Hub Cluster
        </text>
        <Box x={216} y={52} name="MutatingAdmissionWebhook" />
        <Box x={646} y={52} name="KubeVela Application" kind="app" />
        <Box x={216} y={136} name="ClusterGateway" />
        <Box x={646} y={136} name="ApplicationController" />

        <Arrow d="M 87 67 H 213" />
        <text className={styles.label} x={96} y={30}>
          1. Request with
        </text>
        <text className={styles.label} x={96} y={44}>
          username, group
        </text>
        <Arrow d="M 397 67 H 643" />
        <text className={styles.label} x={520} y={59} textAnchor="middle">
          2. Application carries identity*
        </text>
        <Arrow d="M 736 83 V 133" />
        <text className={styles.label} x={744} y={112}>
          3. Reconcile
        </text>
        <Arrow d="M 645 151 H 399" />
        <text className={styles.label} x={520} y={143} textAnchor="middle">
          4. Request with impersonation*
        </text>

        <rect className={styles.region} x={96} y={222} width={524} height={198} rx={14} />
        <text className={styles.title} x={114} y={248}>
          Managed Cluster
        </text>
        <Box x={216} y={262} name="Kube ApiServer" />
        <Box x={500} y={244} w={104} name="Role" kind="card" />
        <Box x={500} y={290} w={104} name="RoleBinding" kind="card" />
        <Box x={150} y={374} w={124} name="Deployment" kind="card" />
        <Box x={338} y={374} w={124} name="Service" kind="card" />

        <Arrow d="M 306 167 V 259" />
        <text className={styles.label} x={314} y={214}>
          5. Redirect request
        </text>
        <Arrow dashed d="M 397 271 H 432 Q 440 271 440 266 Q 440 259 448 259 H 497" />
        <Arrow dashed d="M 397 283 H 432 Q 440 283 440 291 V 297 Q 440 305 448 305 H 497" />
        <text className={styles.label} x={500} y={340}>
          6. Authorization*
        </text>
        <Arrow d="M 290 293 V 334 Q 290 342 282 342 H 220 Q 212 342 212 350 V 371" />
        <Arrow d="M 322 293 V 334 Q 322 342 330 342 H 392 Q 400 342 400 350 V 371" />
        <text className={styles.label} x={408} y={362}>
          7. Dispatch resources
        </text>

        {[
          ['* Application identity can be a', 'User, Group or ServiceAccount', 'for impersonation.'],
          ['* Request with impersonation means', 'adding Impersonate-XXX headers', 'to the request.'],
          ['* Authorization in the managed', 'cluster reuses the identity from', 'the hub and its own RBAC.'],
        ].map((lines, i) =>
          lines.map((l, k) => (
            <text key={`${i}-${k}`} className={styles.prose} x={k === 0 ? 640 : 650} y={258 + i * 54 + k * 15}>
              {l}
            </text>
          )),
        )}
      </svg>
    </figure>
  );
}
