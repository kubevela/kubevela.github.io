import React, { useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { callDate } from '../../../scripts/call-time';
import { CallMark, GitHubMark, SlackMark } from './icons';
import styles from './home.module.scss';

// NextCall is the next community call's day and time: in Pacific time as the
// page is built, then in the reader's own time zone once it loads.
function NextCall({ call }) {
  const start = Date.parse(call.start);
  const [when, setWhen] = useState(() => callDate(start, { timeZone: 'America/Los_Angeles', locale: 'en-US' }));
  useEffect(() => setWhen(callDate(start)), [start]);
  return (
    <p className={styles.nextCall}>
      <span>
        <Translate id="home.community.calls.next">Next call</Translate>
      </span>
      {call.agenda.includes('/issues/') && !call.agenda.includes('?') ? (
        <Link to={call.agenda}>{when}</Link>
      ) : (
        <strong>{when}</strong>
      )}
    </p>
  );
}

// Community is how to talk to the people behind KubeVela and join in: Slack,
// the monthly calls, and contributing.
export default function Community() {
  const { nextCall } = useDocusaurusContext().siteConfig.customFields;
  const ways = [
    {
      icon: <SlackMark className={styles.wayIcon} />,
      title: <Translate id="home.community.slack.title">Chat on Slack</Translate>,
      body: (
        <Translate id="home.community.slack.body">
          Ask questions and share what you are building with users and maintainers in #kubevela on the CNCF Slack.
        </Translate>
      ),
      links: [
        ['https://cloud-native.slack.com/archives/C01BLQ3HTJA', <Translate id="home.community.slack.join">Join #kubevela</Translate>],
        ['https://slack.cncf.io/', <Translate id="home.community.slack.invite">Get an invite</Translate>],
      ],
    },
    {
      icon: <CallMark className={styles.wayIcon} />,
      title: <Translate id="home.community.calls.title">Community calls</Translate>,
      body: (
        <Translate id="home.community.calls.body">
          Every month the community shows new features, reviews the roadmap and answers questions. Everyone is welcome.
        </Translate>
      ),
      next: nextCall,
      links: [
        nextCall
          ? [nextCall.zoom, <Translate id="home.community.calls.join">Join on Zoom</Translate>]
          : [
              'https://github.com/kubevela/community#community-meetings',
              <Translate id="home.community.calls.upcoming">Upcoming calls</Translate>,
            ],
        [
          'https://www.youtube.com/channel/UCq2hpE_h4JKA1GnAeuaqtww',
          <Translate id="home.community.calls.recordings">Watch recordings</Translate>,
        ],
      ],
    },
    {
      icon: <GitHubMark className={styles.wayIcon} />,
      title: <Translate id="home.community.contribute.title">Contribute</Translate>,
      body: (
        <Translate id="home.community.contribute.body">
          KubeVela is built in the open. Pick up an issue, propose a feature or improve these docs.
        </Translate>
      ),
      links: [
        [useBaseUrl('docs/contributor/overview'), <Translate id="home.community.contribute.start">Start contributing</Translate>],
        [
          'https://github.com/kubevela/kubevela/issues?q=is%3Aopen+label%3A%22good+first+issue%22',
          <Translate id="home.community.contribute.issues">Good first issues</Translate>,
        ],
      ],
    },
  ];

  return (
    <section className={`${styles.section} ${styles.sectionTinted}`}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Translate id="home.community.title">Join the community</Translate>
          </h2>
          <p className={styles.sectionLead}>
            <Translate id="home.community.lead">
              KubeVela is made by people from many companies, and newcomers are always welcome.
            </Translate>
          </p>
        </div>
        <div className={styles.ways}>
          {ways.map(({ icon, title, body, next, links }, i) => (
            <article key={i} className={styles.way}>
              {icon}
              <h3>{title}</h3>
              <p>{body}</p>
              {next && <NextCall call={next} />}
              <div className={styles.wayLinks}>
                {links.map(([to, label], j) => (
                  <Link key={j} className={j === 0 ? styles.wayPrimary : styles.more} to={to}>
                    {label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
