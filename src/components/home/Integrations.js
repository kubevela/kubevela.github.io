import React from 'react';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './home.module.scss';

// groups are the tools KubeVela works with, by what they do for it, three to
// a row: each has an addon in the catalog or is built in.
const groups = [
  {
    title: <Translate id="home.integrations.delivery">Delivery</Translate>,
    tools: [
      ['Helm', 'helm.png'],
      ['FluxCD', 'fluxcd.svg'],
      ['Argo CD', 'argo.svg'],
      ['Git', 'git.svg'],
      ['OpenKruise', 'openkruise.svg'],
      ['Netlify', 'netlify.svg'],
    ],
  },
  {
    title: <Translate id="home.integrations.clouds">Cloud resources</Translate>,
    tools: [
      ['AWS', 'aws.svg'],
      ['Google Cloud', 'google-cloud.svg'],
      ['Azure', 'azure.svg'],
      ['Alibaba Cloud', 'alibaba-cloud.svg'],
      ['Terraform', 'terraform.png'],
      ['Crossplane', 'crossplane.svg'],
    ],
  },
  {
    title: <Translate id="home.integrations.clusters">Clusters and traffic</Translate>,
    tools: [
      ['Kubernetes', 'k8s.svg'],
      ['OCM', 'ocm.svg'],
      ['KEDA', 'keda.svg'],
      ['Istio', 'istio.svg'],
      ['NGINX Ingress', 'nginx.svg'],
      ['Traefik', 'traefik.svg'],
    ],
  },
  {
    title: <Translate id="home.integrations.observability">Observability</Translate>,
    tools: [
      ['Prometheus', 'prometheus-icon.svg'],
      ['Grafana', 'grafana.png'],
      ['Loki', 'loki.svg'],
      ['VictoriaMetrics', 'victoriametrics.svg'],
      ['Vector', 'vector.svg'],
      ['ClickHouse', 'clickhouse.svg'],
    ],
  },
  {
    title: <Translate id="home.integrations.security">Security and identity</Translate>,
    tools: [
      ['Trivy', 'trivy.svg'],
      ['cert-manager', 'cert-manager.svg'],
      ['Dex', 'dex.svg'],
    ],
  },
  {
    title: <Translate id="home.integrations.registries">Registries</Translate>,
    tools: [
      ['Harbor', 'harbor.png'],
      ['JFrog', 'jfrog.png'],
      ['ChartMuseum', 'chartmuseum.png'],
    ],
  },
];

// Integrations lists the tools KubeVela works with, grouped and named.
export default function Integrations() {
  const base = useBaseUrl('/img/logs/');
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Translate id="home.integrations.title">Works with the tools you already use</Translate>
          </h2>
        </div>
        <div className={styles.groups}>
          {groups.map((g, i) => (
            <div key={i} className={styles.group}>
              <h3 className={styles.groupTitle}>{g.title}</h3>
              <ul className={styles.tools}>
                {g.tools.map(([name, logo]) => (
                  <li key={name} className={styles.tool}>
                    <img src={`${base}${logo}`} alt="" loading="lazy" width="28" height="28" />
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
