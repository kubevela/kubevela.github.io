import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
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
import { PlayCueContext, prefersReducedMotion } from './usePlayOnce';
import styles from './home.module.scss';

// useHoverPointer reports whether the reader has a mouse or trackpad, which
// can hover, and has not asked for reduced motion. It is false until mounted,
// since the server cannot know.
function useHoverPointer() {
  const [hover, setHover] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.('(hover: hover) and (pointer: fine)');
    if (!query) {
      return;
    }
    const update = () => setHover(query.matches && !prefersReducedMotion());
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return hover;
}

// usePlayQueue plays the drawings of count cards one at a time, where the
// reader can hover. Each card plays once, in order, while most of its
// drawing is on screen; a drawing scrolled away mid-play ends at once, so the
// queue keeps to what the reader sees. Hovering or focusing a card plays it at
// once, and the queue carries on when it ends. It returns, per card, the props
// for its article and for its drawing's box, and the value for its
// PlayCueContext; elsewhere it returns no cue, and each drawing plays as it
// scrolls into view.
function usePlayQueue(count) {
  const enabled = useHoverPointer();
  const cards = useRef([]);
  const [onScreen, setOnScreen] = useState([]);
  const [played, setPlayed] = useState([]);
  const [playing, setPlaying] = useState({ index: null, takes: 0, queued: false });

  const play = (index, queued = false) => {
    setPlaying(({ takes }) => ({ index, takes: takes + 1, queued }));
    setPlayed((list) => (list.includes(index) ? list : [...list, index]));
  };

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        setOnScreen((list) => {
          const next = new Set(list);
          entries.forEach((e) => {
            const i = cards.current.indexOf(e.target);
            e.isIntersecting ? next.add(i) : next.delete(i);
          });
          return [...next];
        }),
      { threshold: 0.75 },
    );
    cards.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (playing.index !== null) {
      if (playing.queued && !onScreen.includes(playing.index)) {
        setPlaying((p) => ({ ...p, index: null }));
      }
      return;
    }
    const next = [...onScreen].sort((a, b) => a - b).find((i) => !played.includes(i));
    if (next !== undefined) {
      play(next, true);
    }
  }, [enabled, playing.index, playing.queued, onScreen, played]);

  if (!enabled) {
    return Array.from({ length: count }, () => ({ props: {}, visual: {}, cue: null }));
  }
  const done = (index) => setPlaying((p) => (p.index === index ? { ...p, index: null } : p));
  return Array.from({ length: count }, (_, i) => ({
    props: {
      onMouseEnter: () => play(i),
      onFocus: () => playing.index !== i && play(i),
    },
    visual: {
      ref: (el) => {
        cards.current[i] = el;
      },
    },
    cue:
      playing.index === i
        ? { takes: playing.takes, onDone: () => done(i) }
        : played.includes(i)
        ? { takes: 0 }
        : { waiting: true },
  }));
}

// Toolkit is what a platform team builds with KubeVela, each part beside a
// drawing of it. Where the reader can hover, only one drawing moves at a time.
export default function Toolkit() {
  const { withBaseUrl } = useBaseUrlUtils();
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
      to: 'addons/overview',
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

  const queue = usePlayQueue(items.length);

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
            <article
              key={i}
              className={clsx(styles.feature, wide && styles.featureWide, reverse && styles.featureReverse)}
              {...queue[i].props}
            >
              <div className={styles.featureVisual} {...queue[i].visual}>
                <PlayCueContext.Provider value={queue[i].cue}>
                  <Diagram />
                </PlayCueContext.Provider>
              </div>
              <div className={styles.featureText}>
                <h3>{title}</h3>
                <p>{body}</p>
                <Link className={styles.more} to={withBaseUrl(to)}>
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
