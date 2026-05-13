const configuredAnimated = document.querySelectorAll(
  '.configured-top, .configured-processes, .panel-right, .start-btn, .process-card'
);

requestAnimationFrame(() => {
  configuredAnimated.forEach((element, index) => {
    element.style.setProperty('--delay', `${index * 70}ms`);
    element.classList.add('reveal');
  });
});

// Keep quantity input in sync with any previously saved simulation config.
try {
  const existing = JSON.parse(sessionStorage.getItem('sim_config') || 'null');
  const cantidadInput = document.getElementById('cantidad');
  if (cantidadInput && existing && Number(existing.totalProducts) > 0) {
    cantidadInput.value = Number(existing.totalProducts);
  }
} catch (_) {
  // Ignore malformed session values.
}

const startButton = document.querySelector('.start-btn');
if (startButton) {
  startButton.addEventListener('click', () => {
    // Persist simulation configuration so produccion-marcha.js can read it
    const cantidadInput = document.getElementById('cantidad');
    const totalProducts = cantidadInput ? (parseInt(cantidadInput.value, 10) || 5) : 5;

    let storedConfig = null;
    try {
      storedConfig = JSON.parse(sessionStorage.getItem('sim_config') || 'null');
    } catch (_) {
      storedConfig = null;
    }

    // Collect processes from the DOM
    const processes = [];
    document.querySelectorAll('.process-card').forEach((card) => {
      const procName = card.querySelector('.process-copy h3')?.textContent.trim() || '?';
      const tasks = [];
      card.querySelectorAll('.process-task-row').forEach((row) => {
        const taskName = row.querySelector('.task-name-main')?.textContent.trim() || '?';
        const durText  = row.querySelector('.task-duration')?.textContent.trim() || '2 min';
        const durationMin = parseFloat(durText) || 2;
        tasks.push({ name: taskName, durationMin });
      });
      processes.push({ name: procName, tasks });
    });

    // Fallback to defaults if DOM scraping finds nothing
    const config = {
      processes:
        (storedConfig && Array.isArray(storedConfig.processes) && storedConfig.processes.length)
          ? storedConfig.processes
          : (processes.length ? processes : [{ name: 's', tasks: [{ name: 'q', durationMin: 2 }] }]),
      totalProducts,
      speedMultiplier: (storedConfig && Number(storedConfig.speedMultiplier)) || 10
    };
    sessionStorage.setItem('sim_config', JSON.stringify(config));
    sessionStorage.removeItem('sim_state');

    window.location.href = 'produccion-marcha.html';
  });
}

const addProcessButton = document.querySelector('.configured-processes .add-process-btn');
if (addProcessButton) {
  addProcessButton.addEventListener('click', () => {
    window.location.href = 'proceso.html';
  });
}
