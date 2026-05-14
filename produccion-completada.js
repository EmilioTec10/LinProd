// ---------- SVG icons ----------
function _svgUri(s) { return 'data:image/svg+xml,' + encodeURIComponent(s); }

const _SVG = {
  FACTORY:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  CLOCK:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  HOURGLASS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14"/><path d="M5 22h14"/><path d="M17 2v4l-5 4 5 4v4"/><path d="M7 2v4l5 4-5 4v4"/></svg>`,
  BOX:       `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  BARCHART:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  RESTART:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  DOWNLOAD:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  CHECK:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
};

function _injectIcons() {
  document.querySelectorAll('.live-logo').forEach(img => { img.src = _svgUri(_SVG.FACTORY); });

  document.querySelectorAll('.stat-card').forEach(card => {
    const label = card.querySelector('.stat-label')?.textContent?.trim() || '';
    const icon  = card.querySelector('.stat-icon');
    if (!icon) return;
    if      (label === 'Tiempo Transcurrido') icon.src = _svgUri(_SVG.CLOCK);
    else if (label === 'Tiempo Restante')     icon.src = _svgUri(_SVG.HOURGLASS);
    else if (label === 'Productos')           icon.src = _svgUri(_SVG.BOX);
    else if (label === 'Progreso')            icon.src = _svgUri(_SVG.BARCHART);
  });

  document.querySelectorAll('.icon-control.warn img')
    .forEach(img => { img.src = _svgUri(_SVG.RESTART); });

  const dlImg = document.querySelector('.download-btn img');
  if (dlImg) dlImg.src = _svgUri(_SVG.DOWNLOAD);

  const completedIcon = document.querySelector('.completed-icon');
  if (completedIcon) completedIcon.src = _svgUri(_SVG.CHECK);
}
_injectIcons();

// ---------- Entry animation ----------
const completedAnimated = document.querySelectorAll(
  '.live-header, .live-stats, .live-current, .completed-summary, .stat-card, .completed-banner'
);
requestAnimationFrame(() => {
  completedAnimated.forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 55}ms`);
    el.classList.add('reveal');
  });
});

