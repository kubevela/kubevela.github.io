const { fromGitHub } = require('./scripts/announcement');

// Copy release-notes/ and upgrade-guides/ into every docs version before any plugin
// loads. See scripts/sync-release-pages.js.
const {syncReleasePages, releasePagesPlugin} = require('./scripts/sync-release-pages.js');
const {SECTIONS} = require('./sidebars-releases.js');
syncReleasePages();
// /docs/release-notes/..., /docs/upgrade-guides/...: the latest version's copies.
const RELEASE_DOCS_PATH = new RegExp(`^/docs/(${SECTIONS.map((s) => s.dir).join('|')})/`);

// Pages that moved from the next docs into a section of their own (written by the split tooling). Each new URL
// redirects from its old /docs/next/ one; released versions keep their own copies, so they need none. A page moved
// into a versioned section lands in that section's next version.
const VERSIONED_SECTIONS = ['workflow'];
const MOVED_FROM = Object.fromEntries(
  Object.entries(require('./moved-docs.json')).map(([from, {section, to}]) => [
    `/${section}/${VERSIONED_SECTIONS.includes(section) ? 'next/' : ''}${to.replace(/(\/index)?\.mdx?$/, '')}`,
    `/docs/next/${from.replace(/(\/index)?\.mdx?$/, '')}`,
  ]),
);

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
      onBrokenMarkdownLinks: 'throw',
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
          // KubeVela's versions only; hidden on the unversioned sections (custom.scss).
          className: 'kv-version',
        },
        {
          type: 'docsVersionDropdown',
          docsPluginId: 'workflow',
          position: 'right',
          // Workflow's versions; shown only on the Workflow section (custom.scss).
          className: 'workflow-version-dropdown',
        },
        {
          type: 'dropdown',
          label: 'Documentation',
          position: 'left',
          items: [
            {to: 'docs/', label: 'KubeVela'},
            {to: 'workflow/overview', label: 'Workflow'},
            {to: 'terraform/overview', label: 'Terraform'},
            {to: 'addons/overview', label: 'Addons'},
          ],
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
              html: '<span class="footer__link-item kv-zh-only">DingTalk (23310022)</span>',
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
    releasePagesPlugin,
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
    [
      '@docusaurus/plugin-content-docs',
      {
        // Workflow is versioned by the engine, kubevela/workflow, not by KubeVela. next is 0.8, the engine in KubeVela
        // 1.12; 0.7 (KubeVela 1.11) is served at /workflow/, as /docs/ serves 1.11.
        id: 'workflow',
        path: 'workflow',
        routeBasePath: 'workflow',
        sidebarPath: require.resolve('./sidebar-workflow.js'),
        editUrl: 'https://github.com/kubevela/kubevela.github.io/edit/main/',
        showLastUpdateAuthor: true,
        showLastUpdateTime: true,
        lastVersion: '0.7',
        versions: {
          current: {label: '0.8', path: 'next'},
          '0.7': {label: '0.7'},
          '0.6': {label: '0.6'},
        },
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        // Terraform follows terraform-controller and the cloud resource modules as they are now, so it is not versioned.
        id: 'terraform',
        path: 'terraform',
        routeBasePath: 'terraform',
        sidebarPath: require.resolve('./sidebar-terraform.js'),
        editUrl: 'https://github.com/kubevela/kubevela.github.io/edit/main/',
        showLastUpdateAuthor: true,
        showLastUpdateTime: true,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        // The addon reference pages follow the catalog as it is now, not a KubeVela release, so they are not versioned.
        id: 'addons',
        path: 'addons',
        routeBasePath: 'addons',
        sidebarPath: require.resolve('./sidebar-addons.js'),
        editUrl: 'https://github.com/kubevela/kubevela.github.io/edit/main/',
        showLastUpdateAuthor: true,
        showLastUpdateTime: true,
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        // Release Notes and Upgrade Guides used to be served at
        // /release-notes/... and /upgrade-guides/.... Send those URLs to the
        // copies in the latest docs version.
        createRedirects(existingPath) {
          if (RELEASE_DOCS_PATH.test(existingPath)) {
            return existingPath.slice('/docs'.length);
          }
          return MOVED_FROM[existingPath.replace(/\/$/, '')];
          return undefined;
        },
      },
    ],
    'docusaurus-plugin-sass',
    require.resolve('docusaurus-plugin-image-zoom'),
    [
      'docusaurus-plugin-llms',
      {
        title: 'KubeVela',
        description:
          'KubeVela is a modern software delivery platform that makes deploying and operating applications across hybrid, multi-cloud environments easier, faster and more reliable.',
        // Write a markdown copy of every doc next to its HTML page so agents
        // can fetch <page-url>.md; llms.txt links point at these copies.
        generateMarkdownFiles: true,
        // Generate per-version output matching the site's routing: the latest
        // released version (served at /docs/) gets the root llms.txt, while
        // next and older versions get their own under /docs/<version>/.
        versions: 'auto',
      },
    ],
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
