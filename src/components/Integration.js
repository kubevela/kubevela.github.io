import React from 'react';

const Integration = () => {
  const integrations = [
    {
      title: 'Continuous Delivery',
      logs: [
        {
          title: 'Kubernetes',
          logo: '/img/logs/k8s.svg',
        },
        {
          title: 'Helm',
          logo: '/img/logs/helm.png',
        },
        {
          title: 'FluxCD',
          logo: '/img/logs/fluxcd.svg',
        },
        {
          title: 'ArgoCD',
          logo: '/img/logs/argo.svg',
        },
        {
          title: 'Git',
          logo: '/img/logs/git.svg',
        },
        {
          title: 'Harbor',
          logo: '/img/logs/harbor.png',
        },
        {
          title: 'Jfrog',
          logo: '/img/logs/jfrog.png',
        },
        {
          title: 'Dex',
          logo: '/img/logs/dex.svg',
        },
      ],
    },
    {
      title: 'Observability & Infrastructure',
      logs: [
        {
          title: 'Prometheus',
          logo: '/img/logs/prometheus-icon.svg',
        },
        {
          title: 'Loki',
          logo: '/img/logs/loki.svg',
        },
        {
          title: 'Grafana',
          logo: '/img/logs/grafana.png',
        },
        {
          title: 'Vector',
          logo: '/img/logs/vector.svg',
        },
        {
          title: 'Terraform',
          logo: '/img/logs/terraform.png',
        },
        {
          title: 'Crossplane',
          logo: '/img/logs/crossplane.svg',
        },
        {
          title: 'Istio',
          logo: '/img/logs/istio.svg',
        },
        {
          title: 'ClickHouse',
          logo: '/img/logs/clickhouse.svg',
        },
      ],
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="row">
          <h2 className="title">Integrated with all your tools</h2>
        </div>

        <div class="rotating-tools-wrapper container">
          {integrations.map((group) => {
            return (
              <div
                key={group.title}
                title={group.title}
                class="rotate-tools-wrapper row"
              >
                {group.logs.map((item) => {
                  return (
                    <div key={item.title} class="span3">
                      <div class="tool-circle-item">
                        <img
                          src={item.logo}
                          loading="lazy"
                          title={item.title}
                          alt={item.title}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Integration;
