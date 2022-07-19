import React from 'react';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import GitHubButton from 'react-github-btn';
import FeatureList from '../components/FeatureList'
import Button from '../components/button'
import WhatIs from "../components/WhatIs";

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
          <h2 className="hero__title">{siteConfig.title}</h2>
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
            className="heroButtons">
            <Button href={useBaseUrl('docs/quick-start')}><Translate>Get Started</Translate></Button>
            <Button href={useBaseUrl('docs/')}><Translate>Learn More</Translate></Button>
          </div>
        </div>
      </header>

      <WhatIs />

      <FeatureList />

      <div className="hero">
        <div className="container text--center">
          <h3 className="hero__subtitle">
            <Translate>KubeVela is a</Translate> <a href="https://cncf.io/">CNCF (Cloud Native Computing Foundation)</a> <Translate>project.</Translate>
          </h3>
          <div className="cncf-Logo" />
        </div>
      </div>
    </Layout>
  );
}
