// announcement builds the site's announcement bar from GitHub when the site
// is built, so a release or a community call needs no config edit:
//
//   - the next community call, the day before and on the day;
//   - the latest stable release, for two weeks after it is published;
//   - the newest pre-release, while its version has no stable release.
//
// With none of these, or when GitHub cannot be reached, the site has no bar.
// The bar's id names what it announces, so each new announcement shows again
// to readers who closed the last one.

const { nextCall, upcomingCall, callIssues } = require('./community-call');

const repo = 'kubevela/kubevela';
const stableDays = 14;
const day = 24 * 60 * 60 * 1000;

// githubHeaders are the API request headers. A GITHUB_TOKEN in the
// environment, as CI has, lifts the anonymous rate limit.
function githubHeaders() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

// releases reads the repository's recent published releases.
async function releases(headers) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=50`, {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`GitHub answered ${res.status}`);
  }
  return (await res.json()).filter((r) => !r.draft);
}

// version parses a tag such as v1.12.0 or v1.12.0-alpha.2; tags that are not
// versions parse to null.
function version(tag) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(tag);
  if (!m) {
    return null;
  }
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] || '', base: `v${m[1]}.${m[2]}.${m[3]}` };
}

// compare orders versions: by number, then a pre-release before its release,
// then pre-releases by their suffix.
function compare(a, b) {
  for (const k of ['major', 'minor', 'patch']) {
    if (a[k] !== b[k]) {
      return a[k] - b[k];
    }
  }
  if (!a.pre || !b.pre) {
    return (a.pre ? -1 : 0) - (b.pre ? -1 : 0);
  }
  return a.pre.localeCompare(b.pre, 'en', { numeric: true });
}

// pick chooses what to announce from the releases at the time now. Releases
// are ordered by version, not date, as backport patches to older lines are
// published after newer releases.
function pick(list, now) {
  const parsed = list
    .map((r) => ({ ...r, v: version(r.tag_name) }))
    .filter((r) => r.v)
    .sort((a, b) => compare(b.v, a.v));
  // A pre-release is known by its tag (v1.12.0-alpha.1): GitHub's prerelease
  // flag is not set reliably on KubeVela's releases.
  const stables = parsed.filter((r) => !r.v.pre);
  const latest = stables[0];
  const stable = latest && now - Date.parse(latest.published_at) <= stableDays * day ? latest : null;
  const released = new Set(stables.map((r) => r.v.base));
  const pre = parsed.find(
    (r) => r.v.pre && !released.has(r.v.base) && (!latest || compare(r.v, latest.v) > 0),
  );
  return { stable, pre: pre || null };
}

function link(href, text) {
  return `<a target="_blank" rel="noopener noreferrer" href="${href}">${text}</a>`;
}

// callTime writes a call's start as its Pacific day and time, with UTC on
// wider screens. In the browser it is rewritten into the reader's own time
// zone, from its data-kv-time.
function callTime(start) {
  const at = (zone, opts) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, ...opts }).format(new Date(start));
  const day = ['weekday', 'day', 'month']
    .map((part) => at('America/Los_Angeles', { [part]: part === 'day' ? 'numeric' : 'short' }))
    .join(' ');
  const pt = at('America/Los_Angeles', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const utc = at('UTC', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const iso = new Date(start).toISOString();
  return `<span data-kv-time="${iso}">, ${day} at ${pt} PT<span class="kv-ann-wide"> (${utc} UTC)</span></span>`;
}

// bar renders the announcement for a pick, or null when there is nothing to
// announce. The community call, the most time-bound, comes first.
function bar({ stable, pre, call }) {
  const parts = [];
  const ids = [];
  // The call is built hidden; the browser shows it the day before and on the
  // day, by the reader's calendar, as the build cannot know their time zone.
  let callPart = '';
  if (call) {
    callPart =
      `<span class="kv-ann-call">` +
      `<span class="kv-ann-tag kv-ann-tag-call">Community call</span>` +
      `<span>Join us<span class="kv-ann-wide"> for the community call</span>${callTime(call.start)}.</span> ` +
      link(call.zoom, 'Join on Zoom &rarr;') +
      (call.scheduled ? '' : `<span class="kv-ann-wide"> ${link(call.agenda, 'Agenda')}</span>`) +
      '</span>';
    ids.push(`call-${new Date(call.start).toISOString().slice(0, 10)}`);
  }
  if (stable) {
    // A minor release reads as v1.12; a patch by its full version.
    const name = stable.v.patch ? stable.tag_name : `v${stable.v.major}.${stable.v.minor}`;
    parts.push(
      `<span class="kv-ann-tag">New</span><span>KubeVela ${name} is out.</span> ` +
        link(stable.html_url, 'Read the release notes &rarr;'),
    );
    ids.push(stable.tag_name);
  }
  if (pre) {
    parts.push(
      `<span class="kv-ann-tag kv-ann-tag-preview">Preview</span><span>Try the upcoming ${pre.tag_name}.</span> ` +
        link(pre.html_url, 'See what&rsquo;s coming &rarr;'),
    );
    ids.push(pre.tag_name);
  }
  if (!parts.length && !callPart) {
    return null;
  }
  if (callPart && parts.length) {
    callPart = callPart.replace(/<\/span>$/, '<span class="kv-ann-sep"></span></span>');
  }
  // With the call alone, the bar stays hidden until the browser shows the call.
  const only = callPart && !parts.length ? '<span class="kv-ann-only-call"></span>' : '';
  const star = `<span class="kv-ann-star"><span class="kv-ann-sep"></span>${link(`https://github.com/${repo}`, 'Star us on GitHub')}</span>`;
  return {
    id: `release-${ids.join('-')}`,
    content: only + callPart + parts.join('<span class="kv-ann-sep"></span>') + star,
    backgroundColor: 'var(--kv-ann-bg)',
    textColor: 'var(--kv-ann-text)',
  };
}

// fromGitHub reads releases and community calls in parallel, returning the
// announcement bar and the upcoming call; either read failing leaves out only
// its own part. ANNOUNCEMENT_AT, an ISO time, builds them as they would be
// then, to preview an announcement.
async function fromGitHub(now = process.env.ANNOUNCEMENT_AT ? Date.parse(process.env.ANNOUNCEMENT_AT) : Date.now()) {
  const headers = githubHeaders();
  const [rel, calls] = await Promise.allSettled([releases(headers), callIssues(headers)]);
  if (rel.status === 'rejected') {
    console.warn(`[announcement] no release in the bar: cannot read releases (${rel.reason.message})`);
  }
  if (calls.status === 'rejected') {
    console.warn(`[announcement] no community call in the bar: cannot read issues (${calls.reason.message})`);
  }
  const picked = rel.status === 'fulfilled' ? pick(rel.value, now) : { stable: null, pre: null };
  const issues = calls.status === 'fulfilled' ? calls.value : [];
  const upcoming = upcomingCall(issues, now);
  return {
    announcementBar: bar({ ...picked, call: nextCall(issues, now) }),
    nextCall: upcoming && { start: new Date(upcoming.start).toISOString(), zoom: upcoming.zoom, agenda: upcoming.agenda },
  };
}

module.exports = { fromGitHub, pick, bar, version, compare, callTime };
