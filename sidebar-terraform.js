// Sidebar for the Terraform section (/terraform). It follows terraform-controller and the cloud resource modules as
// they are now, so it is not versioned. The cloud resource pages are generated, so the reference groups are built
// from the files on disk by their provider prefix. Only generated pages may sit in terraform/reference/: the list generator
// (hack/cloud-resources/terraform/gen.go) reads every file there as a cloud resource page.
const fs = require('fs');
const path = require('path');

const PROVIDERS = [
  ['alibaba', 'Alibaba Cloud'],
  ['aws', 'AWS'],
  ['azure', 'Azure'],
  ['baidu', 'Baidu Cloud'],
  ['elastic', 'Elastic Cloud'],
  ['gcp', 'Google Cloud'],
  ['tencent', 'Tencent Cloud'],
  ['vsphere', 'vSphere'],
];

const pages = fs
  .readdirSync(path.join(__dirname, 'terraform/reference'))
  .filter((f) => f.endsWith('.md') && f !== 'cloud-resources-list.md')
  .map((f) => f.replace(/\.md$/, ''))
  .sort();
const grouped = new Set();
const groups = PROVIDERS.map(([prefix, label]) => {
  const items = pages.filter((p) => p.startsWith(prefix + '-')).map((p) => 'reference/' + p);
  items.forEach((i) => grouped.add(i));
  return {type: 'category', label, items};
}).filter((g) => g.items.length);
const other = pages.map((p) => 'reference/' + p).filter((p) => !grouped.has(p));
if (other.length) groups.push({type: 'category', label: 'Other', items: other});

module.exports = {
  terraform: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      link: {type: 'generated-index', slug: '/getting-started'},
      items: ['getting-started/introduction', 'getting-started/install', 'getting-started/quick-start'],
    },
    {
      type: 'category',
      label: 'Concepts',
      link: {type: 'generated-index', slug: '/concepts'},
      items: ['concepts/how-it-works'],
    },
    {
      type: 'category',
      label: 'Guides',
      link: {type: 'generated-index', slug: '/guides'},
      items: [
        'guides/consume-cloud-services',
        {
          type: 'category',
          label: 'Databases',
          items: [
            'guides/provision-and-consume-database',
            'guides/provision-and-initiate-database',
            'guides/secure-your-database-connection',
            'guides/provision-an-rds-instance-with-more-than-one-database',
            'guides/provision-instance-and-database-separately',
          ],
        },
        'guides/elastic-cloud-provider',
        {
          type: 'category',
          label: 'Extend',
          items: ['extend/cloud-resource-component', 'extend/terraform-addon'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      link: {type: 'generated-index', slug: '/examples'},
      items: [
        'examples/application-component',
        'examples/remote-module',
        'examples/kubernetes-backend',
        'examples/update-and-delete',
        'examples/cloud-resource-dry-run',
      ],
    },
    {
      type: 'category',
      label: 'Operate',
      link: {type: 'generated-index', slug: '/operate'},
      items: ['operate/configure', 'operate/upgrade', 'operate/troubleshooting'],
    },
    {
      type: 'category',
      label: 'Contributor Onboarding',
      link: {type: 'generated-index', slug: '/developer'},
      items: ['developer/overview', 'developer/build-and-test', 'developer/pull-requests'],
    },
    {
      type: 'category',
      label: 'Reference',
      link: {type: 'generated-index', slug: '/reference'},
      items: [
        'versions',
        {
          type: 'category',
          label: 'Cloud Resources',
          link: {type: 'doc', id: 'reference/cloud-resources-list'},
          items: groups,
        },
      ],
    },
  ],
};
