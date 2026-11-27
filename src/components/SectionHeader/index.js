import React from 'react';
import Link from '@docusaurus/Link';
import {useActivePluginAndVersion} from '@docusaurus/plugin-content-docs/client';
import {ICONS} from '@site/section-icons';
import styles from './styles.module.css';

// One docs plugin instance per product; the header names the one the reader is in and links its home page in the
// version being read. home is relative to the version's path.
const SECTIONS = {
  default: {label: 'KubeVela', home: ''},
  workflow: {label: 'Vela Workflow', home: 'getting-started/introduction'},
  velaux: {label: 'VelaUX', home: 'getting-started/introduction'},
  terraform: {label: 'Terraform Controller', home: 'getting-started/introduction'},
  addons: {label: 'Addons', home: 'getting-started/introduction'},
  'cluster-gateway': {label: 'Cluster Gateway', home: 'getting-started/introduction'},
  prism: {label: 'Prism', home: 'getting-started/introduction'},
};

export default function SectionHeader() {
  const active = useActivePluginAndVersion({failfast: false});
  const plugin = active?.activePlugin;
  const section = plugin && SECTIONS[plugin.pluginId];
  if (!section) {
    return null;
  }
  const versionPath = (active.activeVersion ?? plugin.pluginData.versions.find((v) => v.isLast)).path;
  return (
    <div className={styles.header}>
      <span className={styles.kicker}>Documentation</span>
      <Link className={styles.title} to={`${versionPath.replace(/\/$/, '')}/${section.home}`}>
        <span className={styles.icon} dangerouslySetInnerHTML={{__html: ICONS[plugin.pluginId]}} />
        {section.label}
      </Link>
    </div>
  );
}
