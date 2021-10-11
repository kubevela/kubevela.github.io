/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'KubeVela',
  tagline: 'Make shipping applications more enjoyable.',
  url: 'https://kubevela.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: 'img/favicon.ico',
  organizationName: 'oam-dev', // Usually your GitHub org/user name.
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
        '⭐️ If you like KubeVela, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/oam-dev/kubevela">GitHub</a>! ⭐️',
    },
    algolia: {
      apiKey: 'f19c90b8ffe16ed118dae930cd070507',
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
          position: 'left'
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/oam-dev/kubevela',
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
              label: 'Case Studies',
              to: '/docs/case-studies/jenkins-cicd',
            },
            {
              label: 'Administrator Manuals',
              to: '/docs/platform-engineers/oam/oam-model',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'CNCF Slack ( #kubevela channel )',
              href: 'https://slack.cncf.io/'
            },
            {
              label: 'Gitter',
              href: 'https://gitter.im/oam-dev/community',
            },
            {
              label: 'DingTalk (23310022)',
              href: '.',
            },
            {
              html: '<div class="wechat"> <a class="wechat-label">Wechat Group(Scan code to request joining)</a> <a class="wechat-img" rel="noreferrer noopener" aria-label="Wechat Group"><img src="https://static.kubevela.net/images/barnett-wechat.jpg" alt="Broker wechat to add you into the user group."></div>',
            }
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/oam-dev/kubevela',
            },
            {
              label: 'Blog',
              to: 'blog',
            },
          ],
        },
      ],
      copyright: `
        <br />
        <strong>© KubeVela Authors ${new Date().getFullYear()} | Documentation Distributed under <a href="https://creativecommons.org/licenses/by/4.0">CC-BY-4.0</a> </strong> <strong>| Powered by <a href="https://www.netlify.com">Netlify</a></strong>
        <br />
        <br />
        © ${new Date().getFullYear()} The Linux Foundation. All rights reserved. The Linux Foundation has registered trademarks and uses trademarks. For a list of trademarks of The Linux Foundation, please see our <a href="https://www.linuxfoundation.org/trademark-usage/"> Trademark Usage</a> page.
      `,
    },
    prism: {
      theme: require('prism-react-renderer/themes/dracula'),
    },
    gtag: {
      trackingID: 'G-5GLR1Y52M7',
      anonymizeIP: false,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: function ({
            locale,
            docPath,
          }) {
            return `https://github.com/oam-dev/kubevela.io/edit/main/docs/${docPath}`;
          },
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          includeCurrentVersion: true,
          lastVersion: 'v1.1',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/oam-dev/kubevela.io/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
