import React from 'react';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import GitHubButton from 'react-github-btn';
import FeatureList from '../components/FeatureList';
import Button from '../components/button';
import WhatIs from '../components/WhatIs';
import Integration from '../components/Integration';

export default function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;

  return (
    <Layout title={siteConfig.tagline} description={siteConfig.tagline}>
      <header className="hero">
        <div className="container text--center">
          <div className="heroLogoWrapper">
            <ThemedImage
              alt="Kubevela Logo"
              className="heroLogo"
              sources={{
                light: useBaseUrl('img/logo.svg'),
                dark: useBaseUrl('img/logoDark.svg'),
              }}
            />
          </div>
          <h1 className="hero__title">
            <span className="hero__title--black">Kube</span><span className="hero__title--blue">Vela</span>
          </h1>
          <p className="hero__tagline">
            <Translate>The Modern Application Platform</Translate>
          </p>
          <p className="hero__subtitle">
            <Translate>Simplify deployments and platform complexity with powerful abstractions</Translate>
          </p>
          <GitHubButton
            href="https://github.com/kubevela/kubevela"
            data-icon="octicon-star"
            data-size="large"
            data-show-count="true"
            aria-label="Star KubeVela on GitHub"
          >
            Star
          </GitHubButton>
          <div className="heroButtons">
            <Button href={useBaseUrl('docs/quick-start')}>
              <Translate>Get Started</Translate>
            </Button>
            <Button href={useBaseUrl('docs/')}>
              <Translate>Learn More</Translate>
            </Button>
          </div>
        </div>
      </header>

      <WhatIs />

      <FeatureList />

      <Integration />

      <div className="hero">
        <div className="container text--center">
          <h3 className="hero__subtitle">
            <Translate>KubeVela is a</Translate>{' '}
            <a href="https://cncf.io/">
              CNCF (Cloud Native Computing Foundation)
            </a>{' '}
            <Translate>incubation project.</Translate>
          </h3>
          <div className="cncf-Logo" />
        </div>
      </div>
    </Layout>
  );
}
