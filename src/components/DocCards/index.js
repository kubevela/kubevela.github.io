import React from 'react';
import Link from '@docusaurus/Link';
import { useActiveVersion } from '@docusaurus/plugin-content-docs/client';
import { BLUE, PATHS } from '@site/section-icons';
import styles from './styles.module.scss';

// Line icons on a 24 unit grid, in the Documentation menu's two tones: the main shape in the KubeVela mark's blue,
// the details in the text colour. The Addons card draws the menu's own Addons icon.
const ICONS = {
  rocket: {
    main: 'M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5 6-6z',
    detail: 'M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 10l-3 1-2 3 4 1M14 15l-1 3-3 2-1-4M15 9.5a1.5 1.5 0 1 0 0-.01',
  },
  download: { main: 'M12 3v12M7 10l5 5 5-5', detail: 'M4 17v3h16v-3' },
  book: { main: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13', detail: 'M8 7h7' },
  blocks: { main: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4z', detail: 'M16.5 13.5v6M13.5 16.5h6' },
  addons: PATHS.addons,
  terminal: { main: 'M4 5h16v14H4z', detail: 'M8 10l3 2-3 2M13 15h3' },
};

const CARDS = [
  { icon: 'rocket', title: 'Quick start', body: 'Deploy your first application in a few minutes.', to: 'quick-start' },
  { icon: 'download', title: 'Install', body: 'Standalone, on Kubernetes, or the CLI on its own.', to: 'install' },
  { icon: 'book', title: 'Core concepts', body: 'Applications, components, traits, policies and workflows.', to: 'getting-started/core-concept' },
  { icon: 'blocks', title: 'Definitions', body: "Build your platform's building blocks in CUE or Go.", to: 'platform-engineers/oam/x-definition' },
  { icon: 'addons', title: 'Addons', body: 'Extend KubeVela from the community catalog.', to: '/addons/overview' },
  { icon: 'terminal', title: 'CLI reference', body: 'Every vela command and flag.', to: 'cli/vela' },
];

// DocCards is the docs' front door: where to start, as a grid of cards that
// link within the version being read; a card whose path starts at the root,
// such as an unversioned section, links there.
export default function DocCards() {
  const version = useActiveVersion();
  const base = version ? version.path.replace(/\/$/, '') : '/docs';
  return (
    <div className={styles.grid}>
      {CARDS.map((c) => (
        <Link key={c.to} className={styles.card} to={c.to.startsWith('/') ? `${c.to}/` : `${base}/${c.to}/`}>
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
            <path stroke={BLUE} d={ICONS[c.icon].main} />
            <path d={ICONS[c.icon].detail} />
          </svg>
          <span className={styles.title}>{c.title}</span>
          <span className={styles.body}>{c.body}</span>
        </Link>
      ))}
    </div>
  );
}
