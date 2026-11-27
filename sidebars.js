const {withReleases} = require('./sidebars-releases.js');

const sidebars = {
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
            'platform-engineers/advanced-install',
            'platform-engineers/system-operation/bootstrap-parameters',
            'platform-engineers/system-operation/offline-installation',
            'platform-engineers/system-operation/vela-cli-image',
          ],
        },
        {
          type: 'doc',
          id: 'quick-start',
        },
        'getting-started/advanced-application',
        'getting-started/sources',
        'getting-started/first-component',
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
            'end-user/traits/sidecar',
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
            {type: 'link', label: 'Terraform', href: '/terraform/overview'},
            'end-user/components/cloud-services/provision-cloud-resources-by-crossplane',
          ],
        },
        {
          type: 'category',
          label: 'Kubernetes Manifest CD',
          collapsed: true,
          items: ['tutorials/k8s-object'],
        },
        {
          type: 'category',
          label: 'Multi Cluster Delivery',
          collapsed: true,
          items: [
            'end-user/policies/multi-cluster',
            'end-user/policies/multi-cluster-override',
            'end-user/policies/multi-cluster-reuse',
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
          label: 'Property Expressions',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'end-user/cel-expressions',
          },
          items: [
            'end-user/reading-components',
            'end-user/cel-expressions-lifecycle',
          ],
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
            {type: 'link', label: 'Suspend and Resume', href: '/workflow/next/steps/suspend'},
            {type: 'link', label: 'Order Steps', href: '/workflow/next/steps/order-steps'},
            {type: 'link', label: 'Repeating Steps with forEach', href: '/workflow/next/steps/for-each'},
            'end-user/workflow/component-dependency-parameter',
            {type: 'link', label: 'Data Passing', href: '/workflow/next/steps/inputs-outputs'},
            {type: 'link', label: 'If Conditions', href: '/workflow/next/steps/if-condition'},
            'end-user/workflow/expressions',
            {type: 'link', label: 'Timeout of Step', href: '/workflow/next/steps/timeout'},
          ],
        },
        {
          type: 'category',
          label: 'Pipeline',
          collapsed: true,
          items: [{type: 'link', label: 'WorkflowRun', href: '/workflow/next/workflowrun'}],
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
          items: [
            'tutorials/s2i',
            {type: 'link', label: 'Triggers in VelaUX', href: '/velaux/delivery/triggers'},
            {type: 'link', label: 'Harbor Image Registry', href: '/velaux/delivery/harbor-trigger'},
          ],
        },
        {
          'Day-2 Operations': [
            'end-user/version-control',
            'end-user/definition-version-control',
            'tutorials/access-application',
            'tutorials/auto-scaler',
            'tutorials/debug-app',
            {type: 'link', label: 'Cloud Shell', href: '/velaux/applications/cloud-shell'},
            'tutorials/vela-top',
            {
              type: 'category',
              label: 'AI Agents (vela mcp)',
              items: ['tutorials/vela-mcp', 'tutorials/vela-mcp-security', 'reference/vela-mcp-tools'],
            },
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
              ],
            },
          ],
        },
        {
          'Application Policies': [
            'end-user/policies/shared-resource',
            'end-user/policies/resource-adoption',
            'end-user/policies/resource-adoption-cli',
            'end-user/policies/apply-once',
            'end-user/policies/resource-selectors',
            'end-user/policies/gc',
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
            'platform-engineers/operations/o11y/controller-metrics',
            'platform-engineers/operations/o11y/logging',
            'platform-engineers/operations/o11y/dashboard',
            'platform-engineers/operations/o11y/integration',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Operator Manual',
      items: [
        'end-user/components/more',
        {
          type: 'category',
          label: 'Production Operations',
          collapsed: true,
          items: [
            'platform-engineers/system-operation/performance-finetuning',
            'platform-engineers/system-operation/controller-sharding',
            'platform-engineers/system-operation/high-availability',
            'platform-engineers/system-operation/controller-grayscale-release',
            'platform-engineers/system-operation/system-info-diagnose',
            'platform-engineers/system-operation/workflow-http-protection',
          ],
        },
        {
          type: 'category',
          label: 'VelaUX',
          collapsed: true,
          items: [
            {type: 'link', label: 'Concepts', href: '/velaux/overview'},
            {type: 'link', label: 'Install', href: '/velaux/install'},
            {type: 'link', label: 'Users', href: '/velaux/users/overview'},
            {type: 'link', label: 'Projects', href: '/velaux/users/projects'},
            {type: 'link', label: 'SSO Login', href: '/velaux/users/sso'},
          ],
        },
        {
          'Authentication and Authorization': [
            {type: 'link', label: 'VelaUX RBAC', href: '/velaux/users/rbac'},
            'platform-engineers/auth/basic',
            'platform-engineers/auth/advance',
            'platform-engineers/auth/integration',
            'platform-engineers/auth/definition-rbac',
            'platform-engineers/auth/definition-restrictions',
          ],
        },
        {
          'Cluster Management': [
            'platform-engineers/system-operation/managing-clusters',
            {type: 'link', label: 'Targets in VelaUX', href: '/velaux/delivery/targets'},
            'platform-engineers/system-operation/working-with-ocm',
          ],
        },
        'platform-engineers/workflow/working-mechanism',
        {
          'UX Customization': [
            {type: 'link', label: 'UX of Definition', href: '/velaux/extend/ui-schema'},
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
          items: [
            // Addon authoring lives in the Addons section; the topology rules apply to any workload, so they stay.
            {type: 'link', label: 'Make Your Own Addon', href: '/addons/developer/make-your-own-addon'},
            {type: 'link', label: 'Addon Reference', href: '/addons/developer/addon-reference'},
            {type: 'link', label: 'Addon Application in CUE or YAML', href: '/addons/developer/addon-application'},
            'reference/topology-rule',
            {type: 'link', label: 'Build your Own Registry', href: '/addons/developer/addon-registry'},
          ],
        },
        {
          type: 'category',
          label: 'Crates',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'platform-engineers/crate/intro',
          },
          items: [
            'platform-engineers/crate/crate-registry',
            'platform-engineers/crate/crate-install',
            'platform-engineers/crate/crate-author',
            'platform-engineers/crate/crate-crossplane',
            'platform-engineers/crate/crate-multicluster',
            'platform-engineers/crate/crate-addon',
          ],
        },
        {
          type: 'category',
          label: 'Sources',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'platform-engineers/source/intro',
          },
          items: [
            'platform-engineers/source/using-sources',
            'platform-engineers/source/built-in-sources',
            'platform-engineers/source/authoring-source-definition',
            'platform-engineers/source/caching-and-operations',
          ],
        },
        {
          'Cloud Resources': [{type: 'link', label: 'Terraform', href: '/terraform/extend/cloud-resource-component'}],
        },
        {
          'Manage Definition with Go (defkit)': [
            {
              type: 'category',
              label: 'Introduction',
              items: [
                'platform-engineers/defkit/overview',
                'platform-engineers/defkit/quick-start',
                'platform-engineers/defkit/architecture',
                'platform-engineers/defkit/modules',
                'platform-engineers/defkit/share-a-module',
                'platform-engineers/defkit/definition-register',
              ],
            },
            {
              type: 'category',
              label: 'Definition Builders',
              items: [
                'platform-engineers/defkit/definition-component',
                'platform-engineers/defkit/definition-trait',
                'platform-engineers/defkit/definition-policy',
                'platform-engineers/defkit/template-workflowstep-actions',
              ],
            },
            'platform-engineers/defkit/param-scalar-types',
            {
              type: 'category',
              label: 'Resource Builders',
              items: [
                'platform-engineers/defkit/resource-builder',
                'platform-engineers/defkit/collections-api',
                'platform-engineers/defkit/value-expressions',
                'platform-engineers/defkit/velactx',
                'platform-engineers/defkit/health-status-dsl',
              ],
            },
            {
              type: 'category',
              label: 'Template Methods',
              items: [
                'platform-engineers/defkit/template-output-methods',
                'platform-engineers/defkit/template-patch-methods',
                'platform-engineers/defkit/template-raw-cue',
              ],
            },
            'platform-engineers/defkit/advanced-api',
            'platform-engineers/defkit/cluster-placement',
            'platform-engineers/defkit/module-hooks',
            'platform-engineers/defkit/testing',
            'platform-engineers/defkit/examples',
            'platform-engineers/defkit/migration',
          ],
        },
        {
          'Manage Definition with CUE': [
            'platform-engineers/cue/basic',
            'platform-engineers/cue/parameter-markers',
            'platform-engineers/openapi-v3-json-schema',
            'platform-engineers/cue/definition-edit',
            {
              type: 'category',
              label: 'Testing CUE Definitions',
              link: {type: 'doc', id: 'platform-engineers/cue/definition-testing'},
              items: [
                'platform-engineers/cue/definition-testing-functions',
                'platform-engineers/cue/definition-testing-expectations',
                'platform-engineers/cue/definition-testing-mocks-hooks',
                'platform-engineers/cue/definition-testing-cli',
              ],
            },
            'platform-engineers/components/custom-component',
            'platform-engineers/components/replication',
            'tutorials/custom-image-delivery',
            'platform-engineers/traits/customize-trait',
            'platform-engineers/traits/postdispatch-traits',
            'platform-engineers/cue/definition-inheritance',
            'platform-engineers/policy/custom-policy',
            'platform-engineers/policy/application-scoped-policy',
            'platform-engineers/policy/policy-rollout',
            'platform-engineers/policy/policy-context-schema',
            {type: 'link', label: 'Workflow Step Definition', href: '/workflow/next/authoring/step-definition'},
            'platform-engineers/traits/patch-trait',
            'platform-engineers/system-operation/velaql',
            'platform-engineers/cue/external-packages',
            'platform-engineers/cue/builtin-utils',
            'platform-engineers/status/definition_health_status'
          ],
        },
        {
          'Contribution Guide': [
            'contributor/non-code-contribute',
            'contributor/code-contribute',
            'contributor/cli-ref-doc',
          ],
        },
        {
          Conventions: [
            'contributor/release-process',
            'contributor/upgrade-go-k8s',
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
        'platform-engineers/oam/definition-file',
        'platform-engineers/oam/x-definition',
        'platform-engineers/context-reference',
        'end-user/components/references',
        'end-user/traits/references',
        'end-user/policies/references',
        'end-user/workflow/built-in-workflow-defs',
        'platform-engineers/workflow/cue-actions',
        {
          type: 'category',
          label: 'Addons',
          items: [
            {type: 'link', label: 'Addon catalog', href: '/addons/overview'},
            {type: 'link', label: 'VelaUX', href: '/velaux/install'},
          ],
        },
        {type: 'link', label: 'Cloud Resource List', href: '/terraform/reference/cloud-resources-list'},
        'reference/config-template',
        {type: 'link', label: 'VelaUX REST API', href: '/velaux/reference/rest-api'},
        {type: 'link', label: 'VelaUX Usage Data', href: '/velaux/reference/user-improvement-plan'},
      ],
    },
    'roadmap/README',
    {
      type: 'doc',
      id: 'developers/references/devex/faq',
    },
  ],
};

// Release Notes and Upgrade Guides, grouped under Releases.
sidebars.docs = withReleases(sidebars.docs);

module.exports = sidebars;
