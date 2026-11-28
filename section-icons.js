// One icon per docs section, shared by the Documentation menu (docusaurus.config.js) and the sidebar header.
// Line icons take the KubeVela mark's two tones: the main shape in its blue, the details in the text colour
// (the mark's hull), so they follow the theme the way the logo does.
const BLUE = '#006fff';
const blue = (body) => `<g stroke="${BLUE}">${body}</g>`;
const line = (body) =>
  `<svg class="section-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ` +
  `stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

// Path data for the icons drawn as a single path in each tone, which other components can draw at their own size.
const PATHS = {
  // A package: addons install as one.
  addons: {main: 'M12 3l8 4.5v9L12 21l-8-4.5v-9Z', detail: 'M4 7.5l8 4.5 8-4.5M12 12v9M8 5.25l8 4.5'},
};

const ICONS = {
  // The KubeVela mark: brand-blue sails, the hull in the text colour.
  default:
    '<svg class="section-icon" viewBox="36 13 56 60" width="18" height="18" aria-hidden="true">' +
    '<path fill="currentColor" d="M47,67.85a7.58,7.58,0,0,0,6.55,3.78,7.42,7.42,0,0,0,3.66-1,3.89,3.89,0,0,1,3.85,0,7.52,7.52,0,0,0,7.11.13,4,4,0,0,1,3.72,0,7.55,7.55,0,0,0,10-3Z"/>' +
    '<path fill="#006fff" d="M85.87,54.8l-.09-1.47c-.91-14.52-6.32-28.16-15.23-38.39h0V54.1Z"/>' +
    '<path fill="#006fff" d="M68.46,54V23.14A51.85,51.85,0,0,0,53.53,53.32Z"/>' +
    '<path fill="currentColor" d="M54.75,56.18l-1.2-2.85-14.16-.65,3.89,9.23h0a6.64,6.64,0,0,0,8.94,2.49,4.76,4.76,0,0,1,4.68,0,6.63,6.63,0,0,0,6.39,0,4.76,4.76,0,0,1,4.68,0,6.63,6.63,0,0,0,6.39,0,4.76,4.76,0,0,1,4.68,0A6.63,6.63,0,0,0,88,61.91l1.61-3.25L56.12,57.13A1.54,1.54,0,0,1,54.75,56.18Z"/>' +
    '</svg>',
  // Steps joined into a flow.
  workflow: line(
    blue('<rect x="3" y="3.5" width="6" height="5" rx="1.2"/><rect x="3" y="15.5" width="6" height="5" rx="1.2"/>' +
      '<rect x="15" y="9.5" width="6" height="5" rx="1.2"/>') + '<path d="M9 6h2.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H9M13 12h2"/>',
  ),
  // A dashboard window.
  velaux: line(blue('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>') + '<path d="M9 9v11M12.5 13h5M12.5 16.5h3"/>'),
  // A cloud, for the cloud resources Terraform provisions.
  terraform: line(blue('<path d="M7 19a4.5 4.5 0 0 1-.7-8.95A6 6 0 0 1 17.6 9 5 5 0 0 1 17 19Z"/>') + '<path d="M9 15h6"/>'),
  addons: line(blue(`<path d="${PATHS.addons.main}"/>`) + `<path d="${PATHS.addons.detail}"/>`),
  // A hub routing to member clusters.
  'cluster-gateway': line(
    blue('<circle cx="12" cy="12" r="2.6"/>') + '<circle cx="4.5" cy="5" r="1.8"/><circle cx="19.5" cy="5" r="1.8"/>' +
      '<circle cx="4.5" cy="19" r="1.8"/><circle cx="19.5" cy="19" r="1.8"/>' +
      '<path d="M6 6.4l4.1 3.8M18 6.4l-4.1 3.8M6 17.6l4.1-3.8M18 17.6l-4.1-3.8"/>',
  ),
  // A prism splitting one beam into several: one API server, several APIs.
  prism: line(blue('<path d="M10 3.5 18 19H2Z"/>') + '<path stroke-width="1.5" d="M.8 13.5 5.6 12.3M14.6 12.3 23 9M14.6 12.3 23 12.6M14.6 12.3 23 16.2"/>'),
};

// The menu item's contents: the icon, then the label.
const sectionItem = (id, label) => `${ICONS[id]}<span>${label}</span>`;

module.exports = {BLUE, ICONS, PATHS, sectionItem};
