const { fromGitHub } = require('./scripts/announcement');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
const config = {
  title: 'KubeVela',
  tagline: 'Platform Engineering. Simplified.',
  url: 'https://kubevela.io',
  baseUrl: '/',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  favicon: 'img/favicons/favicon.ico',
  organizationName: 'kubevela', // Usually your GitHub org/user name.
  projectName: 'kubevela.io', // Usually your repo name.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'], // Temporarily disabled Chinese locale during Docusaurus upgrade
    localeConfigs: {
      en: {
        label: 'English',
      },
      // zh: {
      //   label: '简体中文',
      // },
    },
  },
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  themeConfig: {
    // The card shown when a page is shared on Slack, social sites and the like.
    image: 'img/social-card.png',
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
          className: 'kv-version',
          // Archived versions are separate static builds outside the docs plugin.
          dropdownItemsAfter: ['v1.5', 'v1.4', 'v1.3', 'v1.2', 'v1.1', 'v1.0'].map((v) => ({
            href: `pathname:///docs/${v}`,
            label: `${v} (Archived)`,
            className: 'kv-archived-version',
          })),
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
          type: 'dropdown',
          label: 'Resources',
          position: 'left',
          items: [
            {
              to: 'videos/best-practice/jenkins',
              activeBasePath: 'videos',
              label: 'Videos',
            },
            {
              href: 'https://github.com/kubevela/samples',
              label: 'Examples',
            },
          ],
        },
        {
          href: 'https://github.com/kubevela/community',
          label: 'Community',
          position: 'left',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        // Search and Ask Devin sit together as one control.
        {
          type: 'search',
          position: 'right',
          className: 'kv-search',
        },
        {
          type: 'html',
          position: 'right',
          value: '<a href="https://deepwiki.com/kubevela/kubevela" target="_blank" rel="noopener noreferrer" class="navbar__link header-deepwiki-link" title="AI Search" aria-label="Ask Devin AI Search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/></svg><span>Ask Devin</span></a>',
        },
        {
          href: 'https://github.com/kubevela/kubevela',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
          position: 'right',
        },
        {
          href: 'https://cloud-native.slack.com/archives/C01BLQ3HTJA',
          className: 'header-slack-link',
          'aria-label': 'KubeVela on the CNCF Slack',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
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
              label: 'GitHub',
              href: 'https://github.com/kubevela/kubevela',
            },
            // The Chinese community's channels show on the Chinese site only.
            {
              label: 'DingTalk (23310022)',
              href: '.',
              className: 'kv-zh-only',
            },
            {
                html: '<div class="wechat kv-zh-only"> <a class="wechat-label">Wechat Group(Scan code to request joining)</a> <a class="wechat-img" rel="noreferrer noopener" aria-label="Wechat Group"><img src="https://kubevela.io/images/barnett-wechat.jpg" alt="Broker wechat to add you into the user group."></a></div>',
            },
          ],
        },
        {
          title: 'More',
          items: [
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
        © ${new Date().getFullYear()} The Linux Foundation. All rights reserved. The Linux Foundation has registered trademarks and uses trademarks. For a list of trademarks of The Linux Foundation, please see our <a href="https://www.linuxfoundation.org/trademark-usage/"> Trademark Usage</a> page.
      `,
    },
    // Diagrams in the site's neutrals rather than mermaid's default colours.
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
    prism: {
      // GitHub's code colours on light, One Dark on dark, both on the site's
      // slate backgrounds.
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.oneDark,
      additionalLanguages: ['cue', 'powershell'],
    },
    zoom: {
      selector: '.markdown :not(em) > img',
      config: {
        background: {
          light: 'rgba(248, 250, 252, 0.97)',
          dark: 'rgba(11, 18, 32, 0.97)',
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
            return `https://github.com/kubevela/kubevela.github.io/edit/main/docs/${docPath}`;
          },
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          includeCurrentVersion: true,
        },
        gtag: {
          trackingID: 'G-5GLR1Y52M7',
          anonymizeIP: false,
        },
        blog: {
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
          showReadingTime: true,
          editUrl: 'https://github.com/kubevela/kubevela.github.io/tree/main/',
          onInlineAuthors: 'ignore',
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
  // callTime shows the community call in the announcement bar in the reader's
  // own time zone.
  clientModules: [require.resolve('./src/clientModules/callTime.js'), require.resolve('./src/clientModules/konami.js')],
};

// The announcement bar and the next community call are read from GitHub at
// build time; with nothing to announce the site has no bar.
module.exports = async function createConfig() {
  // The language menu appears once the site has more than one language.
  if (config.i18n.locales.length < 2) {
    config.themeConfig.navbar.items = config.themeConfig.navbar.items.filter((i) => i.type !== 'localeDropdown');
  }
  const { announcementBar, nextCall } = await fromGitHub();
  if (announcementBar) {
    config.themeConfig.announcementBar = announcementBar;
  }
  config.customFields = { ...config.customFields, nextCall };
  return config;
};
