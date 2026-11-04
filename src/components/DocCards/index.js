import React from 'react';
import Link from '@docusaurus/Link';
import { useActiveVersion } from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.scss';

// Line icons, drawn on a 24 unit grid in the current text colour.
const ICONS = {
  rocket: 'M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5 6-6zM9 10l-3 1-2 3 4 1M14 15l-1 3-3 2-1-4M15 9.5a1.5 1.5 0 1 0 0-.01',
  download: 'M12 3v12M7 10l5 5 5-5M4 17v3h16v-3',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13M8 7h7',
  blocks: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16.5 13.5v6M13.5 16.5h6',
  puzzle: 'M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z',
  terminal: 'M4 5h16v14H4zM8 10l3 2-3 2M13 15h3',
};

const CARDS = [
  { icon: 'rocket', title: 'Quick start', body: 'Deploy your first application in a few minutes.', to: 'quick-start' },
  { icon: 'download', title: 'Install', body: 'Standalone, on Kubernetes, or the CLI on its own.', to: 'install' },
  { icon: 'book', title: 'Core concepts', body: 'Applications, components, traits, policies and workflows.', to: 'getting-started/core-concept' },
  { icon: 'blocks', title: 'Definitions', body: "Build your platform's building blocks in CUE or Go.", to: 'platform-engineers/oam/x-definition' },
  { icon: 'puzzle', title: 'Addons', body: 'Extend KubeVela from the community catalog.', to: 'reference/addons/overview' },
  { icon: 'terminal', title: 'CLI reference', body: 'Every vela command and flag.', to: 'cli/vela' },
];

// DocCards is the docs' front door: where to start, as a grid of cards that
// link within the version being read.
export default function DocCards() {
  const version = useActiveVersion();
  const base = version ? version.path.replace(/\/$/, '') : '/docs';
  return (
    <div className={styles.grid}>
      {CARDS.map((c) => (
        <Link key={c.to} className={styles.card} to={`${base}/${c.to}/`}>
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
            <path d={ICONS[c.icon]} />
          </svg>
          <span className={styles.title}>{c.title}</span>
          <span className={styles.body}>{c.body}</span>
        </Link>
      ))}
    </div>
  );
}
