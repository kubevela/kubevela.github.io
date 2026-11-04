import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  AddonsDiagram,
  BlocksDiagram,
  CuexDiagram,
  DeliverDiagram,
  FormDiagram,
  HealthDiagram,
  InfraDiagram,
  OamDiagram,
} from './Diagrams';
import styles from './home.module.scss';

// Toolkit is what a platform team builds with KubeVela, each part beside a
// drawing of it.
export default function Toolkit() {
  const items = [
    {
      title: <Translate id="home.toolkit.oam.title">Built on the Open Application Model</Translate>,
      body: (
        <Translate
          id="home.toolkit.oam.body"
          values={{
            oam: <Link to="https://oam.dev">OAM</Link>,
          }}
        >
          {
            "KubeVela implements {oam}, the open standard for describing applications as components, traits, policies and workflows, and extends it with sources. Your platform's API is built on a portable, vendor-neutral model rather than tied to any one cloud or tool."
          }
        </Translate>
      ),
      to: 'docs/getting-started/core-concept',
      Diagram: OamDiagram,
      wide: true,
    },
    {
      title: <Translate id="home.toolkit.blocks.title">Your building blocks</Translate>,
      body: (
        <Translate id="home.toolkit.blocks.body">
          Define sources, components, traits, policies and workflow steps once as KubeVela Definitions, in CUE or Go.
          Test them like code and version them, so every team builds from the same proven blocks, with your standards
          already inside.
        </Translate>
      ),
      to: 'docs/getting-started/definition',
      Diagram: BlocksDiagram,
    },
    {
      title: <Translate id="home.toolkit.selfService.title">Self-service for every team</Translate>,
      body: (
        <Translate id="home.toolkit.selfService.body">
          Write a block in CUE or in Go with defkit, and its parameters become an OpenAPI schema. Teams fill in only
          those, in YAML, from the CLI, or in the form VelaUX builds from the schema.
        </Translate>
      ),
      to: 'docs/platform-engineers/openapi-v3-json-schema',
      Diagram: FormDiagram,
    },
    {
      title: <Translate id="home.toolkit.deliver.title">Deliver anywhere</Translate>,
      body: (
        <Translate id="home.toolkit.deliver.body">
          Workflows roll out step by step, with approvals and conditions, to any number of clusters and clouds from
          one spec.
        </Translate>
      ),
      to: 'docs/case-studies/multi-cluster',
      Diagram: DeliverDiagram,
    },
    {
      title: <Translate id="home.toolkit.infra.title">Infrastructure included</Translate>,
      body: (
        <Translate id="home.toolkit.infra.body">
          Databases, buckets and queues are components too, provisioned by whatever your platform already uses, such
          as Terraform, Crossplane, cloud provider operators or your own definitions, and wired to the services that
          use them.
        </Translate>
      ),
      to: 'docs/end-user/components/cloud-services/cloud-resource-scenarios',
      Diagram: InfraDiagram,
    },
    {
      title: <Translate id="home.toolkit.operate.title">Health at a glance</Translate>,
      body: (
        <Translate id="home.toolkit.operate.body">
          Know whether every application is healthy, component by component and resource by resource, across every
          cluster it runs on.
        </Translate>
      ),
      to: 'docs/reference/addons/velaux',
      Diagram: HealthDiagram,
    },
    {
      title: <Translate id="home.toolkit.addons.title">Extend with addons</Translate>,
      body: (
        <Translate id="home.toolkit.addons.body">
          Install addons from a registry to bring new KubeVela Definitions into your platform: sources, components,
          traits, policies and workflow steps for GitOps, cloud resources, observability or capabilities of your own.
        </Translate>
      ),
      to: 'docs/reference/addons/overview',
      Diagram: AddonsDiagram,
    },
    {
      title: <Translate id="home.toolkit.cuex.title">Connect your own services with CueX</Translate>,
      body: (
        <Translate id="home.toolkit.cuex.body">
          CueX lets definitions reach beyond their templates. Built-in packages read and act on the Kubernetes API,
          and your own services join them as packages: describe a server once and every definition can call it, with
          CueX passing the request on and the response back.
        </Translate>
      ),
      to: 'docs/platform-engineers/cue/external-packages',
      Diagram: CuexDiagram,
      wide: true,
      reverse: true,
    },
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Translate id="home.toolkit.title">Everything your platform needs</Translate>
          </h2>
          <p className={styles.sectionLead}>
            <Translate id="home.toolkit.lead">
              One open-source toolkit for the whole path, from the blocks your platform offers to the clusters they run
              on.
            </Translate>
          </p>
        </div>
        <div className={styles.features}>
          {items.map(({ title, body, to, Diagram, wide, reverse }, i) => (
            <article key={i} className={clsx(styles.feature, wide && styles.featureWide, reverse && styles.featureReverse)}>
              <div className={styles.featureVisual}>
                <Diagram />
              </div>
              <div className={styles.featureText}>
                <h3>{title}</h3>
                <p>{body}</p>
                <Link className={styles.more} to={useBaseUrl(to)}>
                  <Translate id="home.readMore">Read more</Translate>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
