import React from 'react';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import Hero from '../components/home/Hero';
import WhatIs from '../components/home/WhatIs';
import Toolkit from '../components/home/Toolkit';
import Showcase from '../components/home/Showcase';
import Integrations from '../components/home/Integrations';
import Community from '../components/home/Community';
import styles from '../components/home/home.module.scss';

export default function Home() {
  const tagline = translate({ id: 'home.tagline', message: 'Platform Engineering. Simplified.' });
  return (
    <Layout title={tagline} description={tagline}>
      <main className={styles.home}>
        <Hero />
        <WhatIs />
        <Toolkit />
        <Showcase />
        <Integrations />
        <Community />
        <section className={styles.cncf}>
          <div className="container">
            <p>
              <Translate id="home.cncf">KubeVela is a Cloud Native Computing Foundation incubating project.</Translate>
            </p>
            <a href="https://cncf.io/" aria-label="Cloud Native Computing Foundation">
              <div className="cncf-Logo" />
            </a>
          </div>
        </section>
      </main>
    </Layout>
  );
}
