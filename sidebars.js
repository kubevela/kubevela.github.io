module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Overview',
      items: [
        'overview/introduction',
        'overview/concepts',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/install',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Platform Builder Guide',
      items: [
        {
          'Design Abstraction': [
            'platform-builder-guide/design-abstraction/overview',
            'platform-builder-guide/design-abstraction/application',
            'platform-builder-guide/design-abstraction/definition-and-templates',
          ]
        },
        {
          'Using CUE': [
            'platform-builder-guide/using-cue/basic',
            'platform-builder-guide/using-cue/workload-type',
            'platform-builder-guide/using-cue/trait',
            'platform-builder-guide/using-cue/status',
            'platform-builder-guide/using-cue/openapi-v3-json-schema',
          ]
        },
        {
          'Using Helm': [
            'platform-builder-guide/using-helm/component',
            'platform-builder-guide/using-helm/trait',
            'platform-builder-guide/using-helm/known-issues',
          ]
        }
      ],
    },
    {
      type: 'category',
      label: 'Developer Experience Guide',
      items: [
        {
          'Appfile': [
            'developer-experience-guide/appfile/quick-start-appfile',
            'developer-experience-guide/appfile/learn-appfile',
          ]
        },
        {
          'Command Line Tool (CLI)': [
            'developer-experience-guide/cli/port-forward',
            'developer-experience-guide/cli/check-logs',
            'developer-experience-guide/cli/exec-cmd',
            'developer-experience-guide/cli/cap-center',
            'developer-experience-guide/cli/config-enviroments',
            'developer-experience-guide/cli/config-app',
          ]
        },
      ],
    },
    {
      type: 'category',
      label: 'CLI References',
      items: [
        'cli-references/vela_config',
        'cli-references/vela_env',
        'cli-references/vela_init',
        'cli-references/vela_up',
        'cli-references/vela_version',
        'cli-references/vela_exec',
        'cli-references/vela_logs',
        'cli-references/vela_ls',
        'cli-references/vela_port-forward',
        'cli-references/vela_show',
        'cli-references/vela_status',
        'cli-references/vela_workloads',
        'cli-references/vela_traits',
        'cli-references/vela_system',
        'cli-references/vela_template',
        'cli-references/vela_cap',
      ],
    },
    {
      type: 'category',
      label: 'Capability References',
      items: [
        'capability-references/overview',
        'capability-references/webservice',
        'capability-references/task',
        'capability-references/worker',
        'capability-references/route',
        'capability-references/metrics',
        'capability-references/scaler',
        'capability-references/rest',
      ],
    },
    {
      type: 'category',
      label: 'Roadmap',
      items: [
        'roadmap/roadmap',
      ],
    },
    {
      type: 'doc',
      id: 'faq'
    },
  ],
};
