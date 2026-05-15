// ---------- SVG icons ----------
function _svgUri(s) { return 'data:image/svg+xml,' + encodeURIComponent(s); }

const _SVG = {
  FACTORY: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  PLAY:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  PLUS:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  LIST:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#698996" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  ARROWS:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="6 8 12 2 18 8"/><polyline points="6 16 12 22 18 16"/></svg>`,
  PENCIL:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
};

function _injectIcons() {
  const topLogo = document.querySelector('.top-logo');
  if (topLogo) topLogo.src = _svgUri(_SVG.FACTORY);
  const startIcon = document.querySelector('.start-btn .add-process-icon');
  if (startIcon) startIcon.src = _svgUri(_SVG.PLAY);
  const addIcon = document.querySelector('.add-process-btn .add-process-icon');
  if (addIcon) addIcon.src = _svgUri(_SVG.PLUS);
  const emptyIcon = document.querySelector('.empty-state-icon');
  if (emptyIcon) emptyIcon.src = _svgUri(_SVG.LIST);
}

// ---------- Entry animation ----------
const configuredAnimated = document.querySelectorAll(
  '.configured-top, .configured-processes, .panel-right, .start-btn, .process-card'
);
requestAnimationFrame(() => {
  configuredAnimated.forEach((element, index) => {
    element.style.setProperty('--delay', `${index * 70}ms`);
    element.classList.add('reveal');
  });
});

// ---------- State ----------
let _allProcesses  = [];
let _editingProc   = null;  // position modal
let _editPanelProc = null;  // edit panel
let _editTasks     = [];    // working task copy while edit panel is open
let _dragSrcIndex  = -1;

// ---------- Backend rebuild helper ----------
// Deletes all processes (by DELETEing index 0 repeatedly) then re-POSTs in the given order.
async function _rebuildBackend(orderedProcs) {
  const count = _allProcesses.length;
  for (let i = 0; i < count; i++) {
    await fetch('/api/processes/0', { method: 'DELETE' });
  }
  for (let i = 0; i < orderedProcs.length; i++) {
    const p = orderedProcs[i];
    await fetch('/api/processes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:     p.name,
        position: i === 0 ? 'primero' : 'cola',
        tasks:    p.tasks.map(t => ({ name: t.name, cycles: t.cycles })),
      }),
    });
  }
}

// ---------- Edit panel — task list helpers ----------

// Syncs the current DOM input values back into _editTasks before a re-render.
// Must be called before splicing _editTasks so user edits aren't lost on re-render.
function _syncEditTasksFromDom() {
  document.querySelectorAll('#edit-task-list [data-task-name-idx]').forEach(ni => {
    const idx = parseInt(ni.dataset.taskNameIdx, 10);
    const ci  = document.querySelector(`#edit-task-list [data-task-cycles-idx="${idx}"]`);
    if (_editTasks[idx] !== undefined) {
      _editTasks[idx].name   = ni.value;
      _editTasks[idx].cycles = parseInt(ci?.value, 10) || _editTasks[idx].cycles;
    }
  });
}

function _renderEditTaskList() {
  const container = document.getElementById('edit-task-list');
  if (!container) return;
  container.innerHTML = '';

  const heading = document.getElementById('edit-task-heading');
  if (heading) heading.textContent = `Tareas (${_editTasks.length})`;

  if (_editTasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'task-list-empty';
    empty.textContent = 'No hay tareas en este proceso';
    container.appendChild(empty);
    return;
  }

  _editTasks.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'task-item';
    row.innerHTML = `
      <span class="task-index" style="flex-shrink:0;min-width:24px;">#${i + 1}</span>
      <input class="text-input" type="text" data-task-name-idx="${i}"
             style="flex:1;height:36px;padding:4px 10px;font-size:14px;min-width:0;" />
      <input class="text-input" type="number" data-task-cycles-idx="${i}" min="1"
             style="width:68px;height:36px;padding:4px 8px;text-align:center;font-size:14px;" />
      <span style="color:var(--text);font-size:12px;white-space:nowrap;flex-shrink:0;">ciclos</span>
      <button class="icon-btn" type="button" title="Eliminar tarea" data-del-task="${i}"
              style="flex-shrink:0;">✕</button>`;
    // Set input values via DOM property to safely handle any characters in task names.
    row.querySelector(`[data-task-name-idx="${i}"]`).value   = t.name;
    row.querySelector(`[data-task-cycles-idx="${i}"]`).value = t.cycles;
    row.querySelector('[data-del-task]').addEventListener('click', e => {
      _syncEditTasksFromDom();
      _editTasks.splice(Number(e.currentTarget.dataset.delTask), 1);
      _renderEditTaskList();
    });
    container.appendChild(row);
  });
}

