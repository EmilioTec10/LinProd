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
			demo.py                  # Interactive demo for testing configuration
			domain/
				__init__.py
				models.py            # Core domain: Product, Task, Process, ProductionLine
			main.py
			reporting/
				__init__.py
				models.py            # ProductionReport dataclass
				service.py           # Report generation from line configuration
			simulation/
				__init__.py
				controller.py        # Cycle clock and snapshot printer
	tests/
		test_domain_model.py
		test_simulation_control.py
	docs/
		linprod-application.puml  # UML class diagram
	.gitignore
	pyproject.toml
	README.md
```

## Quick start

1. Create and activate a virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate
   ```

2. Install dependencies:

   ```bash
   pip install -e .[dev]
   ```

3. Run tests:

   ```bash
   pytest -q
   ```

## Using the Demo

The demo allows you to manually configure a production line and generate reports. It tests the core functions needed for the UI:
- Create processes
- Add tasks to processes  
- Set initial/final processes
- Link processes together
- View production line flow
- Generate production reports

**Run the demo:**

```powershell
python -m linprod.demo
```

**Demo Menu Options:**

1. **Create process** — Add a new process to the line (e.g., "Cutting", "Assembly")
2. **Add task to process** — Add a task with a processing time to a process (e.g., "Cut raw material" with time 5)
3. **Set process as initial** — Mark one process as the starting point (only one allowed)
4. **Set process as final** — Mark one process as the endpoint (only one allowed)
5. **Link processes** — Connect processes in sequence (previous → next)
6. **Show line configuration** — Display all processes, their tasks, and linkage
7. **Show full production line** — Display the complete flow from initial to final (e.g., "Cutting → Assembly → Packaging")
8. **Generate report** — Generate and display configuration metrics:
   - Total processes and tasks
   - Total processing time (sum of all task times)
   - Bottleneck identification (process with highest task time)
   - Configuration validation notes
9. **Reset line** — Clear all processes and start over
0. **Exit** — Exit the demo

**Example Session:**

```
Enter production line name (or press Enter for 'Demo Line'): My Factory

Action number: 1
Process name: Cutting
Process 'Cutting' added to line.

Action number: 1
Process name: Assembly
Process 'Assembly' added to line.

Action number: 2
Process name to add task into: Cutting
Task name: Cut material
Processing time (integer >0): 5
Added task 'Cut material' (5) to process 'Cutting'.

Action number: 3
Process name to mark as INITIAL: Cutting
Process 'Cutting' set as initial.

Action number: 4
Process name to mark as FINAL: Assembly
Process 'Assembly' set as final.

Action number: 5
Previous process name: Cutting
Next process name: Assembly
Linked 'Cutting' -> 'Assembly'.

Action number: 8
=== Production Report: My Factory ===
Total Processes: 2
Total Tasks: 1
Total Processing Time (sum of all task times): 5
Bottleneck Process: Cutting (5.0)

Report Notes:
  - Initial process: Cutting
  - Final process: Assembly
  - Process chain is complete (initial -> ... -> final)
  - Potential bottleneck: Cutting (max task time: 5)
```

## Constraints & Business Rules

The demo enforces these production line rules:
- **One initial process** — Only one process can be marked as starting point
- **One final process** — Only one process can be marked as endpoint
- **Initial ≠ Final** — A process cannot be both initial and final
- **Initial has no predecessor** — Initial process cannot be linked from another process
- **Final has no successor** — Final process cannot link to another process
- **Cannot link to initial** — You cannot link any other process to the initial process


## Domain Model

The core entities for the production line simulator:

**Product** — Represents an item moving through the production line
- `id` — unique identifier
- `arrival_time` — when the product enters the system
- `start_time` — when it started processing
- `finish_time` — when it completed
- `status` — one of: pending, processing, finished

**Task** — A processing step inside a process
- `name` — task description
- `processing_time` — cycles required to complete
- `busy` — whether currently processing a product
- `current_product` — product being processed
- `waiting_queue` — FIFO queue for waiting products
- Methods: `start_processing()`, `finish_processing()`, `accept_product()`

**Process** — A group of ordered tasks in the production line
- `name` — process name (e.g., "Cutting", "Assembly")
- `is_initial` — whether this is the starting process
- `is_final` — whether this is the ending process
- `input_process` — link to the previous process (if any)
- `tasks` — ordered list of tasks in this process
- Methods: `add_task()`, `get_next_task()`, `set_previous_process()`

**ProductionLine** — Container for the complete production line configuration
- `name` — line name
- `initial_process` — reference to starting process
- `final_process` — reference to ending process
- `processes` — list of all processes
- Methods: `add_process()`, `link_process()`, `set_initial_process()`, `set_final_process()`, `reset_line()`

## Architecture

- **Domain Layer** (`domain/models.py`) — Pure data entities with validation
- **Simulation Layer** (`simulation/controller.py`) — Time advancement and cycle management
- **Reporting Layer** (`reporting/`) — Analysis and metrics generation
- **Demo Layer** (`demo.py`) — Interactive configuration interface

## Testing

Run the full test suite:

```bash
pytest -q
```

Run with verbose output:

```bash
pytest -vv
```

Current test coverage includes:
- Domain model validation and linking
- Queue FIFO behavior
- Task product handling
- Process and line configuration
- Initial/final process constraints
- Production line reset

## Environment variables

- `LINPROD_ENV` — app environment (`development`, `staging`, `production`)
- `LINPROD_DEBUG` — debug mode (`true` or `false`)

## Next build steps

1. **Simulation Engine** — Implement cycle-by-cycle product movement through tasks
2. **Advanced Reporting** — Add simulation-based metrics (first/last finish times, average completion, cycle times)
3. **Persistent Storage** — Save/load production line configurations
4. **Web UI** — Develop a graphical interface (the demo validates that core functions work)
5. **Performance Analytics** — Add tracking for queue lengths, wait times, throughput
