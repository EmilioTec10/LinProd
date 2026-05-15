# LinProd

LinProd is a production-line simulator. The repository currently contains a Flask-based web UI and a pure-Python simulation core.

## Project layout (actual)

```
LinProd/
	src/
		app.py            # Flask frontend (serves the static UI and provides API)
		linprod_core.py   # Simulation engine and domain model
	web/                # static UI files served by the Flask app
		index.html
		*.html, *.js, styles.css
	pyproject.toml
	README.md
```

## Quick start (run the web UI)

1. Create and activate a virtual environment (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
```

2. Install runtime dependencies:

```powershell
pip install Flask flask-cors
```

3. Start the server (from the repository root):

```powershell
python src/app.py
```

4. Open your browser at http://localhost:5000

This runs the Flask app in `app.py`, which serves `index.html` and exposes the simulation API used by the UI.

## Running the core library (programmatic)

You can import and use the simulation core from Python directly:

```python
from linprod_core import ProductionLine, Process, Task

line = ProductionLine()
p = Process('Cutting')
p.add_task(Task('Cut', 3))
line.add_process(p)
line.link_processes()
line.start(5)
line.tick()
print(line.get_snapshot())
```