// ---------- Card builder ----------
function _buildProcessCard(proc, idx) {
  const card = document.createElement('div');
  card.className = 'process-card';
  card.setAttribute('draggable', 'true');
  card.dataset.cardIdx = idx;

  const tasksHtml = proc.tasks.map((t, ti) => `
    <div class="process-task-row">
      <div class="process-task-left">
        <span class="task-order">${ti + 1}.</span>
        <span class="task-name-main">${t.name}</span>
      </div>
      <span class="task-duration">${t.cycles} ciclos</span>
    </div>`).join('');

  card.innerHTML = `
    <div class="process-card-head">
      <div class="process-card-info">
        <span class="process-index">${idx + 1}</span>
        <div class="process-copy">
          <h3>${proc.name}</h3>
          <p>${proc.tasks.length} tarea${proc.tasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div class="process-actions">
        <button class="icon-btn light" type="button" title="Editar" data-edit-index="${proc.index}">
          <img class="edit-pencil-icon" src="" alt="" aria-hidden="true" style="width:16px;height:16px;">
        </button>
        <button class="icon-btn light" type="button" title="Editar posición" data-edit-pos-index="${proc.index}">
          <img class="edit-pos-icon" src="" alt="" aria-hidden="true" style="width:16px;height:16px;">
        </button>
        <button class="icon-btn light" type="button" title="Eliminar" data-proc-index="${proc.index}">✕</button>
      </div>
    </div>
    <div class="process-tasks">${tasksHtml}</div>`;

  card.querySelector('.edit-pencil-icon').src = _svgUri(_SVG.PENCIL);
  card.querySelector('.edit-pos-icon').src    = _svgUri(_SVG.ARROWS);

  card.querySelector('[data-edit-index]').addEventListener('click', () => {
    _openEditPanel(proc);
  });

  card.querySelector('[data-edit-pos-index]').addEventListener('click', () => {
    _openPositionModal(proc);
  });

  card.querySelector('[data-proc-index]').addEventListener('click', async (e) => {
    const procIdx = Number(e.currentTarget.dataset.procIndex);
    await fetch(`/api/processes/${procIdx}`, { method: 'DELETE' });
    loadProcesses();
  });

  // ---------- Drag-to-reorder ----------
  card.addEventListener('dragstart', e => {
    _dragSrcIndex = idx;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { card.style.opacity = '0.5'; }, 0);
  });

  card.addEventListener('dragend', () => {
    _dragSrcIndex = -1;
    card.style.opacity = '';
    document.querySelectorAll('.process-card').forEach(c => { c.style.borderColor = ''; });
  });

  card.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (_dragSrcIndex !== idx) {
      card.style.borderColor = '#1d3557';
    }
  });

  card.addEventListener('dragleave', e => {
    if (!card.contains(e.relatedTarget)) {
      card.style.borderColor = '';
    }
  });

  card.addEventListener('drop', async e => {
    e.preventDefault();
    card.style.borderColor = '';
    const src = _dragSrcIndex;
    _dragSrcIndex = -1;
    if (src === idx || src < 0) return;

    const reordered = [..._allProcesses];
    const [moved] = reordered.splice(src, 1);
    reordered.splice(idx, 0, moved);

    try {
      await _rebuildBackend(reordered);
    } catch (err) {
      console.error('Error al reordenar por arrastre:', err);
    }
    loadProcesses();
  });

  return card;
}

