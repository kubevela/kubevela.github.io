module.exports = {
  upgrade: [
    {
      type: 'link',
      label: '← Back to Documentation',
      href: '/docs/',
    },
    'overview',
    {
      type: 'category',
      label: 'v1.11 to v1.12',
      link: {
        type: 'doc',
        id: 'v1.12/index',
      },
      items: ['v1.12/config-migration'],
    },
    {
      type: 'category',
      label: 'v1.10 to v1.11',
      link: {
        type: 'doc',
        id: 'v1.11/index',
      },
      items: ['v1.11/cue-compatibility-layer'],
    },
    'v1.10/index',
    'v1.9/index',
    {
      type: 'category',
      label: 'Older versions',
      collapsed: true,
      items: [
        'v1.8/index',
        'v1.7/index',
        'v1.6/index',
        'v1.5/index',
        'v1.4/index',
        'v1.3/index',
        'v1.2/index',
      ],
    },
    {
      type: 'link',
      label: 'Release Notes',
      href: '/release-notes/overview/',
    },
  ],
};
