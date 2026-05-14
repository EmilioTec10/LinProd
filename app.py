"""
app.py — Flask frontend for the LinProd production-line simulator.
Run with: python3 app.py
"""

from linprod_core import ProductionLine, Process, Task
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

line = ProductionLine()
_process_config: list = []


def _rebuild_line() -> None:
    global line
    line = ProductionLine()
    for cfg in _process_config:
        p = Process(cfg['name'])
        for t in cfg['tasks']:
            p.add_task(Task(t['name'], t['cycles']))
        line.add_process(p)
    line.link_processes()


def _serial_task(task: Task, idx: int) -> dict:
    return {
        'index': idx,
        'name': task.name,
        'cycles': task.process_time,
        'is_busy': task.is_busy,
        'current_product_id': task.current_product.id if task.current_product else None,
        'cycles_remaining': task.cycles_remaining,
        'queue_length': len(task.queue),
        'queue_ids': [p.id for p in task.queue],
        'products_processed': task.products_processed,
        'total_wait_accumulated': task.total_wait_time_accumulated,
    }


def _serial_process(process: Process, idx: int) -> dict:
    return {
        'index': idx,
        'name': process.name,
        'is_initial': process.is_initial,
        'is_final': process.is_final,
        'tasks': [_serial_task(t, ti) for ti, t in enumerate(process.tasks)],
    }


def _serial_state() -> dict:
    return {
        'current_cycle': line.current_cycle,
        'is_running': line.is_running,
        'is_paused': line.is_paused,
        'is_complete': line.is_complete(),
        'completed_count': len(line.completed_products),
        'num_products': line.num_products,
        'products_injected': line._products_injected,
        'state': {
            'processes': [_serial_process(p, pi) for pi, p in enumerate(line.processes)],
        },
    }


def _serial_report() -> dict:
    completed = line.completed_products
    total_cycles_per_product = sum(
        t.process_time for proc in line.processes for t in proc.tasks
    )
    task_count    = sum(1 for proc in line.processes for _ in proc.tasks)
    process_count = sum(1 for _ in line.processes)
    pph = round(3600 / total_cycles_per_product, 1) if total_cycles_per_product > 0 else 0

    base = {
        'num_products': line.num_products,
        'config': {
            'process_count': process_count,
            'task_count': task_count,
            'total_cycles_per_product': total_cycles_per_product,
        },
        'performance': {
            'products_per_hour': pph,
            'efficiency_pct': 100,
        },
        'metrics': {},
        'products': [],
    }

    if not completed:
        return base

    exit_cycles = [p.exit_cycle for p in completed if p.exit_cycle is not None]
    durations   = [p.exit_cycle - p.entry_cycle for p in completed if p.exit_cycle is not None]
    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0

    bottleneck_task = None
    bottleneck_proc = '—'
    max_wait = -1
    for process in line.processes:
        for task in process.tasks:
            if task.total_wait_time_accumulated > max_wait:
                max_wait = task.total_wait_time_accumulated
                bottleneck_task = task
                bottleneck_proc = process.name

    longest_task = None
    longest_proc = '—'
    for process in line.processes:
        for task in process.tasks:
            if longest_task is None or task.process_time > longest_task.process_time:
                longest_task = task
                longest_proc = process.name

    wait_times = [p.total_wait_time for p in completed]
    avg_wait   = round(sum(wait_times) / len(wait_times), 1) if wait_times else 0

    per_task_stats = [
        {
            'process_name':      proc.name,
            'task_name':         task.name,
            'process_time':      task.process_time,
            'products_processed': task.products_processed,
            'utilization_pct':   round(
                (task.products_processed * task.process_time) / line.current_cycle * 100, 1
            ) if line.current_cycle > 0 else 0.0,
            'avg_wait_cycles':   round(
                task.total_wait_time_accumulated / task.products_processed, 2
            ) if task.products_processed > 0 else 0.0,
        }
        for proc in line.processes for task in proc.tasks
    ]

    base['metrics'] = {
        'first_completion_cycle': min(exit_cycles),
        'last_completion_cycle':  max(exit_cycles),
        'avg_duration_cycles':    avg_duration,
        'total_cycles':           line.current_cycle,
        'avg_wait_time':          avg_wait,
        'bottleneck_process':     bottleneck_proc,
        'bottleneck_task':        bottleneck_task.name if bottleneck_task else '—',
        'bottleneck_wait_cycles': max_wait,
        'longest_task_name':      longest_task.name if longest_task else '—',
        'longest_task_process':   longest_proc,
        'longest_task_cycles':    longest_task.process_time if longest_task else 0,
        'per_task_stats':         per_task_stats,
    }
    base['products'] = [
        {
            'id':              p.id,
            'status':          p.status,
            'entry_cycle':     p.entry_cycle,
            'exit_cycle':      p.exit_cycle,
            'duration':        (p.exit_cycle - p.entry_cycle) if p.exit_cycle else None,
            'total_wait_time': p.total_wait_time,
        }
        for p in completed
    ]
    return base


