const { Component } = require("react");

module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/introduction',
        'install',
        'quick-start',
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
      label: 'Case Studies',
      collapsed: false,
      items: [
        'case-studies/jenkins-cicd',
        'case-studies/gitops',
        'case-studies/canary-blue-green',
        'case-studies/multi-cluster',
      ],
    },
    {
      type: 'category',
      label: 'User Manuals',
      collapsed: false,
      items: [
        {
          'Components': [
            'end-user/components/helm',
            'end-user/components/kustomize',
            {
              'Cloud Services': [{
                "Terraform": [
                  'end-user/components/cloud-services/terraform/alibaba-ack',
                  'end-user/components/cloud-services/terraform/alibaba-eip',
                  'end-user/components/cloud-services/terraform/alibaba-rds',
                  'end-user/components/cloud-services/terraform/alibaba-oss',
                ],
              },
                'end-user/components/cloud-services/provider-and-consume-cloud-services',
              ],
            },
            {
              'CUE Components': [
                'end-user/components/cue/webservice',
                'end-user/components/cue/worker',
                'end-user/components/cue/task',
                'end-user/components/cue/raw',
              ]
            },
            'end-user/components/more',
          ]
        },
        {
          'Traits': [
            'end-user/traits/ingress',
            'end-user/traits/rollout',
            'end-user/traits/autoscaler',
            'end-user/traits/kustomize-patch',
            'end-user/traits/annotations-and-labels',
            'end-user/traits/service-binding',
            'end-user/traits/sidecar',
            'end-user/traits/more',
          ]
        },
        {
          'Policies': [
            'end-user/policies/envbinding',
            'end-user/policies/health',
          ]
        },
        {
          'Workflow': [
            'end-user/workflow/webhook-notification',
            'end-user/workflow/component-dependency-parameter',
          ]
        },
        'end-user/version-control',
      ]
    },
    {
      type: 'category',
      label: 'Administrator Manuals',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Learning OAM',
          collapsed: false,
          items: [
            'platform-engineers/oam/oam-model',
            'platform-engineers/oam/x-definition',
          ]
        },
        {
          'Learning CUE': [
            'platform-engineers/cue/basic',
            'platform-engineers/cue/definition-edit',
            'platform-engineers/cue/advanced',
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
          'Workflow System': [
            'platform-engineers/workflow/workflow',
            'platform-engineers/workflow/built-in-workflow-defs',
            'platform-engineers/workflow/cue-actions',
          ]
        },
        {
          'System Operation': [
            'platform-engineers/system-operation/bootstrap-parameters',
            'platform-engineers/system-operation/managing-clusters',
            'platform-engineers/system-operation/observability',
            'platform-engineers/system-operation/performance-finetuning',
          ]
        },
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