function fmt(cycles) {
  if (cycles == null || isNaN(cycles)) return '—';
  const m = Math.floor(cycles / 60);
  const s = cycles % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------- Download report ----------
function _downloadReport(report, state, isPartial) {
  const cfg      = report.config      || {};
  const perf     = report.performance || {};
  const metrics  = report.metrics     || {};
  const products = report.products    || [];
  const now      = new Date().toLocaleString('es-MX');

  const partialBanner = isPartial
    ? `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin-bottom:24px;color:#856404;">
         &#9888; Reporte parcial — producción pausada en ciclo ${state.current_cycle}
       </div>`
    : '';

  const metRows = Object.keys(metrics).length > 0 ? `
    <tr><td>Primer producto</td><td>${fmt(metrics.first_completion_cycle)}</td></tr>
    <tr><td>Último producto</td><td>${fmt(metrics.last_completion_cycle)}</td></tr>
    <tr><td>Tiempo promedio</td><td>${fmt(Math.round(metrics.avg_duration_cycles))}</td></tr>
    <tr><td>Tiempo total</td><td>${fmt(metrics.total_cycles)}</td></tr>
    <tr><td>Tiempo promedio de espera</td><td>${fmt(Math.round(metrics.avg_wait_time ?? 0))}</td></tr>
    <tr><td>Mayor congestionamiento</td><td>${metrics.bottleneck_process} → ${metrics.bottleneck_task} (${fmt(metrics.bottleneck_wait_cycles)})</td></tr>
    <tr><td>Tarea más larga</td><td>${metrics.longest_task_name} — ${metrics.longest_task_process} (${fmt(metrics.longest_task_cycles)})</td></tr>
  ` : '<tr><td colspan="2">Sin métricas disponibles</td></tr>';

  const taskStatRows = (metrics.per_task_stats ?? []).map(ts => `
    <tr>
      <td>${ts.process_name}</td>
      <td>${ts.task_name}</td>
      <td>${ts.process_time}</td>
      <td>${ts.products_processed}</td>
      <td>${ts.utilization_pct}%</td>
      <td>${fmt(Math.round(ts.avg_wait_cycles))}</td>
    </tr>`).join('');

  const prodRows = products.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.status || '—'}</td>
      <td>${fmt(p.entry_cycle)}</td>
      <td>${p.exit_cycle != null ? fmt(p.exit_cycle) : '—'}</td>
      <td>${p.duration != null ? fmt(p.duration) : '—'}</td>
      <td>${p.total_wait_time != null ? fmt(p.total_wait_time) : '—'}</td>
    </tr>`).join('');

  const procRows = state.state.processes.map(proc => {
    const taskNames = proc.tasks.map(t => t.name).join(', ');
    const processed = proc.tasks[0]?.products_processed ?? '—';
    const totalWait = proc.tasks.reduce((s, t) => s + (t.total_wait_accumulated || 0), 0);
    return `<tr>
      <td>${proc.index + 1}</td>
      <td>${proc.name}</td>
      <td>${taskNames}</td>
      <td>${processed}</td>
      <td>${fmt(totalWait)}</td>
    </tr>`;
  }).join('');

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Reporte de Producción — ${now}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;padding:32px;color:#1d3557;background:#f8f9fa;}
  h1{font-size:1.6rem;margin-bottom:4px;}
  .subtitle{color:#6c757d;margin-bottom:24px;}
  h2{font-size:1.1rem;margin:24px 0 8px;border-bottom:2px solid #1d3557;padding-bottom:4px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px;}
  .card{background:#fff;border-radius:10px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.08);}
  .card p{margin:0;font-size:11px;color:#6c757d;text-transform:uppercase;}
  .card strong{font-size:1.4rem;display:block;margin-top:4px;}
  table{width:100%;border-collapse:collapse;margin-bottom:24px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);}
  th{background:#1d3557;color:#fff;padding:10px 14px;text-align:left;font-size:12px;}
  td{padding:9px 14px;border-bottom:1px solid #e9ecef;font-size:13px;}
  tr:last-child td{border-bottom:none;}
  tr:nth-child(even) td{background:#f8f9fa;}
</style>
</head>
<body>
<h1>Reporte de Producción</h1>
<p class="subtitle">Generado el ${now}${isPartial ? ' · Producción pausada' : ' · Producción completada'}</p>
${partialBanner}
<h2>Configuración</h2>
<div class="grid">
  <div class="card"><p>Procesos</p><strong>${cfg.process_count ?? '—'}</strong></div>
  <div class="card"><p>Tareas</p><strong>${cfg.task_count ?? '—'}</strong></div>
  <div class="card"><p>Tiempo / producto</p><strong>${fmt(cfg.total_cycles_per_product)}</strong></div>
  <div class="card"><p>Productos</p><strong>${report.num_products ?? '—'}</strong></div>
</div>
<h2>Rendimiento</h2>
<div class="grid">
  <div class="card"><p>Productos / hora</p><strong>${perf.products_per_hour ?? '—'}</strong></div>
  <div class="card"><p>Eficiencia</p><strong>100%</strong></div>
</div>
<h2>Métricas</h2>
<table><thead><tr><th>Indicador</th><th>Valor</th></tr></thead><tbody>${metRows}</tbody></table>
<h2>Productos</h2>
<table><thead><tr><th>ID</th><th>Estado</th><th>Entrada</th><th>Salida</th><th>Duración</th><th>Espera</th></tr></thead><tbody>${prodRows || '<tr><td colspan="6">Sin datos</td></tr>'}</tbody></table>
<h2>Por Proceso</h2>
<table><thead><tr><th>#</th><th>Proceso</th><th>Tareas</th><th>Procesados</th><th>Espera acum.</th></tr></thead><tbody>${procRows || '<tr><td colspan="5">Sin datos</td></tr>'}</tbody></table>
<h2>Por Tarea (Utilización)</h2>
<table><thead><tr><th>Proceso</th><th>Tarea</th><th>Ciclos/prod</th><th>Procesados</th><th>Utilización</th><th>Espera prom.</th></tr></thead><tbody>${taskStatRows || '<tr><td colspan="6">Sin datos</td></tr>'}</tbody></table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `reporte-produccion-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

let _cachedReport = null;
let _cachedState  = null;

(async () => {
  try {
    const [reportRes, stateRes] = await Promise.all([
      fetch('/api/simulation/report'),
      fetch('/api/simulation/state')
    ]);
    const report = await reportRes.json();
    const state  = await stateRes.json();

    _cachedReport = report;
    _cachedState  = state;

    const cfg     = report.config;
    const perf    = report.performance;
    const metrics = report.metrics;

    // Stat cards
    document.getElementById('stat-elapsed').textContent   = fmt(metrics.total_cycles != null ? metrics.total_cycles : state.current_cycle);
    document.getElementById('stat-remaining').textContent = '0:00';
    document.getElementById('stat-products').textContent  = `${report.num_products} / ${report.num_products}`;
    document.getElementById('stat-progress').textContent  = '100%';

    // Completion subtitle
    const subtitleEl = document.getElementById('completed-subtitle');
    if (subtitleEl) {
      const n = report.num_products;
      subtitleEl.textContent = `${n} producto${n !== 1 ? 's' : ''} finalizado${n !== 1 ? 's' : ''}`;
    }

    // Last process / task row
    if (state.state.processes.length > 0) {
      const lastProc = state.state.processes[state.state.processes.length - 1];
      const lastTask = lastProc.tasks.length > 0 ? lastProc.tasks[lastProc.tasks.length - 1] : null;
      const procIdx  = document.getElementById('completed-proc-index');
      const procName = document.getElementById('completed-proc-name');
      const taskName = document.getElementById('completed-task-name');
      const taskDur  = document.getElementById('completed-task-dur');
      if (procIdx)  procIdx.textContent  = lastProc.index + 1;
      if (procName) procName.textContent = lastProc.name;
      if (taskName && lastTask) taskName.textContent = lastTask.name;
      if (taskDur  && lastTask) taskDur.textContent  = `· ${Math.round(lastTask.cycles / 60)} min`;
    }

    // Summary sidebar — config + performance
    document.getElementById('cfg-processes').textContent = cfg.process_count;
    document.getElementById('cfg-tasks').textContent     = cfg.task_count;
    document.getElementById('cfg-time-per').textContent  = fmt(cfg.total_cycles_per_product);
    document.getElementById('perf-pph').textContent      = perf.products_per_hour;

    // Metrics
    if (metrics && Object.keys(metrics).length > 0) {
      document.getElementById('met-first').textContent = fmt(metrics.first_completion_cycle);
      document.getElementById('met-last').textContent  = fmt(metrics.last_completion_cycle);
      document.getElementById('met-avg').textContent   = fmt(Math.round(metrics.avg_duration_cycles));
      document.getElementById('met-total').textContent = fmt(metrics.total_cycles);

      document.getElementById('met-bottleneck-name').textContent =
        `${metrics.bottleneck_process} → ${metrics.bottleneck_task}`;
      document.getElementById('met-bottleneck-time').textContent =
        fmt(metrics.bottleneck_wait_cycles);

      document.getElementById('met-longest-task').textContent = metrics.longest_task_name;
      document.getElementById('met-longest-task-sub').textContent =
        `${metrics.longest_task_process} • ${fmt(metrics.longest_task_cycles)}`;
    }

    // PROGRESO section
    const summaryProc = document.getElementById('summary-process-name');
    if (summaryProc && state.state.processes.length > 0) {
      summaryProc.textContent = state.state.processes[0].name;
    }
    document.getElementById('summary-pct').textContent  = '100%';
    document.getElementById('summary-fill').style.width = '100%';

  } catch (err) {
    console.error('Error cargando reporte:', err);
  }
})();

// ---------- Controls ----------
document.querySelector('.back-config-btn')?.addEventListener('click', () => {
  window.location.href = 'linea-configurada.html';
});

document.querySelector('.download-btn')?.addEventListener('click', async () => {
  try {
    const report = _cachedReport || await fetch('/api/simulation/report').then(r => r.json());
    const state  = _cachedState  || await fetch('/api/simulation/state').then(r => r.json());
    _downloadReport(report, state, false);
  } catch (err) { console.error('Error al descargar:', err); }
});

const restartModal   = document.getElementById('restart-modal');
const restartCancel  = document.getElementById('restart-cancel');
const restartConfirm = document.getElementById('restart-confirm');

document.querySelector('.icon-control.warn')?.addEventListener('click', () => {
  restartModal?.removeAttribute('hidden');
});

restartCancel?.addEventListener('click', () => {
  restartModal.setAttribute('hidden', '');
});

restartConfirm?.addEventListener('click', async () => {
  restartModal.setAttribute('hidden', '');
  try {
    await fetch('/api/simulation/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  } catch (_) {}
  window.location.href = 'produccion-marcha.html';
});

restartModal?.addEventListener('click', (e) => {
  if (e.target === restartModal) restartCancel?.click();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && restartModal && !restartModal.hasAttribute('hidden')) {
    restartCancel?.click();
  }
});