// ---------- Load processes ----------
async function loadProcesses() {
  // If the edit panel is open when the list refreshes (e.g. after a delete or reorder),
  // close it so the stale proc reference and index don't cause a mis-targeted PUT.
  if (_editPanelProc !== null) _closeEditPanel();

  try {
    const res  = await fetch('/api/processes');
    const data = await res.json();
    _allProcesses = data.processes;
    const container = document.querySelector('.configured-processes');
    container.querySelectorAll('.process-card').forEach(el => el.remove());
    data.processes.forEach((proc, i) => container.appendChild(_buildProcessCard(proc, i)));
    const meta = document.querySelector('.top-meta');
    if (meta) {
      const n = data.process_count;
      meta.textContent = `${n} proceso${n !== 1 ? 's' : ''} configurado${n !== 1 ? 's' : ''} • ${data.total_cycles} ciclos totales`;
    }
  } catch (err) {
    console.error('Error al cargar procesos:', err);
  }
}

loadProcesses();

// ---------- Start simulation ----------
const startButton = document.querySelector('.start-btn');
if (startButton) {
  startButton.addEventListener('click', async () => {
    const cantidadInput = document.getElementById('cantidad');
    const num_products  = cantidadInput ? (parseInt(cantidadInput.value, 10) || 5) : 5;
    try {
      const res = await fetch('/api/simulation/start', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ num_products }),
      });
      if (res.status === 409) {
        window.alert('Configura al menos un proceso antes de iniciar.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sessionStorage.setItem('sim_speed', '1');
      window.location.href = 'produccion-marcha.html';
    } catch (err) {
      window.alert(`Error al iniciar simulación: ${err.message}`);
    }
  });
}

// ---------- Add process ----------
const addProcessButton = document.querySelector('.configured-processes .add-process-btn');
if (addProcessButton) {
  addProcessButton.addEventListener('click', () => {
    window.location.href = 'proceso.html';
  });
}

