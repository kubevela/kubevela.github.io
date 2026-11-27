// Sidebar for the Workflow section (/workflow). The section is versioned by the workflow engine: next is 0.8, which
// KubeVela 1.12 embeds. Released versions keep theirs in workflow_versioned_sidebars/.
module.exports = {
  workflow: [
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
      items: ['concepts/workflow-model', 'concepts/lifecycle', 'concepts/context'],
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
            'guides/steps/expressions',
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
      label: 'Examples',
      link: {type: 'generated-index', slug: '/examples'},
      items: [
        'examples/http-request',
        'examples/for-each',
        'examples/workflow-template',
        'examples/custom-step',
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
      label: 'Developer Onboarding',
      link: {type: 'generated-index', slug: '/developer-onboarding'},
      items: ['developer-onboarding/overview', 'developer-onboarding/build-and-test', 'developer-onboarding/run-locally'],
    },
    {
      type: 'category',
      label: 'Reference',
      link: {type: 'generated-index', slug: '/reference'},
      items: ['reference/built-in-steps', 'reference/versions'],
    },
  ],
};
