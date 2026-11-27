// Sidebar for the Workflow section (/workflow). The section is versioned by the workflow engine: next is 0.8, which
// KubeVela 1.12 embeds. Released versions keep theirs in workflow_versioned_sidebars/.
module.exports = {
  workflow: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      link: {type: 'generated-index', slug: '/getting-started'},
      items: ['getting-started/introduction'],
    },
    {
      type: 'category',
      label: 'Guides',
      link: {type: 'generated-index', slug: '/guides'},
      items: [
        'guides/workflowrun',
        {
          type: 'category',
          label: 'Steps',
          link: {type: 'generated-index', slug: '/guides/steps'},
          items: [
            'guides/steps/suspend',
            'guides/steps/order-steps',
            'guides/steps/for-each',
            'guides/steps/inputs-outputs',
            'guides/steps/if-condition',
            'guides/steps/timeout',
          ],
        },
        'guides/operations',
        {
          type: 'category',
          label: 'Authoring Steps',
          link: {type: 'generated-index', slug: '/guides/authoring'},
          items: ['guides/authoring/step-definition', 'guides/authoring/cue-actions'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Operate',
      link: {type: 'generated-index', slug: '/operate'},
      items: ['operate/working-mechanism', 'operate/http-protection'],
    },
    {
      type: 'category',
      label: 'Reference',
      link: {type: 'generated-index', slug: '/reference'},
      items: ['reference/built-in-steps'],
    },
  ],
};
