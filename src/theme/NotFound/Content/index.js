import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Heading from '@theme/Heading';
import Sail from '@site/src/components/home/Sail';
import styles from './styles.module.scss';

// NotFoundContent is the 404 page: the sail bobs, lists and sinks under the
// waterline, then the ways back into the site.
export default function NotFoundContent({ className }) {
  return (
    <main className={clsx('container', styles.notFound, className)}>
      <div className={styles.sea} aria-hidden="true">
        <div className={styles.boat}>
          <Sail className={styles.sail} />
        </div>
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.bubble} />
        ))}
        <svg className={styles.water} viewBox="0 0 160 24" preserveAspectRatio="none">
          <path className={styles.waterFill} d="M 0 8 Q 10 2, 20 8 T 40 8 T 60 8 T 80 8 T 100 8 T 120 8 T 140 8 T 160 8 V 24 H 0 Z" />
          <path className={styles.waterLine} d="M 0 8 Q 10 2, 20 8 T 40 8 T 60 8 T 80 8 T 100 8 T 120 8 T 140 8 T 160 8" />
        </svg>
      </div>
      <p className={styles.code}>404</p>
      <Heading as="h1" className={styles.title}>
        <Translate id="theme.NotFound.title" description="The title of the 404 page">
          Page Not Found
        </Translate>
      </Heading>
      <p className={styles.lead}>
        <Translate id="theme.NotFound.p1" description="The first paragraph of the 404 page">
          This page has sunk without a trace. It may have moved in a recent release.
        </Translate>
      </p>
      <div className={styles.actions}>
        <Link className={styles.primary} to={useBaseUrl('docs/')}>
          <Translate id="theme.NotFound.docs">Go to the docs</Translate>
        </Link>
        <Link className={styles.ghost} to={useBaseUrl('/')}>
          <Translate id="theme.NotFound.home">Back to the homepage</Translate>
        </Link>
      </div>
      <p className={styles.hint}>
        <Translate id="theme.NotFound.search">Or search the docs with ⌘K.</Translate>
      </p>
    </main>
  );
}
