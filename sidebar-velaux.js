// Sidebar for the VelaUX section (/velaux), in the same order as the KubeVela docs: get it running, the model it adds,
// the task guides, worked examples, running it in production, working on the repo, and the references.
module.exports = {
  velaux: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      link: {type: 'generated-index', slug: '/getting-started'},
      items: ['getting-started/introduction', 'getting-started/install', 'getting-started/quick-start'],
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
      label: 'Examples',
      link: {type: 'generated-index', slug: '/examples'},
      items: [
        'examples/deploy-with-the-api',
        'examples/sync-cli-application',
        'examples/webhook-trigger',
        'examples/project-member',
        'examples/ui-schema',
      ],
    },
    {
      type: 'category',
      label: 'Operate',
      link: {type: 'generated-index', slug: '/operate'},
      items: ['operate/install-options', 'operate/upgrade'],
    },
    {
      type: 'category',
      label: 'Contributor Onboarding',
      link: {type: 'generated-index', slug: '/developer'},
      items: ['developer/overview', 'developer/run-locally', 'developer/testing', 'developer/pull-requests'],
    },
    {
      type: 'category',
      label: 'Reference',
      link: {type: 'generated-index', slug: '/reference'},
      items: ['reference/rest-api', 'reference/versions', 'reference/user-improvement-plan'],
    },
  ],
};
