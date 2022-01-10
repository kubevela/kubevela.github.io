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
        "quick-start",
      ],
    },
    {
      type: "category",
      label: "Install",
      collapsed: false,
      items: ["install"],
    },
    {
      type: "category",
      label: "Tutorials",
      collapsed: false,
      items: [
        "deliver-app/webservice",
        "deliver-app/helm",
        "deliver-app/k8s-object",
        "deliver-app/consume-cloud-services",
        "deliver-app/scaler",
        "deliver-app/workflows",
      ],
    },
    {
      type: "category",
      label: "Best Practices",
      collapsed: false,
      items: [
        "case-studies/jenkins-cicd",
        "case-studies/gitops",
        // 'case-studies/initialize-env',
        "case-studies/canary-blue-green",
      ],
    },
    {
      type: "category",
      label: "How-to Guides",
      collapsed: true,
      items: [
        {
          Dashboard: [
            {
              "Manage application": [
                "how-to/dashboard/application/overview",
                "how-to/dashboard/application/create-application",
                "how-to/dashboard/application/deploy-application",
                "how-to/dashboard/application/get-application-instance",
                "how-to/dashboard/application/get-application-log",
                "how-to/dashboard/application/get-application-endpoint",
                "how-to/dashboard/application/get-application-revision",
                "how-to/dashboard/application/bind-new-environment",
                "how-to/dashboard/application/recycle-environment",
                "how-to/dashboard/application/delete-application",
              ],
            },
            {
              "Manage workflow": ["how-to/dashboard/workflow/overview"],
            },
            {
              "Manage trait": ["how-to/dashboard/trait/overview"],
            },
            {
              "Manage environment": ["how-to/dashboard/environment/overview"],
            },
            {
              "Manage target": ["how-to/dashboard/target/overview"],
            },
            {
              "Manage cluster": [
                "how-to/dashboard/cluster/overview",
                "how-to/dashboard/cluster/connect-cluster",
                "how-to/dashboard/cluster/detach-cluster",
                "how-to/dashboard/cluster/set-cluster-dashboard",
                "how-to/dashboard/cluster/edit-cluster",
              ],
            },
            {
              "Manage addon": [],
            },
          ],
          CLI: [
            "end-user/quick-start-cli",
            {
              "Deploying Components": [
                "end-user/components/helm",
                "end-user/components/kustomize",
                "end-user/components/cloud-services/provider-and-consume-cloud-services",

                "end-user/components/cue/raw",
                "end-user/components/more",
              ],
            },
            {
              "Attaching Traits": [
                "end-user/traits/ingress",
                "end-user/traits/rollout",
                "end-user/traits/autoscaler",
                "end-user/traits/annotations-and-labels",
                "end-user/traits/service-binding",
                "end-user/traits/sidecar",
                "end-user/traits/kustomize-patch",
                "end-user/traits/more",
              ],
            },
            {
              "Defining Policies": [
                "end-user/policies/envbinding",
                "end-user/policies/health",
              ],
            },
            {
              "Designing Workflow": [
                "end-user/workflow/built-in-workflow-defs",
                "end-user/workflow/webhook-notification",
                "end-user/workflow/component-dependency-parameter",
              ],
            },
            "case-studies/multi-cluster",
            "end-user/version-control",
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
        {
          Debugging: ["platform-engineers/debug/dry-run"],
        },
      ],
    },
    {
      type: "category",
      label: "References",
      items: [
        {
          type: "category",
          label: "CLI Command",
          items: [
            "cli/vela_components",
            "cli/vela_config",
            "cli/vela_env",
            "cli/vela_init",
            "cli/vela_up",
            "cli/vela_version",
            "cli/vela_exec",
            "cli/vela_logs",
            "cli/vela_ls",
            "cli/vela_port-forward",
            "cli/vela_show",
            "cli/vela_status",
            "cli/vela_workloads",
            "cli/vela_traits",
            "cli/vela_system",
            "cli/vela_template",
            "cli/vela_cap",
          ],
        },
        {
          "Supported Cloud Resource": [
            "end-user/components/cloud-services/terraform/alibaba-ack",
            "end-user/components/cloud-services/terraform/alibaba-eip",
            "end-user/components/cloud-services/terraform/alibaba-rds",
            "end-user/components/cloud-services/terraform/alibaba-oss",
            "end-user/components/cloud-services/terraform/alibaba-redis",
            "end-user/components/cloud-services/terraform/alibaba-vpc",
            "end-user/components/cloud-services/terraform/azure-database-mariadb",
            "end-user/components/cloud-services/terraform/azure-storage-account",
            "end-user/components/cloud-services/terraform/aws-s3",
          ],
        },
        {
          "Built-in Component Type": [
            "end-user/components/cue/webservice",
            "end-user/components/cue/worker",
            "end-user/components/cue/task",
          ],
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
