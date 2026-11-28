// Builds a link to a new issue from .github/ISSUE_TEMPLATE/docs-problem.yml.
// Each query parameter is named after the form field id it fills.

export const ISSUE_REPO = 'kubevela/kubevela.github.io';
export const ISSUE_TEMPLATE = 'docs-problem.yml';

// GitHub rejects very long URLs, so the note is cut to keep the link under this length.
export const MAX_URL_LENGTH = 6000;
const TRUNCATED = ' [truncated]';

function buildUrl(fields) {
  const query = Object.entries({template: ISSUE_TEMPLATE, ...fields})
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return `https://github.com/${ISSUE_REPO}/issues/new?${query}`;
}

export function issueUrl({title, page, section, version, category, note}) {
  const fields = {
    title: `Docs: ${category}: ${title}`,
    page,
    section,
    version,
    category,
  };
  const text = (note || '').trim();
  if (!text) {
    return buildUrl(fields);
  }
  let url = buildUrl({...fields, note: text});
  if (url.length <= MAX_URL_LENGTH) {
    return url;
  }
  // Encoding grows multi-byte characters, so shrink until the encoded link fits.
  const chars = Array.from(text);
  let keep = chars.length;
  while (keep > 0) {
    keep = Math.floor(keep * 0.9);
    url = buildUrl({...fields, note: chars.slice(0, keep).join('') + TRUNCATED});
    if (url.length <= MAX_URL_LENGTH) {
      return url;
    }
  }
  return buildUrl(fields);
}
