import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import features from '../data/features'
import Translate, { translate } from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import GitHubButton from 'react-github-btn';
import styles from './styles.module.css';

function Feature({ imgUrl, title, description, reverse }) {
  return (
    <div className={clsx('row', styles.feature, reverse ? styles.featureReverse : '')}>
      <div className="col col--3">
        <div className="text--center">
          {imgUrl && <img className={styles.featureImage} src={useBaseUrl(imgUrl)} alt={title} />}
        </div>
      </div>
      <div className={clsx('col col--9', styles.featureDesc)}>
        <div>
          <h2>{title}</h2>
          <div>{description}</div>
        </div>
      </div>
    </div>
  )
}

const Button = ({ children, href }) => {
  return (
    <div className="col col--2 margin-horiz--sm">
      <Link
        className="button button--outline button--primary button--lg"
        to={href}>
        {children}
      </Link>
    </div>
  );
};

export default function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;

  return (
    <Layout title={siteConfig.tagline} description={siteConfig.tagline}>
      <header className={clsx('hero', styles.hero)}>
        <div className="container text--center">
          <div className={styles.heroLogoWrapper}>
            <img className={styles.heroLogo} src={useBaseUrl('img/logo.svg')} alt="Kubevela Logo" />
          </div>
          <h2 className={clsx('hero__title', styles.heroTitle)}>{siteConfig.title}</h2>
          <GitHubButton
            href="https://github.com/oam-dev/kubevela"
            data-icon="octicon-star"
            data-size="large"
            data-show-count="true"
            aria-label="Star facebook/metro on GitHub">
            Star
          </GitHubButton>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div
            className={clsx(styles.heroButtons, 'name', 'margin-vert--md')}>
            <Button href={useBaseUrl('docs/end-user/quick-start-cli')}><Translate>Get Started</Translate></Button>
            <Button href={useBaseUrl('docs/')}><Translate>Learn More</Translate></Button>
          </div>
        </div>
      </header>

      <WhatIs />

      <main className={clsx('hero', styles.hero)}>
        <div className="container">
          <section className={styles.features}>
            <div className="container">
              {features.map((f, idx) => (
                <Feature key={idx} {...f} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <div className={clsx('hero', styles.hero)}>
        <div className="container text--center">
          <h3 className="hero__subtitle">
            <Translate>KubeVela is a</Translate> <a href="https://cncf.io/">CNCF (Cloud Native Computing Foundation)</a> <Translate>sandbox project</Translate>
          </h3>
          <div className={clsx('cncf-logo', styles.cncfLogo)} />
        </div>
      </div>
    </Layout>
  );
}

const WhatIs = () => (
  <div className={clsx('hero', styles.hero)}>
    <div className="container">
      <div className="row">
        <div className="col col--6">
          <h1><Translate>What is KubeVela?</Translate></h1>
          <p className="hero__subtitle">
            <small>
              <Translate>
                KubeVela is a modern application delivery platform that makes deploying and operating applications across today's hybrid, multi-cloud environments
              </Translate><i><Translate> easier, faster and more reliable.</Translate></i>
              <br />
              <br />
              <Translate>
                KubeVela is infrastructure agnostic, programmable, yet most importantly,
              </Translate><i><b> <Translate>application-centric,</Translate></b></i><Translate> with rich out-of-box capabilities as addons based on it's extensibility.</Translate>
              <br />
            </small>
          </p>
        </div>
        <div className="col">
          <img
            className="image"
            src={useBaseUrl("img/what-is-kubevela.png")}
            align="right"
            alt="what is kubevela"
          />
        </div>
      </div>
    </div>
  </div>
);