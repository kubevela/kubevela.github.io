import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import features from '../data/features'
import Translate, { translate } from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import GitHubButton from 'react-github-btn';
import styles from './styles.module.css';
import FeatureList from '../components/FeatureList'

const Button = ({ children, href }) => {
  return (
    <div className="col col--2 margin--sm">
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
            <ThemedImage
              alt="Kubevela Logo"
              className={styles.heroLogo}
              sources={{
                light: useBaseUrl('img/logo.svg'),
                dark: useBaseUrl('img/logoDark.svg'),
              }}
            />
          </div>
          <h2 className={clsx('hero__title', styles.heroTitle)}>{siteConfig.title}</h2>
          <GitHubButton
            href="https://github.com/kubevela/kubevela"
            data-icon="octicon-star"
            data-size="large"
            data-show-count="true"
            aria-label="Star facebook/metro on GitHub">
            Star
          </GitHubButton>
          <p className="hero__subtitle">
            <Translate>Make shipping applications more enjoyable.</Translate>
          </p>
          <div
            className={clsx(styles.heroButtons, 'name', 'margin-vert--md')}>
            <Button href={useBaseUrl('docs/quick-start')}><Translate>Get Started</Translate></Button>
            <Button href={useBaseUrl('docs/')}><Translate>Learn More</Translate></Button>
          </div>
        </div>
      </header>

      <WhatIs />

      <FeatureList />

      <div className={clsx('hero', styles.hero)}>
        <div className="container text--center">
          <h3 className="hero__subtitle">
            <Translate>KubeVela is a</Translate> <a href="https://cncf.io/">CNCF (Cloud Native Computing Foundation)</a> <Translate>project.</Translate>
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
                KubeVela is a modern software delivery platform that makes deploying and operating applications across today's hybrid, multi-cloud environments
              </Translate><i><Translate> easier, faster and more reliable.</Translate></i>
              <br />
              <br />
              <Translate>
                KubeVela is infrastructure agnostic, programmable, yet most importantly,
              </Translate><i><b> <Translate>application-centric.</Translate></b></i>
              <Translate> It allows you to build powerful software, and deliver them anywhere!</Translate>
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
  </div >
);
