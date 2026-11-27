// Sidebar for the Addons section (/addons). Its pages describe the addons in the catalog as they are now, so the
// section is not versioned. The catalog groups follow the sections of overview.md.
module.exports = {
  addons: [
    {
      type: 'category',
      label: 'Developer Onboarding',
      collapsed: true,
      items: [
        'developer/make-your-own-addon',
        'developer/addon-application',
        'developer/addon-reference',
        'developer/addon-registry',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      link: {type: 'generated-index', slug: '/reference', description: 'The addons in the catalog.'},
      items: [
        {
          type: 'category',
          label: 'Addon Catalog',
          link: {type: 'doc', id: 'overview'},
          items: [
            {type: 'category', label: 'KubeVela platform', items: ['vela-prism', 'kubevela-io']},
            {type: 'category', label: 'Observability', items: ['mysql-exporter']},
            {type: 'category', label: 'Delivery', items: ['fluxcd', 'kruise-rollout']},
            {type: 'category', label: 'Gateway', items: ['nginx-ingress-controller', 'traefik']},
            {type: 'category', label: 'Security', items: ['cert-manager', 'dex', 'trivy-operator']},
            {
              type: 'category',
              label: 'Workloads',
              items: ['ai', 'flink-kubernetes-operator', 'chartmuseum', 'netlify', 'vegeta'],
            },
            {type: 'category', label: 'Multi-cluster', items: ['ocm-hub-control-plane', 'ocm-gateway-manager-addon']},
          ],
        },
      ],
    },
  ],
};
