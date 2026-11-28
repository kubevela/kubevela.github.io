// call-time words a community call's start for a reader, in their time zone:
// "today at 16:00 IST", "tomorrow at 08:00 PDT", "now" once it has started,
// or the day and date further ahead, and says whether the call is in its
// build-up: the day before or the day itself, until an hour after it starts.
// The browser runs it over the page; tests pass a fixed time zone.

// dayKey is the calendar date of an instant in a time zone, for comparing days.
function dayKey(ms, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(ms),
  );
}

// describeCallTime returns the words after "Join us for the community call",
// including their leading punctuation.
function describeCallTime(start, now, { timeZone, locale } = {}) {
  if (now >= start) {
    return ' now';
  }
  const time = new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(start));
  const zone =
    new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
      .formatToParts(new Date(start))
      .find((p) => p.type === 'timeZoneName')?.value || '';
  const at = `at ${time}${zone ? ` ${zone}` : ''}`;
  const day = 24 * 60 * 60 * 1000;
  if (dayKey(start, timeZone) === dayKey(now, timeZone)) {
    return ` today ${at}`;
  }
  if (dayKey(start, timeZone) === dayKey(now + day, timeZone)) {
    return ` tomorrow ${at}`;
  }
  const date = ['weekday', 'day', 'month']
    .map((part) => new Intl.DateTimeFormat('en-GB', { timeZone, [part]: part === 'day' ? 'numeric' : 'short' }).format(new Date(start)))
    .join(' ');
  return `, ${date} ${at}`;
}

// callDate is a call's day and time, such as "Thu 15 Oct at 16:00 IST".
function callDate(start, { timeZone, locale } = {}) {
  return describeCallTime(start, start - 3 * 24 * 60 * 60 * 1000, { timeZone, locale }).replace(/^, /, '');
}

// inBuildUp reports whether the time now is the day before a call or its day,
// by the reader's calendar, and no more than an hour after it starts.
function inBuildUp(start, now, { timeZone } = {}) {
  const day = 24 * 60 * 60 * 1000;
  if (now >= start + 60 * 60 * 1000) {
    return false;
  }
  return dayKey(start, timeZone) === dayKey(now, timeZone) || dayKey(start, timeZone) === dayKey(now + day, timeZone);
}

module.exports = { describeCallTime, callDate, inBuildUp };
