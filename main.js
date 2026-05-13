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
