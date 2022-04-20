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
            // "case-studies/jenkins-cicd",
            "case-studies/gitops",
            "case-studies/initialize-env",
          ],
        },
        {
          type: "category",
          label: "Basics",
          collapsed: true,
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
            {
              "Multi-Cluster Delivery": [
                "platform-engineers/system-operation/managing-clusters",
              ],
            },
            "end-user/traits/ingress",
            "end-user/traits/service-binding",
            "end-user/traits/sidecar",
            "end-user/policies/health",
            "end-user/workflow/webhook-notification",
            {
              "Day-2 Operations": [
                "end-user/traits/rollout",
                "end-user/traits/more",
              ],
            },
            {
              "Advanced Features": [
                "end-user/workflow/component-dependency-parameter",
                "end-user/version-control",
                "end-user/policies/apply-once",
                "end-user/policies/gc",
              ],
            },
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
            "tutorials/sso",
          ],
        },
        {
          type: "category",
          label: "Basics",
          collapsed: true,
          items: ["getting-started/velaux-concept"],
        },
        {
          type: "category",
          label: "How-to Guides",
          collapsed: true,
          items: [
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
            {
              "Manage resource": ["how-to/dashboard/target/overview"],
            },
            "how-to/dashboard/user/user",
            "how-to/dashboard/user/rbac",
            "how-to/dashboard/user/project",
            {
              "Manage integration configs": [
                "how-to/dashboard/config/dex-connectors",
                "how-to/dashboard/config/helm-repo",
              ],
            },
            "how-to/dashboard/addon/overview",
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
          "Addons": [
            "how-to/cli/addon/addon",
            "platform-engineers/addon/intro",
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
        "platform-engineers/system-operation/velaql",
        "platform-engineers/debug/dry-run",
        "platform-engineers/x-def-version",
      ],
    },
    {
      type: "category",
      label: "Operator Manual",
      items: [
        "platform-engineers/system-operation/bootstrap-parameters",
        "end-user/service-account-integration",
        "platform-engineers/system-operation/offline-installation",
        "platform-engineers/system-operation/observability",
        "platform-engineers/system-operation/performance-finetuning",
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
            "reference/addons/ai",
          ],
        },
        "end-user/components/cloud-services/cloud-resources-list",
        "end-user/components/references",
        "end-user/traits/references",
        "end-user/policies/references",
        "end-user/workflow/built-in-workflow-defs",
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
