const { Component } = require("react");

module.exports = {
  docs: [
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: [
        "getting-started/introduction",
        "getting-started/core-concept",
        "getting-started/architecture",
        "install",
        "quick-start",
      ],
    },
    {
      type: "category",
      label: "Tutorials",
      collapsed: false,
      items: [
        "tutorials/webservice",
        "tutorials/helm",
        "tutorials/consume-cloud-services",
        "tutorials/k8s-object",
        "tutorials/jenkins",
        "tutorials/trigger",
        "case-studies/gitops",
        "tutorials/workflows",
        // "case-studies/jenkins-cicd",
        // "case-studies/canary-blue-green",
      ],
    },
    {
      type: "category",
      label: "How-to Guides",
      collapsed: true,
      items: [
        // TODO:
        {
          type: "category",
          label: "VelaUX",
          collapsed: false,
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
            // {
            //   "Manage workflow": ["how-to/dashboard/workflow/overview"],
            // },
            {
              "Manage traits": ["how-to/dashboard/trait/overview"],
            },
            {
              "Manage triggers": ["how-to/dashboard/trigger/overview"],
            },
            // {
            //   "Manage environment": ["how-to/dashboard/environment/overview"],
            // },
            // {
            //   "Manage target": ["how-to/dashboard/target/overview"],
            // },
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
        {
          type: "category",
          label: "CLI",
          collapsed: true,
          items: [
            "end-user/quick-start-cli",
            "end-user/traits/ingress",
            "end-user/components/cloud-services/provider-and-consume-cloud-services",
            "end-user/traits/rollout",
            "end-user/policies/health",
            "case-studies/multi-cluster",
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
          "Addon System": ["platform-engineers/addon/intro"],
        },
        {
          type: "category",
          label: "Component System",
          items: [
            "platform-engineers/components/custom-component",
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
          items: ["reference/addons/overview", "reference/addons/velaux"],
        },
        {
          type: "category",
          label: "Supported Cloud Resource",
          items: [
            "end-user/components/cloud-services/terraform/alibaba-ack",
            "end-user/components/cloud-services/terraform/alibaba-ask",
            "end-user/components/cloud-services/terraform/alibaba-eip",
            "end-user/components/cloud-services/terraform/alibaba-oss",
            "end-user/components/cloud-services/terraform/alibaba-rds",
            "end-user/components/cloud-services/terraform/alibaba-redis",
            "end-user/components/cloud-services/terraform/alibaba-sls-project",
            "end-user/components/cloud-services/terraform/alibaba-sls-store",
            "end-user/components/cloud-services/terraform/alibaba-vpc",
            "end-user/components/cloud-services/terraform/alibaba-vswitch",
            "end-user/components/cloud-services/terraform/aws-s3",
            "end-user/components/cloud-services/terraform/azure-database-mariadb",
            "end-user/components/cloud-services/terraform/azure-storage-account",
          ],
        },
        {
          type: "category",
          label: "Built-in Component Type",
          items: [
            "end-user/components/helm",
            "end-user/components/cue/webservice",
            "end-user/components/cue/worker",
            "end-user/components/cue/task",
            "end-user/components/kustomize",
            "end-user/components/cue/raw",
            "end-user/components/more",
          ],
        },
        {
          type: "category",
          label: "Built-in Trait Type",
          items: [
            "end-user/traits/scaler",
            "end-user/traits/ingress",
            "end-user/traits/storage",
            "end-user/traits/rollout",
            "end-user/traits/annotations-and-labels",
            "end-user/traits/service-binding",
            "end-user/traits/sidecar",
            "end-user/traits/autoscaler",
            "end-user/traits/kustomize-patch",
            "end-user/traits/more",
          ],
        },
        {
          type: "category",
          label: "Built-in Policy Type",
          items: ["end-user/policies/envbinding"],
        },
        "end-user/workflow/built-in-workflow-defs",
        "reference/ui-schema",
        "reference/user-improvement-plan",
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
