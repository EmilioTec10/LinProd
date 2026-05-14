const planningAnimated = document.querySelectorAll(
  '.top-card, .panel-left, .panel-right, .add-process-btn, .top-title, .top-meta'
);

requestAnimationFrame(() => {
  planningAnimated.forEach((element, index) => {
    element.style.setProperty('--delay', `${index * 70}ms`);
    element.classList.add('reveal');
  });
});

const addProcessButton = document.querySelector('.add-process-btn');
if (addProcessButton) {
  addProcessButton.addEventListener('click', () => {
    window.location.href = 'proceso.html';
  });
}

// ---------- SVG icons ----------
function _svgUri(s) { return 'data:image/svg+xml,' + encodeURIComponent(s); }

const _SVG = {
  FACTORY: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  PLUS:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  LIST:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#698996" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
};

function _injectIcons() {
  const topLogo = document.querySelector('.top-logo');
  if (topLogo) topLogo.src = _svgUri(_SVG.FACTORY);
  const addIcon = document.querySelector('.add-process-btn .add-process-icon');
  if (addIcon) addIcon.src = _svgUri(_SVG.PLUS);
  const emptyIcon = document.querySelector('.empty-state-icon');
  if (emptyIcon) emptyIcon.src = _svgUri(_SVG.LIST);
}

document.addEventListener('DOMContentLoaded', _injectIcons);
