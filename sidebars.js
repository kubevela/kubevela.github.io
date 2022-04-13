const { Component } = require("react");

module.exports = {
  docs: [
    "getting-started/introduction",
    "install",
    {
      type: "category",
      label: "Vela-Core",
      collapsed: false,
      items: [
        {
          type: "category",
          label: "Getting Started",
          collapsed: false,
          items: [
            "end-user/quick-start-cli",
            "case-studies/multi-cluster",
            "case-studies/jenkins-cicd",
            "case-studies/gitops",
            "case-studies/initialize-env",
          ],
        },
        {
          type: "category",
          label: "Basics",
          collapsed: false,
          items: [
            "getting-started/core-concept",
            "getting-started/architecture",
          ],
        },
        {
          type: "category",
          label: "How-to Guides",
          collapsed: true,
          items: [
            {
              type: "category",
              label: "Deploy Components",
              collapsed: false,
              items: [
                "end-user/components/helm",
                "end-user/components/cue/webservice",
                "end-user/components/cue/task",
                "end-user/components/cue/raw",
                "end-user/components/kustomize",
                "end-user/components/ref-objects",
                "end-user/components/more",
              ],
            },
            {
              "Cloud Resources": [
                "end-user/components/cloud-services/provision-and-consume-cloud-services",
                "end-user/components/cloud-services/provision-and-initiate-database",
                "end-user/components/cloud-services/secure-your-database-connection",
                "end-user/components/cloud-services/provision-an-RDS-instance-with-more-than-one-database",
              ],
            },
            "end-user/traits/ingress",
            "end-user/traits/rollout",
            "end-user/traits/service-binding",
            "end-user/traits/sidecar",
            "end-user/traits/more",
            "end-user/policies/health",
            "end-user/policies/apply-once",
            "end-user/policies/gc",
            "end-user/workflow/component-dependency-parameter",
            "end-user/workflow/webhook-notification",
            "end-user/version-control",
            "how-to/cli/addon/addon",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "VelaUX",
      collapsed: false,
      items: [
        {
          type: "category",
          label: "Getting Started",
          collapsed: false,
          items: [
            "quick-start",
            "tutorials/webservice",
            "tutorials/helm",
            "tutorials/consume-cloud-services",
            "tutorials/k8s-object",
            "tutorials/jenkins",
            "tutorials/trigger",
            "tutorials/workflows",
            "tutorials/sso"
            // "case-studies/jenkins-cicd",
            // "case-studies/canary-blue-green",
          ],
        },
        {
          type: "category",
          label: "Basics",
          collapsed: false,
          items: [
            "getting-started/velaux-concept",
          ],
        },
        {
          type: "category",
          label: "How-to Guides",
          collapsed: true,
          items: [

            // TODO: complete the docs
            {
              "Manage applications": [
                "how-to/dashboard/application/create-application",
                "how-to/dashboard/application/bind-new-environment",
                "how-to/dashboard/application/deploy-application",
                "how-to/dashboard/application/get-application-instance",
                "tutorials/scaler",
                "how-to/dashboard/application/get-application-log",
                "how-to/dashboard/application/get-application-endpoint",
                "how-to/dashboard/application/view-application-resource",
                "how-to/dashboard/application/get-application-revision",
                "how-to/dashboard/application/recycle-environment",
                "how-to/dashboard/application/delete-application",
              ],
            },
            {
              "Manage workflows": ["how-to/dashboard/workflow/overview"],
            },
            {
              "Manage traits": ["how-to/dashboard/trait/overview"],
            },
            {
              "Manage triggers": ["how-to/dashboard/trigger/overview"],
            },
            // {
            //   "Manage environment": ["how-to/dashboard/environment/overview"],
            // },
            {
              "Manage target": ["how-to/dashboard/target/overview"],
            },
            {
              "Manage config": ["how-to/dashboard/config/dex-connectors"],
            },
            // {
            //   "Manage cluster": [
            //     "how-to/dashboard/cluster/overview",
            //     "how-to/dashboard/cluster/connect-cluster",
            //     "how-to/dashboard/cluster/detach-cluster",
            //     "how-to/dashboard/cluster/set-cluster-dashboard",
            //     "how-to/dashboard/cluster/edit-cluster",
            //   ],
            // },
            // {
            //   "Manage addon": ["how-to/dashboard/addon/overview"],
            // },
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Extension",
      collapsed: true,
      items: [
        {
          type: "category",
          label: "Learning OAM",
          collapsed: false,
          items: [
            "platform-engineers/oam/oam-model",
            "platform-engineers/oam/x-definition",
          ],
        },
        {
          "Learning CUE": [
            "platform-engineers/cue/basic",
            "platform-engineers/cue/definition-edit",
            "platform-engineers/cue/advanced",
          ],
        },
        {
          "Custom Addons": [
            "platform-engineers/addon/intro",
            "platform-engineers/addon/terraform",
          ],
        },
        "platform-engineers/components/custom-component",
        {
          "Cloud Resources": [
            "platform-engineers/addon/terraform",
            "platform-engineers/components/component-terraform",
          ],
        },
        {
          type: "category",
          label: "Traits System",
          items: [
            "platform-engineers/traits/customize-trait",
            "platform-engineers/traits/patch-trait",
            "platform-engineers/traits/status",
            "platform-engineers/traits/advanced",
          ],
        },
        {
          "Workflow System": [
            "platform-engineers/workflow/workflow",
            "platform-engineers/workflow/cue-actions",
            "platform-engineers/workflow/working-mechanism",
          ],
        },
        {
          "System Operation": [
            "platform-engineers/system-operation/bootstrap-parameters",
            "platform-engineers/system-operation/managing-clusters",
            "platform-engineers/system-operation/observability",
            "platform-engineers/system-operation/performance-finetuning",
            "platform-engineers/system-operation/velaql",
          ],
        },
        "platform-engineers/debug/dry-run",
        "platform-engineers/x-def-version",
      ],
    },
    {
      type: "category",
      label: "References",
      items: [
        "cli/vela",
        {
          type: "category",
          label: "Built-in Addons",
          items: [
            "reference/addons/overview",
            "reference/addons/velaux",
            "reference/addons/terraform",
            "reference/addons/ai"
          ],
        },
        "end-user/components/cloud-services/cloud-resources-list",
        "end-user/components/references",
        "end-user/traits/references",
        "end-user/policies/references",
        "end-user/workflow/built-in-workflow-defs",
        "end-user/service-account-integration",
        "reference/ui-schema",
        "reference/user-improvement-plan",
        {
          label: "VelaUX API Doc",
          type: "link",
          href: "https://kubevela.stoplight.io/docs/kubevela/b3A6NDI5NzQxMzM-detail-definition",
        },
      ],
    },
    {
      type: "category",
      label: "Roadmap",
      items: ["roadmap/README"],
    },
    {
      type: "doc",
      id: "developers/references/devex/faq",
    },
  ],
};
