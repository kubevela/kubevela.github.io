// Sidebar for the Addons section (/addons). Its pages describe the addons in the catalog as they are now, so the
// section is not versioned. Groups follow the sections of overview.md.
module.exports = {
  addons: [
    'overview',
    {type: 'category', label: 'KubeVela platform', items: ['vela-prism', 'kubevela-io']},
    {type: 'category', label: 'Observability', items: ['mysql-exporter']},
    {type: 'category', label: 'Delivery', items: ['fluxcd', 'kruise-rollout']},
    {type: 'category', label: 'Gateway', items: ['nginx-ingress-controller', 'traefik']},
    {type: 'category', label: 'Security', items: ['cert-manager', 'dex', 'trivy-operator']},
    {type: 'category', label: 'Workloads', items: ['ai', 'flink-kubernetes-operator', 'chartmuseum', 'netlify', 'vegeta']},
    {type: 'category', label: 'Multi-cluster', items: ['ocm-hub-control-plane', 'ocm-gateway-manager-addon']},
  ],
};
