// Sidebar for the Prism section (/prism), in the same shape as the KubeVela docs: Getting Started, Concepts, Guides,
// Examples, Operate, Contributor Onboarding and Reference. The addon's own page stays in the Addons section.
const category = (label, slug, description, items) => ({
  type: 'category',
  label,
  collapsed: false,
  link: {type: 'generated-index', slug, description},
  items,
});

module.exports = {
  prism: [
    category('Getting Started', '/getting-started', 'What Prism is, installing it, and a first run with a namespace user.', [
      'getting-started/introduction',
      'getting-started/install',
      'getting-started/quick-start',
    ]),
    category('Concepts', '/concepts', 'How an API with no storage of its own maps onto the objects behind it.', [
      'concepts/projections',
    ]),
    category('Guides', '/guides', 'Each API Prism serves, and the RBAC that goes with it.', [
      'guides/resource-trackers',
      'guides/clusters',
      'guides/grafana',
      'guides/dynamic-resources',
    ]),
    category('Examples', '/examples', 'Complete worked examples on a k3d cluster, each with the output it gives.', [
      'examples/namespace-reader',
      'examples/cluster-list',
      'examples/grafana-with-kubectl',
      'examples/grafana-from-an-application',
    ]),
    category('Operate', '/operate', 'Configuring, upgrading and troubleshooting a running Prism.', [
      'operate/configuration',
      'operate/upgrade',
      'operate/troubleshooting',
    ]),
    category('Contributor Onboarding', '/developer', 'Working on the prism repository: building, running, testing and getting a change merged.', [
      'developer/overview',
      'developer/build-and-run',
      'developer/testing',
    ]),
    category('Reference', '/reference', 'Each API and its fields, and the version each KubeVela release gets.', [
      'reference/api',
      'reference/versions',
    ]),
  ],
};
