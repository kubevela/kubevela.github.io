const { Component } = require('react');

module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'getting-started/introduction',
        },
        {
          type: 'category',
          collapsed: true,
          label: 'Installation',
          link: {
            type: 'doc',
            id: 'install',
          },
          items: [
            {
              type: 'doc',
              label: 'Standalone',
              id: 'installation/standalone',
            },
            {
              type: 'doc',
              label: 'Kubernetes',
              id: 'installation/kubernetes',
            },
          ],
        },
        {
          type: 'doc',
          id: 'quick-start',
        },
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'getting-started/separate-of-concern',
        'getting-started/core-concept',
        'getting-started/definition',
        'getting-started/architecture',
      ],
    },
    {
      type: 'category',
      label: 'User Guide',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Container Image CD',
          collapsed: true,
          items: [
            'tutorials/webservice',
            'end-user/traits/rollout',
            'end-user/traits/sidecar',
            'tutorials/custom-image-delivery',
          ],
        },
        {
          type: 'category',
          label: 'Helm Chart CD',
          collapsed: true,
          items: ['tutorials/helm', 'tutorials/helm-rollout'],
        },
        {
          type: 'category',
          label: 'Cloud Resources CD',
          collapsed: true,
          items: [
            'tutorials/consume-cloud-services',
            {
              type: 'category',
              label: 'Terraform',
              collapsed: true,
              link: {
                type: 'doc',
                id: 'end-user/components/cloud-services/cloud-resource-scenarios',
              },
              items: [
                'end-user/components/cloud-services/provision-and-consume-database',
                'end-user/components/cloud-services/provision-and-initiate-database',
                'end-user/components/cloud-services/secure-your-database-connection',
                'end-user/components/cloud-services/provision-an-RDS-instance-with-more-than-one-database',
                'end-user/components/cloud-services/provision-instance-and-database-separately',
              ],
            },
            'end-user/components/cloud-services/provision-cloud-resources-by-crossplane',
          ],
        },
        {
          type: 'category',
          label: 'Kubernetes Manifest CD',
          collapsed: true,
          items: ['tutorials/k8s-object', 'tutorials/k8s-object-rollout'],
        },
        {
          type: 'category',
          label: 'Multi Cluster Delivery',
          collapsed: true,
          items: [
            'case-studies/multi-cluster',
            'end-user/components/ref-objects',
          ],
        },
        {
          type: 'category',
          label: 'Multi Environment Delivery',
          collapsed: true,
          items: ['case-studies/initialize-env', 'tutorials/multi-env'],
        },
        {
          type: 'category',
          label: 'Application Workflow',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'end-user/workflow/overview',
          },
          items: [
            'end-user/workflow/operations',
            'end-user/workflow/suspend',
            'end-user/workflow/step-group',
            'end-user/workflow/dependency',
            'end-user/workflow/inputs-outputs',
            'end-user/workflow/if-condition',
            'end-user/workflow/timeout',
          ],
        },
        {
          type: 'category',
          label: 'Pipeline',
          collapsed: true,
          items: ['end-user/pipeline/workflowrun'],
        },
        {
          type: 'category',
          label: 'GitOps',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'case-studies/gitops',
          },
          items: ['end-user/gitops/fluxcd'],
        },
        {
          type: 'category',
          label: 'CI Integration',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'how-to/dashboard/trigger/overview',
          },
          items: ['tutorials/s2i', 'tutorials/jenkins', 'tutorials/trigger'],
        },
        {
          'Day-2 Operations': [
            'end-user/workflow/component-dependency-parameter',
            'end-user/version-control',
            'end-user/definition-version-control',
            'platform-engineers/debug/dry-run',
            'tutorials/access-application',
            'tutorials/auto-scaler',
            'tutorials/debug-app',
            'tutorials/cloud-shell',
            'tutorials/vela-top',
            'end-user/workflow/suspending-application-reconciliation',
            {
              type: 'category',
              label: 'Config Management',
              collapsed: false,
              items: [
                'how-to/dashboard/config/helm-repo',
                'how-to/dashboard/config/image-registry',
                'how-to/dashboard/config/read-write-config-in-pipeline',
                'how-to/dashboard/config/nacos',
                'how-to/dashboard/config/config-template',
              ],
            },
          ],
        },
        {
          'Application Policies': [
            'end-user/policies/shared-resource',
            'end-user/policies/resource-adoption',
            'end-user/policies/apply-once',
            'end-user/policies/gc',
            'end-user/policies/replication',
          ],
        },
        {
          type: 'category',
          label: 'Automated Observability',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'platform-engineers/operations/observability',
          },
          items: [
            'platform-engineers/operations/o11y/installation',
            'platform-engineers/operations/o11y/out-of-the-box',
            'platform-engineers/operations/o11y/metrics',
            'platform-engineers/operations/o11y/logging',
            'platform-engineers/operations/o11y/dashboard',
            'platform-engineers/operations/o11y/integration',
          ],
        },
        'end-user/components/more',
      ],
    },
    {
      type: 'category',
      label: 'Operator Manual',
      items: [
        {
          'Advanced Installation': [
            'platform-engineers/system-operation/bootstrap-parameters',
            'platform-engineers/advanced-install',
            'platform-engineers/system-operation/vela-cli-image',
            'platform-engineers/system-operation/system-info-diagnose',
          ],
        },
        {
          type: 'category',
          label: 'Production Precautions',
          collapsed: true,
          items: [
            'platform-engineers/system-operation/performance-finetuning',
            'platform-engineers/system-operation/controller-sharding',
            'platform-engineers/system-operation/controller-grayscale-release',
            'platform-engineers/system-operation/high-availability',
            'platform-engineers/system-operation/migration-from-old-version',
          ],
        },
        {
          type: 'category',
          label: 'User Management',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'how-to/dashboard/user/user',
          },
          items: ['tutorials/sso', 'how-to/dashboard/config/dex-connectors'],
        },
        'how-to/dashboard/user/project',
        {
          'Authentication and Authorization': [
            'how-to/dashboard/user/rbac',
            'platform-engineers/auth/basic',
            'platform-engineers/auth/advance',
            'platform-engineers/auth/integration',
            'platform-engineers/auth/definition-rbac',
          ],
        },
        {
          'Cluster Management': [
            'platform-engineers/system-operation/managing-clusters',
            'how-to/dashboard/target/overview',
            'platform-engineers/system-operation/working-with-ocm',
          ],
        },
        'platform-engineers/workflow/working-mechanism',
        {
          'UX Customization': [
            'platform-engineers/openapi-v3-json-schema',
            'reference/ui-schema',
          ],
        },
        'platform-engineers/status/application_health_status_metrics'
      ],
    },
    {
      type: 'category',
      label: 'Developer Guide',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'contributor/overview',
      },
      items: [
        {
          type: 'category',
          label: 'Addons',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'platform-engineers/addon/intro',
          },
          items: [
            'platform-engineers/addon/addon-cue',
            'platform-engineers/addon/addon-yaml',
            'reference/topology-rule',
            'platform-engineers/addon/addon-registry',
            'platform-engineers/system-operation/enable-addon-offline',
          ],
        },
        {
          'Cloud Resources': [
            'platform-engineers/addon/terraform',
            'platform-engineers/components/component-terraform',
          ],
        },
        {
          'Manage Definition with CUE': [
            'platform-engineers/cue/basic',
            'platform-engineers/cue/definition-edit',
            'platform-engineers/components/custom-component',
            'platform-engineers/traits/customize-trait',
            'platform-engineers/policy/custom-policy',
            'platform-engineers/workflow/workflow',
            {
              'Patch and Override': [
                'platform-engineers/traits/patch-trait',
                'platform-engineers/traits/organisation-trait',
                'platform-engineers/cue/patch-strategy',
              ],
            },
            'platform-engineers/system-operation/velaql',
            'platform-engineers/x-def-version',
            'platform-engineers/cue/external-packages',
            'platform-engineers/status/definition_health_status'
          ],
        },
        {
          'Manage Definitions with Go (defkit)': [
            'platform-engineers/defkit/overview',
            'platform-engineers/defkit/components',
            'platform-engineers/defkit/traits',
            'platform-engineers/defkit/policies',
            'platform-engineers/defkit/workflow-steps',
            'platform-engineers/defkit/parameters',
            'platform-engineers/defkit/templates-and-resources',
            'platform-engineers/defkit/health-and-status',
            'platform-engineers/defkit/placement',
            'platform-engineers/defkit/testing',
          ],
        },
        {
          'Contribution Guide': [
            'contributor/non-code-contribute',
            'contributor/code-contribute',
            'contributor/cli-ref-doc',
            'contributor/fig-auto-complete',
          ],
        },
        {
          Conventions: [
            'contributor/release-process',
            'contributor/code-conventions',
            'contributor/principle-of-test',
          ],
        },
        {
          'Debug': [
            'platform-engineers/debug/debugging-kubevela-controllers',
            'platform-engineers/debug/debugging-kubevela-with-webhook',
            'platform-engineers/debug/remote-debugging-kubevela-applications',
            'platform-engineers/debug/multicluster-debugging',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'References',
      items: [
        'cli/vela',
        'platform-engineers/oam/x-definition',
        'end-user/components/references',
        'end-user/traits/references',
        'end-user/policies/references',
        'end-user/workflow/built-in-workflow-defs',
        'platform-engineers/workflow/cue-actions',
        {
          type: 'category',
          label: 'Community Verified Addons',
          link: {
            type: 'doc',
            id: 'reference/addons/overview',
          },
          items: [
            'reference/addons/velaux',
            'reference/addons/rollout',
            'reference/addons/fluxcd',
            {
              'Cloud Resources': [
                'reference/addons/terraform',
                'reference/addons/crossplane',
              ],
            },
            'reference/addons/ai',
            'reference/addons/traefik',
            'reference/addons/cert-manager',
            'reference/addons/kubevela-io',
            'reference/addons/pyroscope',
            'reference/addons/vegeta',
            'reference/addons/ocm-gateway-manager-addon',
            'reference/addons/ocm-hub-control-plane',
            'reference/addons/vela-prism',
            'reference/addons/flink-kubernetes-operator',
            'reference/addons/chartmuseum',
          ],
        },
        'end-user/components/cloud-services/cloud-resources-list',
        'reference/config-template',
        'reference/user-improvement-plan',
        'platform-engineers/openapi/overview',
      ],
    },
    'roadmap/README',
    {
      type: 'doc',
      id: 'developers/references/devex/faq',
    },
  ],
};
