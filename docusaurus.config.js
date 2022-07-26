/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'KubeVela',
  tagline: 'Make shipping applications more enjoyable.',
  url: 'https://kubevela.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: 'img/favicons/favicon.ico',
  organizationName: 'kubevela', // Usually your GitHub org/user name.
  projectName: 'kubevela.io', // Usually your repo name.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    localeConfigs: {
      en: {
        label: 'English',
      },
      zh: {
        label: '简体中文',
      },
    },
  },
  themeConfig: {
    announcementBar: {
      id: 'start',
      content:
        '⭐️ If you like KubeVela, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/kubevela/kubevela">GitHub</a>!⭐️' +
        '<span style="color:#1b58f4">KubeVela v1.4.8 is already released.(2022-07-20)</span> <a target="_blank" rel="noopener noreferrer" href="https://github.com/kubevela/kubevela/releases/v1.4.8">Read Release Note</a>',
    },
    algolia: {
      appId: 'PXMFHFWUGZ',
      apiKey: '2d1f4924c15d2cc0947820c01e65521f',
      indexName: 'kubevela',
    },
    navbar: {
      title: 'KubeVela',
      logo: {
        alt: 'KubeVela',
        src: 'img/logo.svg',
        srcDark: 'img/logoDark.svg',
      },
      items: [
        {
          type: 'docsVersionDropdown',
          position: 'right',
        },
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Documentation',
          position: 'left',
        },
        {
          to: 'blog',
          label: 'Blog',
          position: 'left',
        },
        {
          to: 'videos/best-practice/jenkins',
          activeBasePath: 'videos',
          label: 'Videos',
          position: 'left',
        },
        {
          href: 'https://github.com/kubevela/community',
          label: 'Community',
          position: 'left',
        },
        {
          href: 'https://github.com/kubevela/samples',
          label: 'Examples',
          position: 'left',
        },
        {
          href: 'https://kubevela.net',
          label: 'Mirror',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/kubevela/kubevela',
          className: 'header-github-link',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/quick-start',
            },
            {
              label: 'Tutorials',
              to: '/docs/tutorials/webservice',
            },
            {
              label: 'Core Concepts',
              to: '/docs/getting-started/core-concept',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'CNCF Slack ( #kubevela channel )',
              href: 'https://cloud-native.slack.com/archives/C01BLQ3HTJA',
            },
            {
              label: 'DingTalk (23310022)',
              href: '.',
            },
            {
              html: '<div class="wechat"> <a class="wechat-label">Wechat Group(Scan code to request joining)</a> <a class="wechat-img" rel="noreferrer noopener" aria-label="Wechat Group"><img src="https://static.kubevela.net/images/barnett-wechat.jpg" alt="Broker wechat to add you into the user group."></div>',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/kubevela/kubevela',
            },
            {
              label: 'Blog',
              to: 'blog',
            },
            {
              label: 'Videos',
              to: 'videos/best-practice/jenkins',
            },
          ],
        },
      ],
      copyright: `
        <br />
        <strong>© KubeVela Authors ${new Date().getFullYear()} | Documentation Distributed under <a href="https://creativecommons.org/licenses/by/4.0">CC-BY-4.0</a> </strong> 
        <br />
        <br />
        © ${new Date().getFullYear()} The Linux Foundation. All rights reserved. The Linux Foundation has registered trademarks and uses trademarks. For a list of trademarks of The Linux Foundation, please see our <a href="https://www.linuxfoundation.org/trademark-usage/"> Trademark Usage</a> page. <a href="https://beian.miit.gov.cn/" target="_blank">浙ICP备12022327号</a>
      `,
    },
    prism: {
      theme: require('prism-react-renderer/themes/dracula'),
    },
    zoom: {
      selector: '.markdown :not(em) > img',
      config: {
        background: {
          light: 'rgb(255, 255, 255)',
          dark: 'rgb(50, 50, 50)',
        },
      },
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: function ({ locale, docPath }) {
            return `https://github.com/kubevela/kubevela.io/edit/main/docs/${docPath}`;
          },
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          includeCurrentVersion: true,
          remarkPlugins: [require('mdx-mermaid')],
        },
        gtag: {
          trackingID: 'G-5GLR1Y52M7',
          anonymizeIP: false,
        },
        blog: {
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
          showReadingTime: true,
          editUrl: 'https://github.com/kubevela/kubevela.io/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.scss'),
        },
      },
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'videos',
        path: 'videos',
        routeBasePath: 'videos',
        include: ['**/*.md'],
        sidebarPath: require.resolve('./sidebar-videos.js'),
        showLastUpdateAuthor: true,
        showLastUpdateTime: true,
      },
    ],
    'docusaurus-plugin-sass',
    './src/plugins/faviconCustomPlugin',
    require.resolve('docusaurus-plugin-image-zoom'),
  ],
};
