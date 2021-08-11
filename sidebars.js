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
        'core-concepts/architecture',
        'core-concepts/application',
        'core-concepts/workflow',
      ],
    },
    {
      type: 'category',
      label: 'End User Guide',
      collapsed: false,
      items: [
        'end-user/initializer-end-user',
        {
          'Components': [
            'end-user/components/helm',
            'end-user/components/kustomize',
            {
              'CUE': [
                'end-user/components/cue/webservice',
                'end-user/components/cue/task',
                'end-user/components/cue/worker',
              ]
            },
            {
              'Cloud Services': [
                {
                  'Terraform': [
                    'end-user/components/cloud-services/terraform/sls',
                    'end-user/components/cloud-services/terraform/rds',
                  ]
                },
                'end-user/components/cloud-services/alibaba-ros',
              ]
            },
          ]
        },
        {
          'Workflow': [
            'end-user/workflow/multi-env',
          ]
        },
        {
          'Traits': [
            'end-user/traits/ingress',
            {
              'Scaling': [
                'end-user/traits/manual-scaler',
                'end-user/traits/autoscaler',
              ]
            },
            // 云资源绑定和数据持久化，都需要通过写 Definition 来引入，要单开一个小节去讲
            // 'end-user/traits/volumes',
            // 'end-user/traits/service-binding',
            'end-user/traits/annotations-and-labels',
            'end-user/traits/sidecar',
            // 'end-user/traits/metrics',
            // 并入可观测性，不再用一个 trait 来实现
            'end-user/traits/rollout',
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
      label: 'Case Studies',
      collapsed: false,
      items: [
        'case-studies/pc1', // 待完成
        // 'case-studies/pc2',
      ],
    },
    {
      type: 'category',
      label: 'Platform Admin Guide',
      collapsed: false,
      items: [
        {
          'Learning OAM': [
            'platform-engineers/oam/oam-model',
            'platform-engineers/oam/x-definition',
          ]
        },
        {
          'Learning CUE': [
            'platform-engineers/cue/basic',
            'platform-engineers/cue/advanced',
          ]
        },
        {
          'Environment System': [
            'platform-engineers/initializer/basic-initializer',
            'platform-engineers/initializer/advanced-initializer',
          ]
        },

        {
          type: 'category',
          label: 'Component System',
          items: [
            'platform-engineers/components/component-default',
            'platform-engineers/components/component-cue',
            'platform-engineers/components/component-terraform',
          ]
        },
        {
          'Worfklow System': [
            'platform-engineers/workflow/basic-workflow',
            'platform-engineers/workflow/advanced-workflow',
          ]
        },
        {
          type: 'category',
          label: 'Traits System',
          items: [
            'platform-engineers/traits/trait',
            'platform-engineers/traits/patch-trait',
            'platform-engineers/traits/status',
            'platform-engineers/traits/advanced',
          ]
        },
        'platform-engineers/advanced-install',
      ]
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
    {
      type: 'doc',
      id: 'developers/references/devex/faq'
    },
  ],
};
