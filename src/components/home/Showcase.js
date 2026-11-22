import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './home.module.scss';

// Showcase shows VelaUX, the KubeVela console, one screen at a time.
export default function Showcase() {
  const shots = [
    {
      key: 'resource-graph',
      label: translate({ id: 'home.showcase.resourceGraph', message: 'Resource graph' }),
      img: 'img/home/velaux-resource-graph.webp',
    },
    {
      key: 'applications',
      label: translate({ id: 'home.showcase.applications', message: 'Applications' }),
      img: 'img/home/velaux-applications.webp',
    },
    {
      key: 'application-graph',
      label: translate({ id: 'home.showcase.applicationGraph', message: 'Application graph' }),
      img: 'img/home/velaux-application-graph.webp',
    },
  ];
  const [current, setCurrent] = useState(shots[0].key);
  const base = useBaseUrl('/');

  return (
    <section className={`${styles.section} ${styles.sectionTinted}`}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Translate id="home.showcase.title">See the whole platform</Translate>
          </h2>
          <p className={styles.sectionLead}>
            <Translate id="home.showcase.lead">
              VelaUX, the KubeVela console, shows every application, where it runs and what it is made of, down to each
              Kubernetes resource and its health.
            </Translate>{' '}
            <Link to={useBaseUrl('docs/reference/addons/velaux')}>
              <Translate id="home.showcase.link">Install VelaUX</Translate>
            </Link>
          </p>
        </div>
        <div className={styles.tabs} role="tablist">
          {shots.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={current === s.key}
              className={clsx(styles.tab, current === s.key && styles.tabOn)}
              onClick={() => setCurrent(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className={styles.browser}>
          <div className={styles.browserBar}>
            <i />
            <i />
            <i />
          </div>
          {shots
            .filter((s) => s.key === current)
            .map((s) => (
              <img key={s.key} src={`${base}${s.img}`} alt={s.label} width="1600" height="1000" loading="lazy" />
            ))}
        </div>
      </div>
    </section>
  );
}
