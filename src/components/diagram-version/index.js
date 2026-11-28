// A diagram on a versioned docs page takes that page's KubeVela version, such as version="1.11", and draws only
// what that version has. With no version it draws the next release.

// isBefore reports whether version is older than since; no version is the next release, older than nothing.
export function isBefore(version, since) {
  if (!version) return false;
  const [a, b] = version.split('.').map(Number);
  const [c, d] = since.split('.').map(Number);
  return a < c || (a === c && b < d);
}

// hasSources reports whether a KubeVela version has Application sources, new in 1.12.
export function hasSources(version) {
  return !isBefore(version, '1.12');
}
