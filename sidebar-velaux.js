// Sidebar for the VelaUX section (/velaux), in the same order as the KubeVela docs: get it running, the model it adds,
// the task guides, worked examples, running it in production, working on the repo, and the references.
module.exports = {
  velaux: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      link: {type: 'generated-index', slug: '/getting-started'},
      items: ['getting-started/install'],
    },
    {
      type: 'category',
      label: 'Concepts',
      link: {type: 'generated-index', slug: '/concepts'},
      items: ['concepts/overview'],
    },
    {
      type: 'category',
      label: 'Guides',
      link: {type: 'generated-index', slug: '/guides'},
      items: [
        {
          type: 'category',
          label: 'Applications',
          items: ['guides/applications/operations', 'guides/applications/cloud-shell'],
        },
        {
          type: 'category',
          label: 'Delivery',
          items: ['guides/delivery/targets', 'guides/delivery/triggers', 'guides/delivery/harbor-trigger'],
        },
        {
          type: 'category',
          label: 'Users and Access',
          items: [
            {type: 'doc', id: 'guides/users/overview', label: 'Users'},
            'guides/users/projects',
            'guides/users/rbac',
            'guides/users/sso',
          ],
        },
        {type: 'category', label: 'Extend', items: ['guides/extend/ui-schema']},
      ],
    },
    {
      type: 'category',
      label: 'Operate',
      link: {type: 'generated-index', slug: '/operate'},
      items: ['operate/install-options'],
    },
    {
      type: 'category',
      label: 'Reference',
      link: {type: 'generated-index', slug: '/reference'},
      items: ['reference/rest-api', 'reference/user-improvement-plan'],
    },
  ],
};
