import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';
import './konami.css';

// The Konami code, typed anywhere outside a text field, opens a terminal that
// types vela up --cluster moon; on enter it gives way to the KubeVela boat
// flying to the moon, where it raises a Kubernetes flag.
const CODE = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

// The sail and hull of the KubeVela logo, hull in currentColor.
const SAIL = `<g fill="currentColor"><path d="M47,67.85a7.58,7.58,0,0,0,6.55,3.78,7.42,7.42,0,0,0,3.66-1,3.89,3.89,0,0,1,3.85,0,7.52,7.52,0,0,0,7.11.13,4,4,0,0,1,3.72,0,7.55,7.55,0,0,0,10-3Z"/><path d="M54.75,56.18l-1.2-2.85-14.16-.65,3.89,9.23h0a6.64,6.64,0,0,0,8.94,2.49,4.76,4.76,0,0,1,4.68,0,6.63,6.63,0,0,0,6.39,0,4.76,4.76,0,0,1,4.68,0,6.63,6.63,0,0,0,6.39,0,4.76,4.76,0,0,1,4.68,0A6.63,6.63,0,0,0,88,61.91l1.61-3.25L56.12,57.13A1.54,1.54,0,0,1,54.75,56.18Z"/></g><g fill="#006fff"><path d="M85.87,54.8l-.09-1.47c-.91-14.52-6.32-28.16-15.23-38.39h0V54.1Z"/><path d="M68.46,54V23.14A51.85,51.85,0,0,0,53.53,53.32Z"/></g>`;

// The flight, from the water at bottom left to the top of the moon.
const FLIGHT = 'M 70 266 C 110 150, 220 40, 318 47';
const SPLINE = '0.45 0 0.35 1';
const COMMAND = 'vela up --cluster moon';

// stars places the same scatter of stars on every visit.
function stars() {
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let out = '';
  for (let i = 0; i < 70; i++) {
    const r = rand() < 0.15 ? 1.3 : 0.7;
    out += `<circle class="kv-moon-star" cx="${(rand() * 400).toFixed(1)}" cy="${(rand() * 250).toFixed(1)}" r="${r}" style="animation-delay:${(rand() * 3).toFixed(2)}s"/>`;
  }
  return out;
}

