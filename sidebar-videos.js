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
            "talks/cn/vela-delivery-202206",
            "talks/cn/next-app-delivery",
            "talks/cn/multi-cluster",
            "talks/cn/gopher-china",
            "talks/cn/app-platform",
            "talks/cn/oam-manage-app",
            "talks/cn/oam-application",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Community Meetings",
      collapsed: false,
      items: [
        {
          type: "category",
          label: "Meetings in English",
          collapsed: false,
          items: [
            "meetings/en/meetings",
          ],
        },
        {
          type: "category",
          label: "中文社区会议 - Meetings in Chinese",
          collapsed: false,
          items: [
            "meetings/cn/v1.3",
            "meetings/cn/v1.2",
            "meetings/cn/v1.1",
            "meetings/cn/v1.0",
            "meetings/cn/before-v1.0",
          ],
        },
      ],
    },
  ],
};