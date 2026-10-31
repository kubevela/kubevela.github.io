// announcement.test.js checks what the announcement bar announces for a set
// of releases. Run it with `node scripts/announcement.test.js`.
const { pick, bar, version, compare } = require('./announcement');
const { nextCall, upcomingCall, scheduledCall, parseCall, pacificToUtc } = require('./community-call');
const day = 86400000;
const now = Date.parse('2026-10-17T12:00:00Z');
const rel = (tag, daysAgo, prerelease = false) => ({
  tag_name: tag, prerelease, draft: false,
  published_at: new Date(now - daysAgo * day).toISOString(),
  html_url: `https://github.com/kubevela/kubevela/releases/tag/${tag}`,
});
const cases = [
  ['stable 3 days old', [rel('v1.12.0', 3), rel('v1.11.2', 60)], 'release-v1.12.0'],
  ['stable 20 days old', [rel('v1.12.0', 20)], null],
  ['stable exactly 14 days', [rel('v1.12.0', 14)], 'release-v1.12.0'],
  ['patch counts as latest', [rel('v1.12.1', 2), rel('v1.12.0', 30)], 'release-v1.12.1'],
  ['old stable + alpha', [rel('v1.13.0-alpha.1', 5, true), rel('v1.12.0', 40)], 'release-v1.13.0-alpha.1'],
  ['new stable + alpha', [rel('v1.13.0-alpha.2', 1, true), rel('v1.13.0-alpha.1', 9, true), rel('v1.12.0', 4)], 'release-v1.12.0-v1.13.0-alpha.2'],
  ['alpha whose version shipped', [rel('v1.13.0', 30), rel('v1.13.0-rc.1', 40, true)], null],
  ['rc after beta', [rel('v1.13.0-beta.3', 6, true), rel('v1.13.0-rc.1', 2, true), rel('v1.12.0', 50)], 'release-v1.13.0-rc.1'],
  ['alpha.10 after alpha.9', [rel('v1.13.0-alpha.9', 6, true), rel('v1.13.0-alpha.10', 2, true), rel('v1.12.0', 50)], 'release-v1.13.0-alpha.10'],
  ['old-line prerelease ignored', [rel('v1.11.5-rc.1', 1, true), rel('v1.12.0', 50)], null],
  ['non-version tags ignored', [{ ...rel('nightly', 1, true) }, rel('v1.12.0', 50)], null],
  ['nothing', [], null],
  ['alpha flagged as full release', [rel('v1.13.0-alpha.6', 3, false), rel('v1.12.0', 60)], 'release-v1.13.0-alpha.6'],
  ['backport after new minor', [rel('v1.11.9', 1), rel('v1.12.0', 20)], null],
  ['backport after fresh minor', [rel('v1.11.9', 1), rel('v1.12.0', 5)], 'release-v1.12.0'],
  ['real list on 2026-07-21', [rel('v1.11.0', 1), rel('v1.11.0-alpha.6', 12), rel('v1.9.14', 21), rel('v1.10.9', 21)], 'release-v1.11.0'],
  ['real list on 2026-07-10', [rel('v1.11.0-alpha.6', 1), rel('v1.11.0-alpha.5', 5), rel('v1.10.8', 100)], 'release-v1.11.0-alpha.6'],
];
let fail = 0;
for (const [name, list, want] of cases) {
  const b = bar(pick(list, now));
  const got = b ? b.id : null;
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`);
}
const both = bar(pick(cases[5][1], now));
console.log(both.content.includes('KubeVela v1.12 is out') && both.content.includes('Try the upcoming v1.13.0-alpha.2') ? 'ok   both parts present' : 'FAIL both parts');
console.log(compare(version('v1.13.0-rc.1'), version('v1.13.0')) < 0 ? 'ok   rc before release' : 'FAIL rc order');

// Community calls, from agenda issue bodies as kubevela/community writes them.
const zoom = 'https://zoom.us/j/5706981108?pwd=N0lOVit3Titwb3B2VitZbHhKU3k1Zz09';
const agenda = (n, line, extra = '') => ({
  title: 'Community Meeting Agenda',
  html_url: `https://github.com/kubevela/community/issues/${n}`,
  body: `${extra}\n| 🔗 Meeting Link & Password (*English*) | **Zoom Call:** ${zoom}\n| Meeting time | ${line} - [See it in your local time](https://example.test)`,
});
const oct15 = agenda(281, 'Thursday Oct 15, 2026 08:00 AM Pacific Time (PST)');
const at = (iso) => Date.parse(iso);
const callCases = [
  ['call parsed in PDT', parseCall(oct15).start === at('2026-10-15T15:00:00Z')],
  ['winter call in PST', parseCall(agenda(1, 'Thursday Dec 17, 2026 08:00 AM Pacific Time (PST)')).start === at('2026-12-17T16:00:00Z')],
  ['ordinal day', parseCall(agenda(254, 'Thursday Oct 16th, 2025 08:00 AM Pacific Time (PST)')).start === at('2025-10-16T15:00:00Z')],
  ['afternoon', parseCall(agenda(2, 'Thursday Oct 15, 2026 01:30 PM Pacific Time')).start === at('2026-10-15T20:30:00Z')],
  ['china time skipped', parseCall(agenda(212, 'Tuesday Jan 23, 2024 19:00 PM China Standard Time (CST)')) === null],
  ['zoom link read', parseCall(oct15).zoom === zoom],
  ['built in two days before', nextCall([oct15], at('2026-10-13T15:00:00Z')) !== null],
  ['not built in sooner', nextCall([oct15], at('2026-10-13T14:59:00Z')) === null],
  ['59 minutes in: still built in', nextCall([oct15], at('2026-10-15T15:59:00Z')) !== null],
  ['an hour in: the next month instead', upcomingCall([oct15], at('2026-10-15T16:00:00Z')).start === at('2026-11-19T16:00:00Z')],
  ['old open agendas ignored', upcomingCall([agenda(210, 'Thursday Jan 4, 2024 08:00 AM Pacific Time')], at('2026-10-15T09:00:00Z')).scheduled === true],
  ['schedule: third Thursday', scheduledCall(at('2026-10-01T00:00:00Z')).start === at('2026-10-15T15:00:00Z')],
  ['schedule: into next year', scheduledCall(at('2026-12-20T00:00:00Z')).start === at('2027-01-21T16:00:00Z')],
  ['agenda issue preferred', upcomingCall([oct15], at('2026-10-15T09:00:00Z')).agenda.endsWith('/issues/281')],
  ['agenda issue moved time', upcomingCall([agenda(3, 'Thursday Oct 15, 2026 09:30 AM Pacific Time')], at('2026-10-15T09:00:00Z')).start === at('2026-10-15T16:30:00Z')],
];
for (const [name, ok] of callCases) {
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
}
const withCall = bar({ ...pick([rel('v1.12.0', 3)], now), call: nextCall([oct15], at('2026-10-15T09:00:00Z')) });
const callFirst = withCall.content.indexOf('Community call') < withCall.content.indexOf('is out');
const plain = withCall.content.replace(/<[^>]+>/g, '');
const callText = plain.includes('Join us for the community call, Thu 15 Oct at 08:00 PT (15:00 UTC).') && withCall.content.includes('data-kv-time="2026-10-15T15:00:00.000Z"');
if (!(callFirst && callText && withCall.id === 'release-call-2026-10-15-v1.12.0')) fail++;
console.log(`${callFirst && callText ? 'ok  ' : 'FAIL'} call first, worded, id ${withCall.id}`);