# ---------------------------------------------------------------------------
# Static file serving
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/<path:filename>')
def static_files(filename):
    return app.send_static_file(filename)


# ---------------------------------------------------------------------------
# Process API
# ---------------------------------------------------------------------------

@app.get('/api/processes')
def get_processes():
    procs = [
        {
            'index': pi,
            'name': cfg['name'],
            'tasks': [{'index': ti, 'name': t['name'], 'cycles': t['cycles']}
                      for ti, t in enumerate(cfg['tasks'])],
        }
        for pi, cfg in enumerate(_process_config)
    ]
    total_cycles = sum(t['cycles'] for cfg in _process_config for t in cfg['tasks'])
    return jsonify({'processes': procs, 'process_count': len(procs), 'total_cycles': total_cycles})


@app.post('/api/processes')
def add_process():
    body     = request.get_json(force=True) or {}
    name     = body.get('name', '?')
    position = body.get('position', 'cola')
    tasks    = body.get('tasks', [])
    cfg = {
        'name': name,
        'tasks': [{'name': t['name'], 'cycles': int(t.get('cycles', 2))} for t in tasks],
    }
    if position == 'primero':
        _process_config.insert(0, cfg)
    else:
        _process_config.append(cfg)
    _rebuild_line()
    total_cycles = sum(t['cycles'] for c in _process_config for t in c['tasks'])
    return jsonify({'ok': True, 'process_count': len(_process_config), 'total_cycles': total_cycles})


@app.delete('/api/processes/<int:index>')
def delete_process(index):
    if index < 0 or index >= len(_process_config):
        return jsonify({'error': 'index out of range'}), 404
    _process_config.pop(index)
    _rebuild_line()
    total_cycles = sum(t['cycles'] for c in _process_config for t in c['tasks'])
    return jsonify({'ok': True, 'process_count': len(_process_config), 'total_cycles': total_cycles})


@app.put('/api/processes/<int:index>')
def update_process(index):
    if index < 0 or index >= len(_process_config):
        return jsonify({'error': 'index out of range'}), 404
    body  = request.get_json(force=True) or {}
    name  = body.get('name', '?')
    tasks = body.get('tasks', [])
    _process_config[index] = {
        'name': name,
        'tasks': [{'name': t['name'], 'cycles': int(t.get('cycles', 1))} for t in tasks],
    }
    _rebuild_line()
    total_cycles = sum(t['cycles'] for c in _process_config for t in c['tasks'])
    return jsonify({'ok': True, 'process_count': len(_process_config), 'total_cycles': total_cycles})


# ---------------------------------------------------------------------------
# Simulation API
# ---------------------------------------------------------------------------

@app.post('/api/simulation/start')
def sim_start():
    if len(_process_config) == 0:
        return jsonify({'error': 'No processes configured'}), 409
    body         = request.get_json(force=True) or {}
    num_products = int(body.get('num_products', 5))
    line.start(num_products)
    return jsonify(_serial_state())


@app.post('/api/simulation/tick')
def sim_tick():
    line.tick()
    if line.is_complete():
        line.is_running = False
    return jsonify(_serial_state())


@app.post('/api/simulation/pause')
def sim_pause():
    line.pause()
    return jsonify({'ok': True, 'is_paused': line.is_paused, 'current_cycle': line.current_cycle})


@app.post('/api/simulation/resume')
def sim_resume():
    line.resume()
    line.is_running = True
    return jsonify({'ok': True, 'is_paused': line.is_paused, 'current_cycle': line.current_cycle})


@app.post('/api/simulation/reset')
def sim_reset():
    body         = request.get_json(force=True) or {}
    num_products = int(body.get('num_products', line.num_products or 5))
    line.reset(num_products)
    return jsonify({'ok': True, 'current_cycle': line.current_cycle, 'num_products': line.num_products})


@app.get('/api/simulation/state')
def sim_state():
    return jsonify(_serial_state())


@app.get('/api/simulation/report')
def sim_report():
    return jsonify(_serial_report())


if __name__ == '__main__':
    app.run(debug=True, port=5000)
