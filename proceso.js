const processAnimated = document.querySelectorAll(
  '.top-card, .process-list, .process-form-panel, .form-block, .actions, .hint'
);

requestAnimationFrame(() => {
  processAnimated.forEach((element, index) => {
    element.style.setProperty('--delay', `${index * 55}ms`);
    element.classList.add('reveal');
  });
});

const positionOptions = document.querySelectorAll('.radio-option input[name="posicion"]');
positionOptions.forEach((option) => {
  option.addEventListener('change', () => {
    document.querySelectorAll('.radio-option').forEach((label) => label.classList.remove('selected'));
    if (option.checked) {
      option.closest('.radio-option').classList.add('selected');
    }
  });
});

const processName = document.querySelector('#nombre-proceso');
const taskName = document.querySelector('#nombre-tarea');
const taskCycles = document.querySelector('#ciclos');
const addTaskButton = document.querySelector('.add-task-btn');
const helperHint = document.querySelector('.hint');

const refreshAddTaskState = () => {
  if (!addTaskButton || !taskName || !taskCycles) {
    return;
  }

  const hasTaskName = taskName.value.trim().length > 0;
  const cycles = Number(taskCycles.value);
  const hasValidCycles = Number.isFinite(cycles) && cycles > 0;
  const processReady = processName && processName.value.trim().length > 0;
  const canAddTask = hasTaskName && hasValidCycles && processReady;

  addTaskButton.disabled = !canAddTask;
  addTaskButton.classList.toggle('disabled', !canAddTask);
  addTaskButton.classList.toggle('enabled', canAddTask);

  if (helperHint) {
    helperHint.textContent = canAddTask
      ? 'Agrega al menos una tarea'
      : 'Ingresa un nombre para el proceso';
  }
};

[processName, taskName, taskCycles].forEach((field) => {
  if (field) {
    field.addEventListener('input', refreshAddTaskState);
  }
});

if (addTaskButton) {
  addTaskButton.addEventListener('click', () => {
    if (!addTaskButton.disabled) {
      const selectedPosition = document.querySelector('input[name="posicion"]:checked')?.value || 'cola';
      const draft = {
        processName: processName?.value.trim() || 's',
        taskName: taskName?.value.trim() || 'q',
        cycles: Number(taskCycles?.value) || 2,
        position: selectedPosition
      };
      sessionStorage.setItem('process_draft', JSON.stringify(draft));
      window.location.href = 'proceso-con-tarea.html';
    }
  });
}

refreshAddTaskState();

// ---------- SVG icons ----------
function _svgUri(s) { return 'data:image/svg+xml,' + encodeURIComponent(s); }

const _SVG = {
  FACTORY: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  PLUS:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
};

function _injectIcons() {
  const topLogo = document.querySelector('.top-logo');
  if (topLogo) topLogo.src = _svgUri(_SVG.FACTORY);
  document.querySelectorAll('.add-process-icon').forEach(img => {
    img.src = _svgUri(_SVG.PLUS);
  });
}

document.addEventListener('DOMContentLoaded', _injectIcons);
