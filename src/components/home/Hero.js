import React, { useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { GitHubMark, SlackMark } from './icons';
import Sail from './Sail';
import styles from './home.module.scss';

// Stars is the repository's star count, read from GitHub when the page loads;
// until then, or if GitHub cannot be reached, it asks for a star.
function Stars() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    let live = true;
    fetch('https://api.github.com/repos/kubevela/kubevela')
      .then((r) => (r.ok ? r.json() : null))
      .then((repo) => live && repo && setCount(repo.stargazers_count))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (count === null) {
    return (
      <span>
        <Translate id="home.hero.star">Star on GitHub</Translate>
      </span>
    );
  }
  const shown = count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(count);
  return (
    <span>
      <strong>{shown}</strong> <Translate id="home.hero.stars">stars</Translate>
    </span>
  );
}

// Hero centres the KubeVela sail and name, in the logo's colours, with the
// tagline, one sentence saying what the project is, and a badge with its CNCF
// standing (CNCF's own incubating mark), GitHub stars and Slack channel.
export default function Hero() {
  return (
    <header className={styles.hero}>
      <div className={`container ${styles.heroInner}`}>
        <Sail className={styles.heroLogo} />
        <h1 className={styles.heroName}>
          Kube<span className={styles.heroBrand}>Vela</span>
        </h1>
        <p className={styles.heroTitle}>
          <Translate id="home.hero.title">Platform Engineering.</Translate>{' '}
          <span className={styles.heroBrand}>
            <Translate id="home.hero.titleAccent">Simplified.</Translate>
          </span>
        </p>
        <p className={styles.heroLead}>
          <Translate id="home.hero.lead">
            The open-source toolkit for building your internal platform. Define the building blocks once; teams compose
            applications and infrastructure from them, and KubeVela delivers and runs them on every cluster and cloud.
          </Translate>
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.buttonPrimary} to={useBaseUrl('docs/quick-start')}>
            <Translate id="home.hero.try">Try KubeVela</Translate>
          </Link>
          <Link className={styles.buttonGhost} to={useBaseUrl('docs/')}>
            <Translate id="home.hero.docs">Read the docs</Translate>
          </Link>
        </div>
        <div className={styles.heroBadge}>
          <a className={styles.heroBadgePart} href="https://www.cncf.io/projects/kubevela/">
            <img
              className={`${styles.cncfIncubating} ${styles.cncfLight}`}
              src={useBaseUrl('img/cncf-incubating-color.svg')}
              alt={translate({ id: 'home.hero.cncf', message: 'CNCF Incubating Project' })}
            />
            <img
              className={`${styles.cncfIncubating} ${styles.cncfDark}`}
              src={useBaseUrl('img/cncf-incubating-white.svg')}
              alt={translate({ id: 'home.hero.cncf', message: 'CNCF Incubating Project' })}
            />
          </a>
          <a className={styles.heroBadgePart} href="https://github.com/kubevela/kubevela">
            <GitHubMark className={styles.githubMark} />
            <Stars />
          </a>
          <a className={styles.heroBadgePart} href="https://cloud-native.slack.com/archives/C01BLQ3HTJA">
            <SlackMark className={styles.githubMark} />
            <span>
              <Translate id="home.hero.slack">#kubevela on Slack</Translate>
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