// scene draws the flight; still draws its last frame, for reduced motion.
function scene(still) {
  const flag = `${siteConfig.baseUrl}img/logs/k8s.svg`;
  const anim = (s) => (still ? '' : s);
  const ship = still ? ' transform="translate(318 47)"' : '';
  return `
<svg class="kv-moon-sky" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <defs>
    <mask id="kv-moon-trail-mask">
      <path d="${FLIGHT}" fill="none" stroke="#fff" stroke-width="6" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${still ? 0 : 1}">
        ${anim(`<animate attributeName="stroke-dashoffset" from="1" to="0" begin="0.9s" dur="3.2s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="${SPLINE}"/>`)}
      </path>
    </mask>
  </defs>
  ${stars()}
  <g class="kv-moon-moon">
    <circle cx="320" cy="95" r="48"/>
    <circle class="kv-moon-crater" cx="304" cy="88" r="9"/>
    <circle class="kv-moon-crater" cx="334" cy="112" r="6"/>
    <circle class="kv-moon-crater" cx="326" cy="76" r="4"/>
    <circle class="kv-moon-crater" cx="300" cy="118" r="4.5"/>
  </g>
  <path class="kv-moon-sea" d="M 0 270 Q 12 264, 24 270 T 48 270 T 72 270 T 96 270 T 120 270 T 144 270 T 168 270 T 192 270 T 216 270 T 240 270 T 264 270 T 288 270 T 312 270 T 336 270 T 360 270 T 384 270 V 300 H 0 Z"/>
  <path class="kv-moon-wave" d="M 0 270 Q 12 264, 24 270 T 48 270 T 72 270 T 96 270 T 120 270 T 144 270 T 168 270 T 192 270 T 216 270 T 240 270 T 264 270 T 288 270 T 312 270 T 336 270 T 360 270 T 384 270"/>
  <path class="kv-moon-trail" d="${FLIGHT}" mask="url(#kv-moon-trail-mask)"/>
  <g class="kv-moon-flag">
    <line x1="346" y1="55" x2="346" y2="${still ? 13 : 55}">
      ${anim(`<animate attributeName="y2" from="55" to="13" begin="4.3s" dur="0.4s" fill="freeze"/>`)}
    </line>
    <g transform="translate(0 ${still ? 0 : 24})" opacity="${still ? 1 : 0}">
      ${anim(`<animate attributeName="opacity" from="0" to="1" begin="4.7s" dur="0.1s" fill="freeze"/>
      <animateTransform attributeName="transform" type="translate" from="0 24" to="0 0" begin="4.7s" dur="1.1s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1"/>`)}
      <path class="kv-moon-cloth" d="M 346 13 h 30 q -3 10, 0 20 h -30 Z"/>
      <image href="${flag}" x="353" y="15.5" width="16" height="15.5"/>
    </g>
  </g>
  <g${ship}>
    ${anim(`<animateMotion path="${FLIGHT}" begin="0s" dur="4.1s" fill="freeze" calcMode="spline" keyPoints="0;0;1" keyTimes="0;0.22;1" keySplines="0 0 1 1;${SPLINE}"/>`)}
    <g>
      ${anim(`<animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0" dur="0.45s" repeatCount="2"/>`)}
      <g class="kv-moon-ship">
        ${anim(`<animateTransform attributeName="transform" type="rotate" values="0;-16;-10;0" keyTimes="0;0.3;0.8;1" begin="0.9s" dur="3.2s" fill="freeze"/>`)}
        <svg x="-24" y="-42" width="50" height="50" viewBox="26.517 6.152 79.431 78.847">${SAIL}</svg>
      </g>
    </g>
  </g>
</svg>
<div class="kv-moon-caption">
  ${still ? `<code>$ ${COMMAND}</code>` : ''}
  <p><span>✓</span> Application deployed to the Moon</p>
  <small>Esc or click to come back down</small>
</div>`;
}

const TERMINAL = `
<div class="kv-moon-term">
  <div class="kv-moon-term-bar"><i></i><i></i><i></i><span>vela</span></div>
  <pre><span class="kv-moon-prompt">$</span> <span class="kv-moon-typed"></span><span class="kv-moon-cursor"></span></pre>
</div>`;

function launch() {
  if (document.querySelector('.kv-moon')) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.createElement('div');
  overlay.className = `kv-moon${still ? ' kv-moon-still' : ''}`;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'KubeVela flies to the moon');
  overlay.tabIndex = -1;
  const timers = [];
  const after = (ms, fn) => timers.push(setTimeout(fn, ms));
  // The scene's animations run from when it is added to the page.
  const showScene = () => {
    const sky = document.createElement('div');
    sky.className = 'kv-moon-scene';
    sky.innerHTML = scene(still);
    overlay.appendChild(sky);
  };
  const close = () => {
    timers.forEach(clearTimeout);
    overlay.remove();
    document.removeEventListener('keydown', onKey, true);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(overlay);
  overlay.focus();
  if (still) {
    showScene();
    return;
  }
  overlay.innerHTML = TERMINAL;
  const term = overlay.querySelector('.kv-moon-term');
  const typed = overlay.querySelector('.kv-moon-typed');
  const start = 500;
  const step = 70;
  [...COMMAND].forEach((ch, i) => after(start + i * step, () => (typed.textContent += ch)));
  const enter = start + COMMAND.length * step + 450;
  after(enter, () => term.classList.add('kv-moon-entered'));
  after(enter + 350, () => {
    term.classList.add('kv-moon-gone');
    showScene();
  });
  after(enter + 1000, () => term.remove());
}

if (ExecutionEnvironment.canUseDOM) {
  let at = 0;
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    const key = (e.key || '').toLowerCase();
    at = key === CODE[at] ? at + 1 : key === CODE[0] ? 1 : 0;
    if (at === CODE.length) {
      at = 0;
      launch();
    }
  });
}
