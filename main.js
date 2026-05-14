const ctaButton = document.querySelector('.cta');
const animatedElements = document.querySelectorAll('.logo, .title, .subtitle, .description, .cta');

requestAnimationFrame(() => {
  animatedElements.forEach((element, index) => {
    element.style.setProperty('--delay', `${index * 80}ms`);
    element.classList.add('reveal');
  });
});

if (ctaButton) {
  ctaButton.addEventListener('click', () => {
    window.location.href = 'planeamiento.html';
  });
}

// ---------- SVG icons ----------
function _svgUri(s) { return 'data:image/svg+xml,' + encodeURIComponent(s); }

const _SVG = {
  FACTORY: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  ARROW:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
};

function _injectIcons() {
  const logo = document.querySelector('.logo');
  if (logo) logo.src = _svgUri(_SVG.FACTORY);
  const ctaIcon = document.querySelector('.cta-icon');
  if (ctaIcon) ctaIcon.src = _svgUri(_SVG.ARROW);
}

document.addEventListener('DOMContentLoaded', _injectIcons);
