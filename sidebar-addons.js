// Sidebar for the Addons section (/addons). Its pages describe the addons in the catalog as they are now, so the
// section is not versioned. The catalog groups follow the sections of overview.md.
module.exports = {
  addons: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      link: {type: 'doc', id: 'getting-started/introduction'},
      items: ['getting-started/install', 'getting-started/quick-start'],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: true,
      // Managing addons is vela-core behaviour, so these guides stay in the KubeVela docs.
      items: [
        {type: 'link', label: 'Install and Manage Addons', href: '/docs/end-user/components/more'},
        {type: 'link', label: 'Air-gapped Installation', href: '/docs/platform-engineers/system-operation/offline-installation'},
        {type: 'link', label: 'Canary Rollout', href: '/docs/tutorials/helm-rollout'},
        {type: 'link', label: 'Observability', href: '/docs/platform-engineers/operations/observability'},
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      link: {type: 'doc', id: 'examples/overview'},
      items: [
        'examples/kustomize-from-git',
        'examples/expose-with-ingress-nginx',
        'examples/https-with-cert-manager',
        'examples/write-an-addon',
        'examples/host-an-addon-registry',
      ],
    },
    {
      type: 'category',
      label: 'Contributor Onboarding',
      collapsed: true,
      link: {type: 'doc', id: 'developer/overview'},
      items: [
        'developer/make-your-own-addon',
        'developer/addon-application',
        'developer/addon-reference',
        'developer/test-locally',
        'developer/addon-registry',
        'developer/contribute',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      link: {type: 'generated-index', slug: '/reference', description: 'The addons in the catalog, and the versions they work with.'},
      items: [
        'reference/versions',
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
