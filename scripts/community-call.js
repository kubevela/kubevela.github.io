// community-call finds the next KubeVela community call from the agenda
// issues in kubevela/community, whose bodies give the call's time in Pacific
// time and its Zoom link, for example:
//
//   | Meeting time | Thursday Oct 15, 2026 08:00 AM Pacific Time (PST) - ...
//
// Old agenda issues are often left open, and an agenda issue is only opened
// about a day before its call, so calls also come from the schedule the
// community keeps: every month on the third Thursday at 08:00 PT.

const hour = 60 * 60 * 1000;
// tail is how long after its start a call is still the next one.
const tail = 1 * hour;
// lead is how long before a call the site is built with it in the
// announcement bar; the browser then shows it only the day before and on the
// day, by the reader's calendar.
const lead = 48 * hour;

const zoom = 'https://zoom.us/j/5706981108?pwd=N0lOVit3Titwb3B2VitZbHhKU3k1Zz09';
const agendas =
  'https://github.com/kubevela/community/issues?q=is%3Aissue+is%3Aopen+%22Community+Meeting+Agenda%22';

const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// pacificToUtc returns the instant of a wall-clock time in Los Angeles,
// daylight saving included.
function pacificToUtc(year, month, day, hours, minutes) {
  const guess = Date.UTC(year, month, day, hours, minutes);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
      .formatToParts(new Date(guess))
      .map((p) => [p.type, p.value]),
  );
  const shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return guess + (guess - shown);
}

// parseCall reads an agenda issue's call time and Zoom link, or returns null
// when the body gives no Pacific time.
function parseCall(issue) {
  const body = issue.body || '';
  const m = /\b[A-Z][a-z]+day\s+([A-Z][a-z]{2})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,\s*(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*(?:\(|-|\s)*(?:Pacific|PST|PDT)/i.exec(body);
  if (!m || !(m[1].toLowerCase() in months)) {
    return null;
  }
  let hours = +m[4] % 12;
  if (m[6].toUpperCase() === 'PM') {
    hours += 12;
  }
  const zoom = /https:\/\/zoom\.us\/j\/[^\s|)<>]+/.exec(body);
  return {
    start: pacificToUtc(+m[3], months[m[1].toLowerCase()], +m[2], hours, +m[5]),
    zoom: zoom ? zoom[0] : null,
    agenda: issue.html_url,
  };
}

// scheduledCall is the next call by the community's schedule, the third
// Thursday of the month at 08:00 PT, that has not yet ended at the time now.
function scheduledCall(now) {
  const today = new Date(now);
  for (let k = 0; k < 3; k++) {
    const year = today.getUTCFullYear() + Math.floor((today.getUTCMonth() + k) / 12);
    const month = (today.getUTCMonth() + k) % 12;
    const firstThursday = 1 + ((4 - new Date(Date.UTC(year, month, 1)).getUTCDay() + 7) % 7);
    const start = pacificToUtc(year, month, firstThursday + 14, 8, 0);
    if (now < start + tail) {
      return { start, zoom, agenda: agendas, scheduled: true };
    }
  }
  return null;
}

// upcomingCall is the next call that has not yet ended at the time now: from
// its agenda issue when there is one, which has the exact time and agenda,
// otherwise from the schedule.
function upcomingCall(issues, now) {
  const fromIssues = issues
    .filter((i) => !i.pull_request && /Community Meeting Agenda/i.test(i.title))
    .map(parseCall)
    .filter((c) => c && c.zoom && now < c.start + tail);
  const calls = [...fromIssues, scheduledCall(now)].filter(Boolean);
  // An agenda issue and the schedule for the same call: keep the issue.
  calls.sort((a, b) => a.start - b.start || (a.scheduled ? 1 : 0) - (b.scheduled ? 1 : 0));
  const first = calls[0];
  if (!first || !first.scheduled) {
    return first || null;
  }
  const sameDay = fromIssues.find((c) => Math.abs(c.start - first.start) < 12 * hour);
  return sameDay || first;
}

// nextCall is the call to build into the announcement bar at the time now:
// the upcoming call, once it is within two days.
function nextCall(issues, now) {
  const call = upcomingCall(issues, now);
  return call && call.start - lead <= now ? call : null;
}

// callIssues reads the open issues of kubevela/community.
async function callIssues(headers) {
  const res = await fetch('https://api.github.com/repos/kubevela/community/issues?state=open&per_page=100', {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`GitHub answered ${res.status}`);
  }
  return res.json();
}

module.exports = { nextCall, upcomingCall, scheduledCall, parseCall, pacificToUtc, callIssues };
