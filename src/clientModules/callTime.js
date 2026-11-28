import { describeCallTime, inBuildUp } from '../../scripts/call-time';

// localise shows the community call in the announcement bar only in its
// build-up, the day before and on the day by the reader's calendar, and words
// its time in their own time zone. The built page carries the call hidden,
// with its time in Pacific and UTC.
function localise() {
  const now = Date.now();
  let shown = false;
  document.querySelectorAll('[data-kv-time]').forEach((el) => {
    const start = Date.parse(el.dataset.kvTime);
    if (inBuildUp(start, now)) {
      el.textContent = describeCallTime(start, now);
      shown = true;
    }
  });
  // A data attribute, as Docusaurus rewrites the html element's class.
  document.documentElement.dataset.kvCall = shown ? 'on' : 'off';
}

export function onRouteDidUpdate() {
  localise();
}
