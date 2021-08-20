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
      ],
    },
    {
      type: 'category',
      label: 'End User Guide',
      collapsed: false,
      items: [
        // 'end-user/initializer-end-user',
        {
          'Components': [
            'end-user/components/helm',
            'end-user/components/kustomize',
            'end-user/components/cue',
            'end-user/components/cloud-services',
            // {
            //   'Cloud Services': [
            //     {
            //       'Terraform': [
            //         'end-user/components/cloud-services/terraform/sls',
            //         'end-user/components/cloud-services/terraform/rds',
            //       ]
            //     },
            //     'end-user/components/cloud-services/alibaba-ros',
            //   ]
            // },
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
            'end-user/traits/service-binding',
            // 'end-user/traits/metrics',
            // 并入可观测性，不再用一个 trait 来实现，本文档留作参考
            'end-user/traits/rollout',
          ]
        },
        {
          'Policies': [
              'end-user/policies/envbinding',
          ]
        },
        {
          'Workflow': [
            'end-user/workflow/apply-component',
            'end-user/workflow/apply-remaining',
            'end-user/workflow/multi-env',
          ]
        },
        {
          'Addons': [
            'end-user/addons/introduction',
            'end-user/addons/fluxcd',
          ]
        },
        {
          'Debugging': [
            // 'end-user/debug/health',
            // 'end-user/debug/monitoring', 这部分要和可观测合并
            'end-user/debug/live-diff',
          ]
        },
      ]
    },
    {
      type: 'category',
      label: 'Platform Admin Guide',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Learning OAM',
          collapsed: false,
           items:[
            'platform-engineers/oam/oam-model',
            'platform-engineers/oam/x-definition',
          ]
        },
        {
          'Learning CUE': [
            'platform-engineers/cue/basic',
            // 'platform-engineers/cue/advanced', 暂时隐藏，来不及随 1.1 发布，随后补充
          ]
        },
        {
          'Environment System': [
            'platform-engineers/initializer/basic-initializer',
          ]
        },
        {
          type: 'category',
          label: 'Component System',
          items: [
            'platform-engineers/components/custom-component',
            'platform-engineers/components/component-terraform',
          ]
        },
        {
          type: 'category',
          label: 'Traits System',
          items: [
            'platform-engineers/traits/customize-trait',
            'platform-engineers/traits/patch-trait',
            'platform-engineers/traits/status',
            'platform-engineers/traits/advanced',
          ]
        },
        {
          'Worfklow System': [
            'platform-engineers/workflow/steps',
            'platform-engineers/workflow/context',
            'platform-engineers/workflow/data-flow',
            'platform-engineers/workflow/cue-actions',
          ]
        },
        'platform-engineers/observability',
        {
          'Debugging': [
            'platform-engineers/debug/dry-run',
          ]
        },
        'platform-engineers/advanced-install',
      ]
    },
    {
      type: 'category',
      label: 'Case Studies',
      collapsed: false,
      items: [
        // 'case-studies/workflow-edge-computing', // 待完成
        'case-studies/li-auto-inc',
        'case-studies/workflow-with-ocm',
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
    {
      type: 'doc',
      id: 'developers/references/devex/faq'
    },
  ],
};
