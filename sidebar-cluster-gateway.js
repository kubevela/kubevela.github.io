// Sidebar for the Cluster Gateway section (/cluster-gateway), in the same shape as the KubeVela docs: Getting Started,
// Concepts, Guides, Examples, Operate and Reference. KubeVela's multi-cluster pages stay in the
// KubeVela docs.
const category = (label, slug, description, items) => ({
  type: 'category',
  label,
  collapsed: false,
  link: {type: 'generated-index', slug, description},
  items,
});

module.exports = {
  'cluster-gateway': [
    category('Getting Started', '/getting-started', 'What Cluster Gateway is, installing it, and a first run with two clusters.', [
      'getting-started/introduction',
      'getting-started/install',
      'getting-started/quick-start',
    ]),
    category('Concepts', '/concepts', 'How a request reaches a member cluster, and how a cluster is modelled as a Secret.', [
      'concepts/proxy-path',
      'concepts/cluster-secrets',
    ]),
    category('Guides', '/guides', 'Registering clusters, and controlling whose identity reaches them.', [
      'guides/register-clusters',
      'guides/identity-exchange',
    ]),
    category('Examples', '/examples', 'Complete worked examples on two k3d clusters, each with the output it gives.', [
      'examples/read-only-member',
      'examples/kubeconfig-per-cluster',
      'examples/identity-exchange',
      'examples/go-client',
    ]),
    category('Operate', '/operate', 'Configuring, scaling, upgrading and troubleshooting a running gateway.', [
      'operate/configuration',
      'operate/high-availability',
      'operate/upgrade',
      'operate/troubleshooting',
    ]),
    category('Reference', '/reference', 'The API, and the version each KubeVela release ships.', [
      'reference/api',
      'reference/versions',
    ]),
  ],
};
