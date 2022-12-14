module.exports = {
  videos: [
    {
      type: "category",
      label: "Best Practice",
      collapsed: false,
      items: [
        "best-practice/jenkins",
        "best-practice/gitops",
        "best-practice/kubevela-nocalhost",
      ],
    },
    {
      type: "category",
      label: "Lessons",
      collapsed: false,
      items: [
        "lessons/live-1024",
      ],
    },
    {
      type: "category",
      label: "Talks",
      collapsed: false,
      items: [
        {
          type: "category",
          label: "Talks in English",
          collapsed: false,
          items: [
            "talks/en/cdfoundation-2022oct",
            "talks/en/kubecon-na-2022-office-hour",
            "talks/en/saiyam-cncf-minutes",
            "talks/en/application-centric-platform",
            "talks/en/devops-toolkit-2",
            "talks/en/devops-toolkit-1",
            "talks/en/standardizing-app",
            "talks/en/bytedance-practice",
            "talks/en/oam-dapr",
          ],
        },
        {
          type: "category",
          label: "中文演讲 - Talks in Chinese",
          collapsed: false,
          items: [
            "talks/cn/x-as-code",
            "talks/cn/vela-delivery-202206",
            "talks/cn/next-app-delivery",
            "talks/cn/multi-cluster",
            "talks/cn/gopher-china",
            "talks/cn/app-platform",
            "talks/cn/oam-manage-app",
            "talks/cn/oam-application",
            "talks/cn/open-kruise-game",
            "talks/cn/ackone",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Community Meetings",
      collapsed: false,
      items: [
        "meetings/meetings",
      ],
    },
  ],
};