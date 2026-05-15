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
  return { processName: 's', taskName: 'q', cycles: 2, position: 'cola' };
}

const draft = loadDraft();

// Task list — seeded with the first task captured in proceso.html
const _tasks = [{ name: draft.taskName, cycles: Number(draft.cycles) || 2 }];

// ---------- DOM refs ----------
const processInput = document.getElementById('nombre-proceso-filled');
const taskInput    = document.getElementById('nombre-tarea-filled');
const cyclesInput  = document.getElementById('ciclos-filled');
const addTaskBtn   = document.querySelector('.add-task-btn');

// Set process name (locked — came from proceso.html)
if (processInput) processInput.value = draft.processName;

// Unlock task fields so the user can add more tasks
if (taskInput)   { taskInput.removeAttribute('readonly');   taskInput.value   = ''; }
if (cyclesInput) { cyclesInput.removeAttribute('readonly'); cyclesInput.value = ''; }

// Enable "Agregar Tarea" button
if (addTaskBtn) {
  addTaskBtn.removeAttribute('disabled');
  addTaskBtn.classList.remove('disabled');
  addTaskBtn.classList.add('enabled');
}

// Restore position radio selection
const positionRadio = document.querySelector(`input[name="posicion-filled"][value="${draft.position}"]`);
if (positionRadio) {
  document.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
  positionRadio.checked = true;
  positionRadio.closest('.radio-option')?.classList.add('selected');
}

// ---------- Render task list ----------
function _renderTaskList() {
  const taskList = document.querySelector('.task-list');
  if (!taskList) return;

  const heading = taskList.querySelector('.block-title');
  if (heading) heading.textContent = `Tareas del proceso (${_tasks.length})`;

  taskList.querySelectorAll('.task-item').forEach(el => el.remove());

  const emptyMsg = taskList.querySelector('.task-list-empty');
  if (emptyMsg) emptyMsg.style.display = _tasks.length ? 'none' : '';

  _tasks.forEach((t, i) => {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.innerHTML = `
      <div class="task-main">
        <div class="task-copy">
          <div class="task-line-1">
            <span class="task-index">#${i + 1}</span>
            <span class="task-name">${t.name}</span>
          </div>
          <p class="task-time">${t.cycles} ciclo(s)</p>
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" type="button" title="Eliminar" data-idx="${i}">✕</button>
      </div>`;
    item.querySelector('[data-idx]').addEventListener('click', e => {
      _tasks.splice(Number(e.currentTarget.dataset.idx), 1);
      _renderTaskList();
    });
    taskList.appendChild(item);
  });
}

_renderTaskList();

// ---------- Add task ----------
if (addTaskBtn) {
  addTaskBtn.addEventListener('click', () => {
    const name   = taskInput?.value.trim();
    const cycles = Number(cyclesInput?.value);
    if (!name || !Number.isFinite(cycles) || cycles <= 0) return;
    _tasks.push({ name, cycles });
    if (taskInput)   taskInput.value   = '';
    if (cyclesInput) cyclesInput.value = '';
    taskInput?.focus();
    _renderTaskList();
  });
}

// ---------- Cancel ----------
document.querySelector('.btn-ghost')?.addEventListener('click', () => {
  sessionStorage.removeItem('process_draft');
  window.location.href = 'planeamiento.html';
});

// ---------- Save process with all tasks ----------
document.querySelector('.btn-solid')?.addEventListener('click', async () => {
  if (_tasks.length === 0) {
    window.alert('Agrega al menos una tarea antes de guardar.');
    return;
  }
  const payload = {
    name:     draft.processName,
    position: draft.position || 'cola',
    tasks:    _tasks,
  };
  try {
    const res = await fetch('/api/processes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    sessionStorage.removeItem('process_draft');
    window.location.href = 'linea-configurada.html';
  } catch (err) {
    window.alert(`Error al guardar proceso: ${err.message}`);
  }
});

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
