// Sidebar for the Cluster Gateway section (/cluster-gateway): what it is, installing it, registering clusters,
// configuring it and fixing it. KubeVela's multi-cluster pages stay in the KubeVela docs.
module.exports = {
  'cluster-gateway': [
    {type: 'doc', id: 'overview', label: 'Overview'},
    'install',
    'clusters',
    'configuration',
    'troubleshooting',
  ],
};