// ---------- Position modal ----------
function _injectPositionModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'pos-modal';
  modal.setAttribute('hidden', '');
  modal.innerHTML = `
    <div class="modal-card" style="max-width:400px;">
      <h3 class="modal-title" style="font-size:20px;line-height:28px;">Editar posición</h3>
      <p style="font-size:14px;color:var(--text);margin:0 0 16px;">
        Proceso: <strong id="pos-proc-name">—</strong>
      </p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <label class="radio-option" id="pos-opt-primero">
          <input type="radio" name="pos-option" value="primero">
          <div class="radio-dot"></div>
          <div class="radio-copy">
            <strong>Primero</strong>
            <small>Inicio de la línea de producción</small>
          </div>
        </label>
        <label class="radio-option" id="pos-opt-ultimo">
          <input type="radio" name="pos-option" value="ultimo">
          <div class="radio-dot"></div>
          <div class="radio-copy">
            <strong>Último</strong>
            <small>Final de la línea de producción</small>
          </div>
        </label>
        <label class="radio-option" id="pos-opt-cola">
          <input type="radio" name="pos-option" value="cola">
          <div class="radio-dot"></div>
          <div class="radio-copy">
            <strong>Añadir a la cola</strong>
            <small>Penúltima posición (antes del Último)</small>
          </div>
        </label>
      </div>
      <div class="modal-actions">
        <button class="modal-btn modal-cancel" id="pos-cancel" type="button">Cancelar</button>
        <button class="modal-btn" id="pos-confirm" type="button"
                style="background:var(--button);color:#fff;flex:1;height:52px;border-radius:16px;
                       font-family:Nunito,sans-serif;font-size:16px;font-weight:500;
                       cursor:pointer;border:none;transition:opacity 0.15s;">Confirmar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelectorAll('.radio-option').forEach(opt => {
    opt.addEventListener('click', () => {
      modal.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
    });
  });

  document.getElementById('pos-cancel').addEventListener('click', _closePositionModal);
  modal.addEventListener('click', e => { if (e.target === modal) _closePositionModal(); });

  document.getElementById('pos-confirm').addEventListener('click', async () => {
    const selected = modal.querySelector('input[name="pos-option"]:checked');
    if (!selected) return;
    const newPos = selected.value;

    const srcIdx  = _allProcesses.findIndex(p => p.index === _editingProc.index);
    const proc    = _allProcesses[srcIdx];
    const rest    = _allProcesses.filter((_, i) => i !== srcIdx);
    let reordered;

    if (newPos === 'primero') {
      reordered = [proc, ...rest];
    } else if (newPos === 'ultimo') {
      reordered = [...rest, proc];
    } else {
      const insertAt = rest.length <= 1 ? rest.length : rest.length - 1;
      reordered = [...rest];
      reordered.splice(insertAt, 0, proc);
    }

    const confirmBtn = document.getElementById('pos-confirm');
    confirmBtn.disabled    = true;
    confirmBtn.textContent = 'Guardando…';

    try {
      await _rebuildBackend(reordered);
    } catch (err) {
      console.error('Error al reordenar procesos:', err);
    }

    confirmBtn.disabled    = false;
    confirmBtn.textContent = 'Confirmar';
    _closePositionModal();
    loadProcesses();
  });
}

function _openPositionModal(proc) {
  _editingProc = proc;
  document.getElementById('pos-proc-name').textContent = proc.name;

  const total    = _allProcesses.length;
  let currentPos = 'cola';
  if (proc.index === 0)              currentPos = 'primero';
  else if (proc.index === total - 1) currentPos = 'ultimo';

  const modal = document.getElementById('pos-modal');
  modal.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));

  const matchingInput = modal.querySelector(`input[value="${currentPos}"]`);
  if (matchingInput) {
    matchingInput.checked = true;
    matchingInput.closest('.radio-option').classList.add('selected');
  }

  modal.removeAttribute('hidden');
}

function _closePositionModal() {
  document.getElementById('pos-modal').setAttribute('hidden', '');
  _editingProc = null;
}

// ---------- Edit panel ----------
function _injectEditPanel() {
  const rightPanel = document.querySelector('.panel-right');
  if (!rightPanel) return;

  const panel = document.createElement('div');
  panel.id = 'edit-panel';
  panel.style.cssText = 'display:none;width:100%;';
  panel.innerHTML = `
    <div class="process-form-head" style="margin-bottom:16px;">
      <h2 class="panel-title">Editar Proceso</h2>
      <p class="top-meta">Modifica el nombre y las tareas</p>
    </div>
    <div class="form-block" style="margin-bottom:16px;">
      <h3 class="block-title">Nombre del proceso</h3>
      <div class="field">
        <label class="field-label" for="edit-proc-name">Nombre</label>
        <input id="edit-proc-name" class="text-input" type="text"
               placeholder="Nombre del proceso" style="width:100%;" />
      </div>
    </div>
    <div class="form-block" style="margin-bottom:16px;">
      <h3 class="block-title" id="edit-task-heading">Tareas (0)</h3>
      <div id="edit-task-list" style="display:flex;flex-direction:column;gap:8px;"></div>
    </div>
    <div class="form-block" style="margin-bottom:16px;">
      <h3 class="block-title">Agregar Tarea</h3>
      <div class="field">
        <label class="field-label" for="edit-new-task-name">Nombre de la tarea</label>
        <input id="edit-new-task-name" class="text-input" type="text"
               placeholder="Ej: Corte de material" style="width:100%;" />
      </div>
      <div class="field" style="margin-top:8px;">
        <label class="field-label" for="edit-new-task-cycles">Ciclos</label>
        <input id="edit-new-task-cycles" class="text-input" type="number"
               min="1" placeholder="0" style="width:100%;" />
      </div>
      <button id="edit-add-task-btn" class="add-task-btn enabled" type="button"
              style="width:100%;margin-top:8px;">Agregar Tarea</button>
    </div>
    <div class="actions">
      <button id="edit-cancel-btn" class="btn-ghost" type="button">Cancelar</button>
      <button id="edit-save-btn" class="btn-solid" type="button">Guardar Cambios</button>
    </div>`;
  rightPanel.appendChild(panel);

  // Add task
  document.getElementById('edit-add-task-btn').addEventListener('click', () => {
    const name   = document.getElementById('edit-new-task-name').value.trim();
    const cycles = parseInt(document.getElementById('edit-new-task-cycles').value, 10);
    if (!name || !cycles || cycles <= 0) return;
    _editTasks.push({ name, cycles });
    document.getElementById('edit-new-task-name').value   = '';
    document.getElementById('edit-new-task-cycles').value = '';
    document.getElementById('edit-new-task-name').focus();
    _renderEditTaskList();
  });

  // Cancel
  document.getElementById('edit-cancel-btn').addEventListener('click', _closeEditPanel);

  // Save — reads live DOM input values so in-progress keystrokes are captured
  document.getElementById('edit-save-btn').addEventListener('click', async () => {
    const procName = document.getElementById('edit-proc-name').value.trim();
    if (!procName) {
      document.getElementById('edit-proc-name').focus();
      return;
    }

    const tasks = [];
    document.querySelectorAll('#edit-task-list [data-task-name-idx]').forEach(ni => {
      const idx = ni.dataset.taskNameIdx;
      const ci  = document.querySelector(`#edit-task-list [data-task-cycles-idx="${idx}"]`);
      const n   = ni.value.trim();
      const c   = parseInt(ci?.value, 10);
      if (n && c > 0) tasks.push({ name: n, cycles: c });
    });

    if (tasks.length === 0) {
      window.alert('El proceso debe tener al menos una tarea.');
      return;
    }

    const saveBtn = document.getElementById('edit-save-btn');
    saveBtn.disabled    = true;
    saveBtn.textContent = 'Guardando…';

    const prevErr = document.getElementById('edit-save-error');
    if (prevErr) prevErr.remove();

    try {
      const res = await fetch(`/api/processes/${_editPanelProc.index}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: procName, tasks }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _closeEditPanel();
      loadProcesses();
    } catch (err) {
      const errMsg = document.createElement('p');
      errMsg.id = 'edit-save-error';
      errMsg.style.cssText = 'color:#dc2626;font-size:12px;margin:4px 0 0;';
      errMsg.textContent = `Error al guardar: ${err.message}`;
      saveBtn.insertAdjacentElement('afterend', errMsg);
    } finally {
      saveBtn.disabled    = false;
      saveBtn.textContent = 'Guardar Cambios';
    }
  });
}

function _openEditPanel(proc) {
  _editPanelProc = proc;
  _editTasks     = proc.tasks.map(t => ({ name: t.name, cycles: t.cycles }));

  document.getElementById('edit-proc-name').value = proc.name;
  _renderEditTaskList();

  // Swap empty-state for form content in the right panel
  const emptyState = document.querySelector('.panel-right .empty-state-right');
  if (emptyState) emptyState.style.display = 'none';
  const rightPanel = document.querySelector('.panel-right');
  if (rightPanel) rightPanel.style.alignItems = 'flex-start';

  document.getElementById('edit-panel').style.display = '';
}

function _closeEditPanel() {
  const panel = document.getElementById('edit-panel');
  if (panel) panel.style.display = 'none';

  const emptyState = document.querySelector('.panel-right .empty-state-right');
  if (emptyState) emptyState.style.display = '';
  const rightPanel = document.querySelector('.panel-right');
  if (rightPanel) rightPanel.style.alignItems = '';

  _editPanelProc = null;
  _editTasks     = [];
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  _injectIcons();
  _injectPositionModal();
  _injectEditPanel();
});
