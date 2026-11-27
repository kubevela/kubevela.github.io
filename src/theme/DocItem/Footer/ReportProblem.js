import React, {useEffect, useId, useRef, useState} from 'react';
import clsx from 'clsx';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc, useDocsVersion} from '@docusaurus/plugin-content-docs/client';
import {issueUrl} from './issueUrl';
import styles from './styles.module.css';

// Values sent to GitHub stay in English to match the options in docs-problem.yml;
// only the labels shown here are translated.
function categories() {
  return [
    {
      value: 'Out of date',
      label: translate({id: 'docs.reportProblem.category.outdated', message: 'Out of date'}),
    },
    {
      value: 'Inaccurate',
      label: translate({id: 'docs.reportProblem.category.inaccurate', message: 'Inaccurate'}),
    },
    {
      value: 'Unclear',
      label: translate({id: 'docs.reportProblem.category.unclear', message: 'Unclear'}),
    },
    {
      value: "Example doesn't work",
      label: translate({
        id: 'docs.reportProblem.category.example',
        message: "Example doesn't work",
      }),
    },
    {
      value: 'Broken link or image',
      label: translate({id: 'docs.reportProblem.category.broken', message: 'Broken link or image'}),
    },
    {
      value: 'Other',
      label: translate({id: 'docs.reportProblem.category.other', message: 'Other'}),
    },
  ];
}

function IconFlag(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
      <path
        d="M5 21V4h12l-2.5 4 2.5 4H5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ReportProblem() {
  const {metadata} = useDoc();
  const version = useDocsVersion();
  const {siteConfig} = useDocusaurusContext();
  const options = categories();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(options[0].value);
  const [note, setNote] = useState('');
  const toggleRef = useRef(null);
  const selectRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (open) {
      selectRef.current?.focus();
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const versionName =
    version.label === version.version ? version.version : `${version.label} (${version.version})`;
  const href = issueUrl({
    title: metadata.title,
    page: new URL(metadata.permalink, siteConfig.url).href,
    section: version.pluginId,
    version: versionName,
    category,
    note,
  });

  return (
    <div className={clsx('row margin-top--sm', styles.reportRow)}>
      <div className="col">
        <button
          ref={toggleRef}
          type="button"
          className={clsx('clean-btn', styles.toggle)}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}>
          <IconFlag className={styles.icon} />
          <Translate id="docs.reportProblem.toggle" description="The link at the foot of a docs page that opens the problem report panel">
            Report a problem with this page
          </Translate>
        </button>
        {open && (
          <div
            id={panelId}
            role="group"
            aria-labelledby={`${panelId}-heading`}
            className={styles.panel}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                close();
              }
            }}>
            <p id={`${panelId}-heading`} className={styles.heading}>
              <Translate id="docs.reportProblem.heading">
                What is wrong with this page?
              </Translate>
            </p>
            <label className={styles.label} htmlFor={`${panelId}-category`}>
              <Translate id="docs.reportProblem.categoryLabel">Problem</Translate>
            </label>
            <select
              ref={selectRef}
              id={`${panelId}-category`}
              className={styles.field}
              value={category}
              onChange={(e) => setCategory(e.target.value)}>
              {options.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <label className={styles.label} htmlFor={`${panelId}-note`}>
              <Translate id="docs.reportProblem.noteLabel">Details (optional)</Translate>
            </label>
            <textarea
              id={`${panelId}-note`}
              className={clsx(styles.field, styles.note)}
              rows={3}
              value={note}
              placeholder={translate({
                id: 'docs.reportProblem.notePlaceholder',
                message: 'Which section, what you expected, what you saw',
              })}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className={styles.hint}>
              <Translate id="docs.reportProblem.hint">
                This opens a new issue on GitHub with these details filled in. You can review it before you submit.
              </Translate>
            </p>
            <div className={styles.actions}>
              <a
                className="button button--primary button--sm"
                href={href}
                target="_blank"
                rel="noopener noreferrer">
                <Translate id="docs.reportProblem.submit">Open an issue on GitHub</Translate>
              </a>
              <button type="button" className="button button--secondary button--outline button--sm" onClick={close}>
                <Translate id="docs.reportProblem.cancel">Cancel</Translate>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
