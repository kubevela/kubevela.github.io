// Sidebar for the Workflow section (/workflow). The section is versioned by the workflow engine: next is 0.8, which
// KubeVela 1.12 embeds. Released versions keep theirs in workflow_versioned_sidebars/.
module.exports = {
  workflow: [
    'overview',
    'workflowrun',
    {
      type: 'category',
      label: 'Steps',
      collapsed: false,
      items: [
        'steps/suspend',
        'steps/order-steps',
        'steps/for-each',
        'steps/inputs-outputs',
        'steps/if-condition',
        'steps/timeout',
      ],
    },
    {
      type: 'category',
      label: 'Operate',
      items: ['operate/operations', 'operate/working-mechanism', 'operate/http-protection'],
    },
    {
      type: 'category',
      label: 'Authoring Steps',
      items: ['authoring/step-definition', 'authoring/cue-actions'],
    },
    {
      type: 'category',
      label: 'Reference',
      items: ['reference/built-in-steps'],
    },
  ],
};
