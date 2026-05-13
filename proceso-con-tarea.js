const filledAnimated = document.querySelectorAll(
  '.top-card, .process-list-short, .process-form-panel-short, .form-block, .task-item, .actions'
);

requestAnimationFrame(() => {
  filledAnimated.forEach((element, index) => {
    element.style.setProperty('--delay', `${index * 50}ms`);
    element.classList.add('reveal');
  });
});

function loadDraft() {
  try {
    const raw = sessionStorage.getItem('process_draft');
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore */ }
  return {
    processName: 's',
    taskName: 'q',
    cycles: 2,
    position: 'cola'
  };
}

const draft = loadDraft();

const processInput = document.getElementById('nombre-proceso-filled');
const taskInput = document.getElementById('nombre-tarea-filled');
const cyclesInput = document.getElementById('ciclos-filled');
const taskNameText = document.querySelector('.task-name');
const taskTimeText = document.querySelector('.task-time');

if (processInput) processInput.value = draft.processName;
if (taskInput) taskInput.value = draft.taskName;
if (cyclesInput) cyclesInput.value = draft.cycles;
if (taskNameText) taskNameText.textContent = draft.taskName;
if (taskTimeText) taskTimeText.textContent = `${draft.cycles} minutos`;

const positionRadio = document.querySelector(`input[name="posicion-filled"][value="${draft.position}"]`);
if (positionRadio) {
  document.querySelectorAll('.radio-option').forEach((opt) => opt.classList.remove('selected'));
  positionRadio.checked = true;
  positionRadio.closest('.radio-option')?.classList.add('selected');
}

const cancelBtn = document.querySelector('.btn-ghost');
if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    window.location.href = 'planeamiento.html';
  });
}

const saveBtn = document.querySelector('.btn-solid');
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    const totalProducts = (() => {
      const raw = sessionStorage.getItem('sim_config');
      if (!raw) return 5;
      try {
        const parsed = JSON.parse(raw);
        return Number(parsed.totalProducts) || 5;
      } catch (_) {
        return 5;
      }
    })();

    const config = {
      processes: [
        {
          name: draft.processName,
          tasks: [{ name: draft.taskName, durationMin: Number(draft.cycles) || 2 }]
        }
      ],
      totalProducts,
      speedMultiplier: 10
    };

    sessionStorage.setItem('sim_config', JSON.stringify(config));
    window.location.href = 'linea-configurada.html';
  });
}
