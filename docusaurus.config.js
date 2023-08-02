/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'KubeVela',
  tagline: 'Make shipping applications more enjoyable.',
  url: 'https://kubevela.io',
  baseUrl: '/',
  trailingSlash: true,
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
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  themeConfig: {
    announcementBar: {
      id: 'start',
      content:
          '<div class="header-item">⭐️ If you like KubeVela, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/kubevela/kubevela">GitHub</a>!⭐️</div>' +
          '<div class="header-item"><span>KubeVela v1.8.0 is now available.(2023-04-20)</span> <a target="_blank" style="color: var(--ifm-color-primary)" rel="noopener noreferrer" href="https://github.com/kubevela/kubevela/releases/tag/v1.8.0">Read Release Note</a></div>',
    },
    algolia: {
      appId: 'PXMFHFWUGZ',
      apiKey: '2d1f4924c15d2cc0947820c01e65521f',
      indexName: 'kubevela',
      contextualSearch: false,
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
            {
              to: '/micro',
              label: 'Microservice',
            },
          ],
        },
      ],
      copyright: `
        <br />
        <strong>© KubeVela Authors ${new Date().getFullYear()} | Documentation Distributed under <a href="https://creativecommons.org/licenses/by/4.0">CC-BY-4.0</a> </strong> 
        <br />
        <br />
        © ${new Date().getFullYear()} The Linux Foundation. All rights reserved. The Linux Foundation has registered trademarks and uses trademarks. For a list of trademarks of The Linux Foundation, please see our <a href="https://www.linuxfoundation.org/trademark-usage/"> Trademark Usage</a> page.
        <br />
        <a href="https://zzlz.gsxt.gov.cn/businessCheck/verifKey.do?showType=p&serial=913301105865146816-SAIC_SHOW_1000009133011058651468161661997004982&signData=MEYCIQDV2SEwsPqwXWkyqyF/+schpsqmPrjT8uEplDrD7xfdhgIhAKoSoKR6iR+YPF4q4CCLYvm8ruB1nFKRkibUx1A5n/Kn" target="_blank"><img style="width: 20px;margin-bottom: -5px;" src="/img/beian/license.gif"/></a> <a target="_blank" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33011002016698" style="display:inline-block;text-decoration:none;height:20px;line-height:20px;"><img src="" style="float:left;"/><p style="height:20px;line-height:20px;margin: 0px 0px 0px 5px; color:#939393;">浙公网安备 33011002016698号</p></a> <a href="https://beian.miit.gov.cn/" target="_blank">浙ICP备12022327号-975</a>
      `,
    },
    prism: {
      theme: require('prism-react-renderer/themes/dracula'),
      additionalLanguages: ['cue', 'powershell'],
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
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/img/favicons/apple-touch-icon.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/img/favicons/favicon-32x32.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/img/favicons/favicon-16x16.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/img/favicons/favicon.svg',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/png',
        href: '/img/favicons/favicon.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'manifest',
        href: '/img/favicons/site.webmanifest',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'mask-icon',
        color: '#ffffff',
        href: '/img/favicons/safari-pinned-tab.svg',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#ffffff',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'msapplication-config',
        content: '/img/favicons/browserconfig.xml',
      },
    },
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: function ({locale, docPath}) {
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
    require.resolve('docusaurus-plugin-image-zoom'),
  ],
  scripts: [
    {
      src: '/custom.js',
      async: true,
    },
    {
      src: '//g.alicdn.com/mamba/assets/0.0.15/mse-arc-ui.min.js',
    },
  ],
  stylesheets: [
    {
      href: '//g.alicdn.com/mamba/assets/0.0.15/mse-arc-ui.min.css',
    },
  ],
};
