module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/introduction',
        'getting-started/quick-install',
        'getting-started/first-application',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'core-concepts/application',
        'core-concepts/workflow',
        'core-concepts/infrastructure',
      ],
    },
    {
      type: 'category',
      label: 'End User Guide',
      collapsed: false,
      items:[
          // 'end-user/overview-end-user',
          'end-user/initializer-end-user',
        {
          'Components': [
            'end-user/components/webservice',
            'end-user/components/task',
            'end-user/components/worker',
            'end-user/components/cloud-services',
            'end-user/components/more',
          ]
        },
        {
          'Traits': [
            'end-user/traits/ingress',
            {
              'Scaler': [
              'end-user/traits/manual-scaler',
              'end-user/traits/autoscaler',
              ]
            },       
            'end-user/traits/volumes',
            'end-user/traits/service-binding',
            'end-user/traits/annotations-and-labels',
            'end-user/traits/sidecar',
            'end-user/traits/metrics',
          ]
        },
        // 'end-user/workflow-end-user',
        // 'end-user/scopes/rollout-plan',
        // {
        //   'Observability': [
        //     'end-user/scopes/health',
        //   ]
        // },

        {
          'Workflow End User': [
            'end-user/workflow/multi-env',
            'end-user/workflow/canary',
            'end-user/workflow/component-topo',
          ]
        },
        {
          'Debugging': [
            'end-user/debug/dry-run',
            'end-user/debug/live-diff',
            'end-user/debug/health',
            'end-user/debug/monitoring',
          ]
        },
      ]
    },
    {
      type: 'category',
      label: 'Administrator Guide',
      collapsed: false,
      items: [
        'administrator/advanced-install',
        // 'administrator/definition-and-templates',
        // 'administrator/openapi-v3-json-schema',
        'administrator/initializer-platform-eng',
        {
          type: 'category',
          label: 'Defining Components',
          items: [
            {
              'CUE': [
                // 'administrator/cue/component',
                // 'administrator/cue/basic',
              ]
            },
            {
              'Helm': [
                  // 'administrator/helm/component',
                  'administrator/helm/trait',
                  'administrator/helm/known-issues'
              ]
            },
            {
              'Simple Template': [
                  'administrator/kube/component',
                  'administrator/kube/trait',
              ]
            },
            {
              type: 'category',
              label: 'Cloud Services',
              items: [
                'administrator/cloud-services',
                'administrator/terraform',
                'administrator/crossplane',
              ]
            },
          ]
        },
        {
          type: 'category',
          label: 'Defining Traits',
          items: [
            'administrator/cue/trait',
            'administrator/cue/patch-trait',
            'administrator/cue/status',
            'administrator/cue/advanced',
          ]
        },
        // {
        //   type: 'category',
        //   label: 'Hands-on Lab',
        //   items: [
        //     'administrator/debug-test-cue',
        //     'administrator/keda'
        //   ]
        // },
        'administrator/workflow-platform-eng',
      ],
    },
    {
      type: 'category',
      label: 'Using KubeVela CLI',
      items: [
        {
          'Appfile': [
            'quick-start-appfile',
            'developers/learn-appfile',
          ]
        },
        {
          'Managing Applications': [
            'developers/config-enviroments',
            'developers/port-forward',
            'developers/check-logs',
            'developers/exec-cmd',
            'developers/cap-center',
            'developers/config-app',
          ]
        },
      ],
    },
    {
      type: 'category',
      label: 'References',
      items: [
        {
          type: 'category',
          label: 'CLI',
          items: [
            'cli/vela_components',
            'cli/vela_config',
            'cli/vela_env',
            'cli/vela_init',
            'cli/vela_up',
            'cli/vela_version',
            'cli/vela_exec',
            'cli/vela_logs',
            'cli/vela_ls',
            'cli/vela_port-forward',
            'cli/vela_show',
            'cli/vela_status',
            'cli/vela_workloads',
            'cli/vela_traits',
            'cli/vela_system',
            'cli/vela_template',
            'cli/vela_cap',
          ],
        },
        'developers/references/kubectl-plugin'
      ],
    },
    {
      type: 'category',
      label: 'Roadmap',
      items: [
        'roadmap/README',
      ],
    },
    // {
    //   'Appendix': [
    //     'advanced-install',
    //   ]
    // },
    {
      type: 'doc',
      id: 'developers/references/devex/faq'
    },
  ],
};
