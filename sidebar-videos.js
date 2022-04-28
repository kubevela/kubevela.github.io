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
      collapsed: true,
      items: [
        "lessons/live-1024",
      ],
    },
    {
      type: "category",
      label: "Talks",
      collapsed: true,
      items: [
        {
          type: "category",
          label: "Talks in English",
          collapsed: false,
          items: [
            "talks/en/standardizing-app",
          ],
        },
        {
          type: "category",
          label: "Talks in Chinese",
          collapsed: false,
          items: [
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
      collapsed: true,
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
          label: "Meetings in Chinese",
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