// The call's time in a reader's own time zone.
const { describeCallTime } = require('./call-time');
const start = at('2026-10-15T15:00:00Z');
const timeCases = [
  ['Dublin, morning of', describeCallTime(start, at('2026-10-15T08:00:00Z'), { timeZone: 'Europe/Dublin', locale: 'en-GB' }), ' today at 16:00 GMT+1'],
  ['California, evening before', describeCallTime(start, at('2026-10-15T03:00:00Z'), { timeZone: 'America/Los_Angeles', locale: 'en-US' }), ' tomorrow at 08:00 AM PDT'],
  ['Tokyo, after midnight on the day', describeCallTime(start, at('2026-10-15T00:00:00Z'), { timeZone: 'Asia/Tokyo', locale: 'en-GB' }), ' tomorrow at 00:00 GMT+9'],
  ['started', describeCallTime(start, at('2026-10-15T15:10:00Z'), { timeZone: 'UTC' }), ' now'],
  ['two days ahead', describeCallTime(start, at('2026-10-13T12:00:00Z'), { timeZone: 'UTC', locale: 'en-GB' }), ', Thu 15 Oct at 15:00 UTC'],
];
for (const [name, got, want] of timeCases) {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: "${got}"${ok ? '' : ` (want "${want}")`}`);
}


// The build-up: the day before and the day of a call, by the reader's calendar.
const { inBuildUp, callDate } = require('./call-time');
const upCases = [
  ['Dublin, two days before', inBuildUp(start, at('2026-10-13T20:00:00Z'), { timeZone: 'Europe/Dublin' }) === false],
  ['Dublin, the day before', inBuildUp(start, at('2026-10-14T08:00:00Z'), { timeZone: 'Europe/Dublin' }) === true],
  ['Dublin, the morning of', inBuildUp(start, at('2026-10-15T07:00:00Z'), { timeZone: 'Europe/Dublin' }) === true],
  ['an hour in: over', inBuildUp(start, at('2026-10-15T16:00:00Z'), { timeZone: 'Europe/Dublin' }) === false],
  ['Tokyo: the day before is the 15th', inBuildUp(start, at('2026-10-14T16:00:00Z'), { timeZone: 'Asia/Tokyo' }) === true],
  ['card date', callDate(start, { timeZone: 'Europe/Dublin', locale: 'en-IE' }) === 'Thu 15 Oct at 16:00 IST'],
];
for (const [name, ok] of upCases) {
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
}

process.exit(fail ? 1 : 0);
