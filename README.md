# LinProd

LinProd is now bootstrapped with a clean Python startup structure so you can begin building features immediately.

## What this startup includes

- Source layout using `src/`
- Application entrypoint with a basic startup flow
- Environment-based configuration
- Test scaffold with `pytest`
- Packaging and tool config in `pyproject.toml`

## Project structure

```
LinProd/
	src/
		linprod/
			__init__.py
			config.py
			main.py
	tests/
		test_main.py
	.gitignore
	pyproject.toml
	README.md
```

## Quick start

1. Create and activate a virtual environment.
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
	 pytest
	 ```

## Environment variables

- `LINPROD_ENV`: app environment (`development`, `staging`, `production`)
- `LINPROD_DEBUG`: debug mode (`true` or `false`)

## Next build steps

1. Add your core domain models and business logic under `src/linprod/`.
2. Add API or UI interfaces depending on your target platform.
3. Expand tests for all critical paths.