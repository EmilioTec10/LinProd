# LinProd

LinProd is now bootstrapped with a clean Python startup structure so you can begin building features immediately.

## What this startup includes

- Source layout using `src/`
- Application entrypoint with a basic startup flow
- Environment-based configuration
- Domain model for the production line simulator
- Reporting data model for final simulation metrics
- Test scaffold with `pytest`
- Packaging and tool config in `pyproject.toml`

## Project structure

```
LinProd/
	src/
		linprod/
			__init__.py
			config.py
			domain/
				__init__.py
				models.py
			main.py
			reporting/
				__init__.py
				models.py
			simulation/
				__init__.py
				controller.py
	tests/
		test_domain_model.py
		test_main.py
		test_reporting_model.py
		test_simulation_control.py
	.gitignore
	pyproject.toml
	README.md
```

## Quick start

1. Create and activate a virtual environment.

     ```bash
	 python -m venv .venv
    .\.venv\Scripts\Activate
	 ```

2. Install dependencies:

	 ```bash
	 pip install -e .[dev]
	 ```

3. Run the app:

	 ```bash
	 linprod
	 ```

4. Run tests:

	 ```bash
	 pytest -vv
	 ```

5. Run the console smoke test:

	 ```bash
	 linprod-smoke
	 ```


## Environment variables

- `LINPROD_ENV`: app environment (`development`, `staging`, `production`)
- `LINPROD_DEBUG`: debug mode (`true` or `false`)

## Next build steps

1. Add the reporting service that computes the final metrics from simulation results.
2. Add the simulation engine that moves products through tasks cycle by cycle.
3. Expand tests for all critical paths.