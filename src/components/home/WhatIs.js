import React from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import HowGraph from './HowGraph';
import { ComposeGlyph, DefineGlyph, DeliverGlyph } from './Glyphs';
import styles from './home.module.scss';

// WhatIs explains KubeVela as its three steps, in the order they happen, under
// the drawing that plays them.
export default function WhatIs() {
  const steps = [
    {
      title: <Translate id="home.what.define.title">Define</Translate>,
      who: <Translate id="home.what.define.who">Platform engineers</Translate>,
      body: (
        <Translate id="home.what.define.body">
          Describe each building block once as a KubeVela Definition: sources, components, traits, policies and
          workflow steps, written in CUE or in Go with defkit, and holding your standards.
        </Translate>
      ),
      to: 'docs/getting-started/definition',
      Glyph: DefineGlyph,
    },
    {
      title: <Translate id="home.what.compose.title">Compose</Translate>,
      who: <Translate id="home.what.compose.who">Application teams</Translate>,
      body: (
        <Translate id="home.what.compose.body">
          Build an application from those blocks in one short spec, picking the parameters that matter to them and
          nothing else.
        </Translate>
      ),
      to: 'docs/getting-started/core-concept',
      Glyph: ComposeGlyph,
    },
    {
      title: <Translate id="home.what.deliver.title">Deliver</Translate>,
      who: <Translate id="home.what.deliver.who">KubeVela</Translate>,
      body: (
        <Translate id="home.what.deliver.body">
          Run the application's workflow to every cluster and cloud it targets, then keep it in the state it declares.
        </Translate>
      ),
      to: 'docs/end-user/workflow/overview',
      Glyph: DeliverGlyph,
    },
  ];

  return (
    <section className={`${styles.section} ${styles.sectionTinted}`}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Translate id="home.what.title">How it works</Translate>
          </h2>
          <p className={styles.sectionLead}>
            <Translate id="home.what.lead">
              Platform teams decide how things run. Application teams decide what to run. KubeVela does the rest.
            </Translate>
          </p>
        </div>
        <div className={styles.howGraph}>
          <HowGraph />
        </div>
        <ol className={styles.track}>
          {steps.map(({ title, who, body, to, Glyph }, i) => (
            <li key={i} className={styles.trackStep}>
              <span className={styles.trackNode}>{i + 1}</span>
              <div className={styles.trackGlyph}>
                <Glyph />
              </div>
              <h3>{title}</h3>
              <span className={styles.trackWho}>{who}</span>
              <p>{body}</p>
              <Link className={styles.more} to={useBaseUrl(to)}>
                <Translate id="home.readMore">Read more</Translate>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
