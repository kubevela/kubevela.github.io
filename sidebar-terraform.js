// Sidebar for the Terraform section (/terraform). It follows terraform-controller and the cloud resource modules as
// they are now, so it is not versioned. The cloud resource pages are generated, so the reference groups are built
// from the files on disk by their provider prefix.
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
    'overview',
    {type: 'category', label: 'Install', items: ['install/terraform-addon', 'install/terraform-ec-addon']},
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/consume-cloud-services',
        'guides/provision-and-consume-database',
        'guides/provision-and-initiate-database',
        'guides/secure-your-database-connection',
        'guides/provision-an-rds-instance-with-more-than-one-database',
        'guides/provision-instance-and-database-separately',
      ],
    },
    {type: 'category', label: 'Extend', items: ['extend/cloud-resource-component', 'extend/terraform-addon']},
    {
      type: 'category',
      label: 'Cloud Resources',
      link: {type: 'doc', id: 'reference/cloud-resources-list'},
      items: groups,
    },
  ],
};
