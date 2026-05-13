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
