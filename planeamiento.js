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
