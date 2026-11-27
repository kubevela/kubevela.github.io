import React from 'react';
import Link from '@docusaurus/Link';
import {useActivePlugin} from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.css';

// One docs plugin instance per product; the header names the one the reader is in.
const SECTIONS = {
  default: {label: 'KubeVela', home: '/docs/'},
  workflow: {label: 'Workflow', home: '/workflow/getting-started/introduction'},
  velaux: {label: 'VelaUX', home: '/velaux/getting-started/introduction'},
  terraform: {label: 'Terraform', home: '/terraform/getting-started/introduction'},
  addons: {label: 'Addons', home: '/addons/getting-started/introduction'},
  'cluster-gateway': {label: 'Cluster Gateway', home: '/cluster-gateway/getting-started/introduction'},
};

export default function SectionHeader() {
  const plugin = useActivePlugin({failfast: false});
  const section = plugin && SECTIONS[plugin.pluginId];
  if (!section) {
    return null;
  }
  return (
    <div className={styles.header}>
      <span className={styles.kicker}>Documentation</span>
      <Link className={styles.title} to={section.home}>
        {section.label}
      </Link>
    </div>
  );
}
