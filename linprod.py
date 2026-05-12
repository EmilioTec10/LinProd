"""
linprod.py — Serial Production Line Simulator
Terminal-based, single-file, no external dependencies.
"""

from __future__ import annotations

import sys
from collections import deque
from typing import Any, Callable, Iterator, List, Optional, Tuple


# ---------------------------------------------------------------------------
# ANSI color helpers (no external libs)
# ---------------------------------------------------------------------------


class Color:
    """ANSI escape-code constants and helpers for terminal color output."""

    RESET  = "\033[0m"
    BOLD   = "\033[1m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    RED    = "\033[91m"
    CYAN   = "\033[96m"
    MAGENTA = "\033[95m"
    WHITE  = "\033[97m"

    @staticmethod
    def wrap(code: str, text: str) -> str:
        """Surround text with an ANSI code and append a reset."""
        return f"{code}{text}{Color.RESET}"

    @staticmethod
    def bold(text: str) -> str:
        """Return bold text."""
        return Color.wrap(Color.BOLD, text)

    @staticmethod
    def green(text: str) -> str:
        """Return green text."""
        return Color.wrap(Color.GREEN, text)

    @staticmethod
    def yellow(text: str) -> str:
        """Return yellow text."""
        return Color.wrap(Color.YELLOW, text)

    @staticmethod
    def red(text: str) -> str:
        """Return red text."""
        return Color.wrap(Color.RED, text)

    @staticmethod
    def cyan(text: str) -> str:
        """Return cyan text."""
        return Color.wrap(Color.CYAN, text)

    @staticmethod
    def magenta(text: str) -> str:
        """Return magenta text."""
        return Color.wrap(Color.MAGENTA, text)


# ---------------------------------------------------------------------------
# Generic Linked List
# ---------------------------------------------------------------------------


class Node:
    """Generic singly-linked list node holding arbitrary data."""

    def __init__(self, data: Any) -> None:
        """Initialize with data payload and no successor."""
        self.data: Any = data
        self.next: Optional[Node] = None


class LinkedList:
    """Generic singly-linked list with O(n) append and iteration support."""

    def __init__(self) -> None:
        """Initialize an empty list."""
        self.head: Optional[Node] = None
        self._length: int = 0

    def append(self, data: Any) -> None:
        """Append data as a new tail node.

        Args:
            data: The value to store in the new node.
        """
        new_node = Node(data)
        if self.head is None:
            self.head = new_node
        else:
            current = self.head
            while current.next is not None:
                current = current.next
            current.next = new_node
        self._length += 1

    def find(self, predicate: Callable[[Any], bool]) -> Optional[Any]:
        """Return the first item for which predicate returns True, or None.

        Args:
            predicate: Callable that accepts one item and returns bool.
        """
        current = self.head
        while current is not None:
            if predicate(current.data):
                return current.data
            current = current.next
        return None

    def to_list(self) -> List[Any]:
        """Return all items as a plain Python list (snapshot copy)."""
        return [item for item in self]

    def __iter__(self) -> Iterator[Any]:
        """Yield each item's data from head to tail."""
        current = self.head
        while current is not None:
            yield current.data
            current = current.next

    def __len__(self) -> int:
        """Return the number of items in the list."""
        return self._length


# ---------------------------------------------------------------------------
# Domain classes
# ---------------------------------------------------------------------------


class Product:
    """An item that moves through the production line from start to finish."""

    def __init__(self, product_id: int) -> None:
        """
        Initialize a new product in waiting status.

        Args:
            product_id: Unique numeric identifier.
        """
        self.id: int = product_id
        self.status: str = "waiting"        # "waiting" | "processing" | "done"
        self.entry_cycle: int = 0
        self.exit_cycle: Optional[int] = None
        self.total_wait_time: int = 0       # cycles spent queued without being processed

    def __repr__(self) -> str:
        return f"Product#{self.id}"


class Task:
    """A single machine/workstation inside a Process that handles one Product at a time."""

    def __init__(self, name: str, process_time: int) -> None:
        """
        Initialize a Task.

        Args:
            name: Human-readable machine name.
            process_time: Fixed number of cycles required to process one product.
        """
        self.name: str = name
        self.process_time: int = process_time
        self.is_busy: bool = False
        self.current_product: Optional[Product] = None
        self.queue: deque = deque()                    # FIFO waiting queue (collections.deque)
        self.total_wait_time_accumulated: int = 0      # total wait cycles across all products queued here
        self.products_processed: int = 0
        self.cycles_remaining: int = 0
        self.parent_process: Optional[Process] = None  # back-reference set by Process.add_task()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _start_processing(self, product: Product) -> None:
        """Begin processing a product, setting busy state and cycle counter."""
        self.current_product = product
        self.is_busy = True
        self.cycles_remaining = self.process_time
        product.status = "processing"

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def receive_product(self, product: Product) -> None:
        """Accept an incoming product: start it immediately if idle, else enqueue it.

        Args:
            product: The product arriving at this task.
        """
        if self.is_busy:
            product.status = "waiting"
            self.queue.append(product)
        else:
            self._start_processing(product)

    def tick(self, current_cycle: int) -> Optional[Product]:
        """
        Advance the task one cycle, decrementing the processing counter.

        Args:
            current_cycle: The current global simulation cycle (informational).

        Returns:
            The finished Product if processing completes this cycle, else None.
        """
        if not self.is_busy:
            return None
        self.cycles_remaining -= 1
        if self.cycles_remaining == 0:
            finished = self.current_product
            self.current_product = None
            self.is_busy = False
            self.products_processed += 1
            return finished
        return None

    def try_dequeue(self) -> bool:
        """Start processing the next queued product if idle and queue is non-empty.

        Returns:
            True if a product was dequeued and started, False otherwise.
        """
        if not self.is_busy and self.queue:
            self._start_processing(self.queue.popleft())
            return True
        return False

    def is_available(self) -> bool:
        """Return True when this task is not currently processing a product."""
        return not self.is_busy

    def increment_queue_wait_times(self) -> None:
        """Add one wait cycle to every product currently sitting in this task's queue."""
        for product in self.queue:
            product.total_wait_time += 1
            self.total_wait_time_accumulated += 1

    def get_status(self) -> str:
        """Return a multi-line status block for this task, including queued product IDs."""
        proc_label = (
            f"[Process: {self.parent_process.name}] " if self.parent_process else ""
        )
        if self.is_busy and self.current_product is not None:
            header = Color.yellow(
                f'  Task "{self.name}" {proc_label}— '
                f"processing {self.current_product} "
                f"({self.cycles_remaining} cycles remaining)"
            )
        else:
            header = (
                f'  Task "{self.name}" {proc_label}— '
                + Color.green("idle")
                + f", processed total: {self.products_processed}"
            )

        queue_ids = [str(p) for p in self.queue]
        queue_str = (
            Color.magenta(f"    Queue ({len(self.queue)} waiting): {', '.join(queue_ids)}")
            if queue_ids
            else f"    Queue: empty"
        )
        return f"{header}\n{queue_str}"


class Process:
    """A production stage that owns an ordered chain of Tasks (LinkedList)."""

    def __init__(self, name: str) -> None:
        """
        Initialize a Process with an empty task chain.

        Args:
            name: Human-readable stage name.
        """
        self.name: str = name
        self.tasks: LinkedList = LinkedList()           # LinkedList of Task
        self.prev_process: Optional[Process] = None    # back-reference to predecessor stage
        self.is_initial: bool = False
        self.is_final: bool = False

    def add_task(self, task: Task) -> None:
        """Append a Task to the end of this process's task chain and set back-reference.

        Args:
            task: The Task to add.
        """
        self.tasks.append(task)
        task.parent_process = self   # satisfy req 7: task knows its owning process

    def get_first_task(self) -> Task:
        """Return the first Task in the chain (entry point for this stage)."""
        return next(iter(self.tasks))

    def get_next_task(self, task: Task) -> Optional[Task]:
        """Return the Task immediately after the given one, or None if it is the last.

        Args:
            task: Reference task whose successor is requested.
        """
        node = self.tasks.head
        while node is not None:
            if node.data is task:
                return node.next.data if node.next is not None else None
            node = node.next
        return None

    def tick(self, current_cycle: int) -> List[Tuple[Task, Product]]:
        """Advance every Task one cycle and collect products that finished.

        Args:
            current_cycle: Current global simulation cycle.

        Returns:
            List of (task, finished_product) pairs for products completing this cycle.
        """
        finished: List[Tuple[Task, Product]] = []
        for task in self.tasks:              # LinkedList iterator — never converted to list
            result = task.tick(current_cycle)
            if result is not None:
                finished.append((task, result))
        return finished

    def get_status(self) -> str:
        """Return a multi-line formatted status block for this process and all its tasks."""
        flags: List[str] = []
        if self.is_initial:
            flags.append("INITIAL")
        if self.is_final:
            flags.append("FINAL")
        flag_str = f" [{', '.join(flags)}]" if flags else ""
        prev_name = f'"{self.prev_process.name}"' if self.prev_process else "None"
        header = Color.cyan(Color.BOLD + f'Process "{self.name}"{flag_str}' + Color.RESET)
        header += Color.cyan(f"  (prev: {prev_name})")
        lines = [header]
        for task in self.tasks:              # LinkedList iterator
            lines.append(task.get_status())
        return "\n".join(lines)


class ProductionLine:
    """Main controller: owns the process chain and drives the simulation cycle by cycle."""

    def __init__(self) -> None:
        """Initialize an empty, unconfigured production line."""
        self.processes: LinkedList = LinkedList()       # LinkedList of Process
        self.products: List[Product] = []
        self.current_cycle: int = 0
        self.is_paused: bool = False
        self.is_running: bool = False
        self.completed_products: List[Product] = []
        self.num_products: int = 0
        self._products_injected: int = 0

    # ------------------------------------------------------------------
    # Configuration
    # ------------------------------------------------------------------

    def add_process(self, process: Process) -> None:
        """Append a Process to the end of the production chain.

        Args:
            process: The stage to add.
        """
        self.processes.append(process)

    def link_processes(self) -> None:
        """Set prev_process back-pointers and initial/final flags for every Process.

        Must be called after all processes have been added via add_process().
        """
        prev: Optional[Process] = None
        last: Optional[Process] = None

        for process in self.processes:       # LinkedList iterator
            process.prev_process = prev
            process.is_initial = prev is None
            process.is_final = False
            prev = process
            last = process

        if last is not None:
            last.is_final = True

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self, num_products: int) -> None:
        """Create products, reset all state, and begin the simulation.

        Args:
            num_products: Total number of products to push through the line.
        """
        self.num_products = num_products
        self.products = [Product(i + 1) for i in range(num_products)]
        self.current_cycle = 0
        self._products_injected = 0
        self.completed_products = []
        self.is_running = True
        self.is_paused = False
        for process in self.processes:       # LinkedList iterator
            for task in process.tasks:       # LinkedList iterator
                task.is_busy = False
                task.current_product = None
                task.queue.clear()
                task.total_wait_time_accumulated = 0
                task.products_processed = 0
                task.cycles_remaining = 0

    def reset(self, num_products: int) -> None:
        """Reset the simulation with a fresh product count, keeping line configuration.

        Args:
            num_products: New number of products to simulate.
        """
        self.start(num_products)

    def pause(self) -> None:
        """Pause the simulation; subsequent tick() calls become no-ops until resume()."""
        self.is_paused = True

    def resume(self) -> None:
        """Resume a paused simulation."""
        self.is_paused = False

    def is_complete(self) -> bool:
        """Return True when every product has exited the final process."""
        return len(self.completed_products) == self.num_products

    # ------------------------------------------------------------------
    # Navigation helpers (traverse LinkedList, never convert to list)
    # ------------------------------------------------------------------

    def _get_first_process(self) -> Process:
        """Return the initial (first) process in the chain."""
        return next(iter(self.processes))

    def _get_next_process(self, process: Process) -> Optional[Process]:
        """Return the Process immediately after the given one, or None if it is the last.

        Args:
            process: Reference process whose successor is requested.
        """
        node = self.processes.head
        while node is not None:
            if node.data is process:
                return node.next.data if node.next is not None else None
            node = node.next
        return None

    # ------------------------------------------------------------------
    # Simulation engine
    # ------------------------------------------------------------------

    def tick(self) -> None:
        """Advance the simulation by exactly one discrete cycle.

        Tick order:
          1. Inject one new product (one per cycle, starting at cycle 1).
          2. Increment wait times for all products currently in queues.
          3. Tick every task (decrement processing counters).
          4. Route products that finished this cycle to the next task/process/done.
          5. Let newly idle tasks start their next queued product.
        """
        if self.is_paused or not self.is_running:
            return

        self.current_cycle += 1

        # Step 1 — inject next product
        if self._products_injected < self.num_products:
            product = self.products[self._products_injected]
            product.entry_cycle = self.current_cycle
            product.status = "waiting"
            first_process = self._get_first_process()
            first_process.get_first_task().receive_product(product)
            self._products_injected += 1

        # Step 2 — charge wait time for everything already queued
        for process in self.processes:          # LinkedList iterator
            for task in process.tasks:          # LinkedList iterator
                task.increment_queue_wait_times()

        # Step 3 — tick all tasks, collect (process, task, product) triples
        finished_triples: List[Tuple[Process, Task, Product]] = []
        for process in self.processes:          # LinkedList iterator
            for task, product in process.tick(self.current_cycle):
                finished_triples.append((process, task, product))

        # Step 4 — route finished products
        for process, task, product in finished_triples:
            next_task = process.get_next_task(task)
            if next_task is not None:
                next_task.receive_product(product)
            else:
                next_process = self._get_next_process(process)
                if next_process is not None:
                    next_process.get_first_task().receive_product(product)
                else:
                    product.status = "done"
                    product.exit_cycle = self.current_cycle
                    self.completed_products.append(product)

        # Step 5 — let idle tasks pull from their queues
        for process in self.processes:          # LinkedList iterator
            for task in process.tasks:          # LinkedList iterator
                task.try_dequeue()

    # ------------------------------------------------------------------
    # Display
    # ------------------------------------------------------------------

    def get_snapshot(self) -> None:
        """Print a full snapshot of every process and task, traversing via LinkedList.

        Includes: per-task state with queued product IDs, completed products with
        durations, and pending (not-yet-injected) products.
        """
        sep = Color.cyan("=" * 62)
        print(f"\n{sep}")
        print(Color.bold(f"  SNAPSHOT — Cycle {self.current_cycle}"))
        print(Color.bold(
            f"  Products done: "
            + Color.green(f"{len(self.completed_products)}")
            + f" / {self.num_products}"
        ))
        print(sep)

        # Per-process / per-task state
        for process in self.processes:           # LinkedList iterator
            print(process.get_status())
            print()

        # Completed products
        print(Color.bold("  Completed products:"))
        if self.completed_products:
            for p in self.completed_products:
                duration = (p.exit_cycle or 0) - p.entry_cycle
                print(Color.green(
                    f"    {p}  entry={p.entry_cycle}  exit={p.exit_cycle}"
                    f"  duration={duration}  wait={p.total_wait_time}"
                ))
        else:
            print("    (none yet)")

        # Pending products (not yet injected into the line)
        pending_start = self._products_injected + 1
        pending_ids = list(range(pending_start, self.num_products + 1))
        print(Color.bold(f"\n  Pending (not yet injected): {len(pending_ids)}"))
        if pending_ids:
            id_str = ", ".join(f"Product#{i}" for i in pending_ids)
            print(f"    {id_str}")
        else:
            print("    (all products have entered the line)")

        print(sep)

    def generate_report(self) -> None:
        """Print a complete statistical report for the simulation run."""
        sep = Color.cyan("=" * 62)
        print(f"\n{sep}")
        print(Color.bold("  PRODUCTION LINE REPORT"))
        print(sep)

        if not self.completed_products:
            print("  No products have completed yet.")
            return

        completed = self.completed_products
        exit_cycles = [p.exit_cycle for p in completed if p.exit_cycle is not None]
        durations   = [p.exit_cycle - p.entry_cycle for p in completed if p.exit_cycle is not None]
        wait_times  = [p.total_wait_time for p in completed]

        first_done  = min(exit_cycles)
        last_done   = max(exit_cycles)
        avg_exit    = sum(exit_cycles) / len(exit_cycles)
        avg_duration = sum(durations) / len(durations)
        total_proc_time = sum(durations)

        in_progress = sum(
            1 for p in self.products
            if p.status in ("processing", "waiting")
        )
        still_in_line = self._products_injected - len(completed)
        throughput = len(completed) / self.current_cycle if self.current_cycle > 0 else 0.0

        print(f"  Products completed           : {len(completed)} / {self.num_products}")
        print(f"  Products still in line       : {still_in_line}")
        print(f"  Products not yet injected    : {self.num_products - self._products_injected}")
        print()
        print(Color.bold("  Timing"))
        print(f"    First product completion   : cycle {first_done}")
        print(f"    Last product completion    : cycle {last_done}")
        print(f"    Avg exit cycle             : {avg_exit:.2f}")
        print(f"    Avg time-in-system         : {avg_duration:.2f} cycles/product")
        print(f"    Total processing time      : {total_proc_time} cycles (sum of all durations)")
        print(f"    Avg wait time (all products): {sum(wait_times)/len(wait_times):.2f} cycles")
        print(f"    Throughput                 : {throughput:.4f} products/cycle")
        print(f"    Total simulation cycles    : {self.current_cycle}")

        # Bottleneck: task with highest total accumulated wait time
        bottleneck_task: Optional[Task] = None
        bottleneck_proc_name: str = ""
        max_wait: int = -1
        for process in self.processes:           # LinkedList iterator
            for task in process.tasks:           # LinkedList iterator
                if task.total_wait_time_accumulated > max_wait:
                    max_wait = task.total_wait_time_accumulated
                    bottleneck_task = task
                    bottleneck_proc_name = process.name

        print()
        print(Color.bold("  Bottleneck (highest queue congestion)"))
        if bottleneck_task is not None:
            print(Color.red(
                f'    Process "{bottleneck_proc_name}" → Task "{bottleneck_task.name}"'
                f"  (total queue-wait: {max_wait} cycles)"
            ))

        # Per-task detail
        print()
        print(Color.bold("  Per-task statistics"))
        for process in self.processes:           # LinkedList iterator
            for task in process.tasks:           # LinkedList iterator
                processed = task.products_processed
                avg_w = task.total_wait_time_accumulated / processed if processed > 0 else 0.0
                utilization = (
                    (processed * task.process_time) / self.current_cycle * 100
                    if self.current_cycle > 0 else 0.0
                )
                is_bn = (task is bottleneck_task)
                label = Color.red("  [BOTTLENECK]") if is_bn else ""
                print(
                    f'    Process "{process.name}" / Task "{task.name}":{label}\n'
                    f"      process_time={task.process_time} cycles  "
                    f"processed={processed}  "
                    f"avg_wait={avg_w:.2f} cycles  "
                    f"utilization={utilization:.1f}%"
                )

        print()


# ---------------------------------------------------------------------------
# Terminal UI helpers
# ---------------------------------------------------------------------------


def _prompt_int(msg: str, min_val: int = 1) -> int:
    """Loop until the user enters a valid integer >= min_val.

    Args:
        msg: The prompt string shown to the user.
        min_val: Minimum acceptable value (inclusive).

    Returns:
        A validated integer input.
    """
    while True:
        try:
            value = int(input(msg).strip())
            if value < min_val:
                print(f"  Please enter a value >= {min_val}.")
                continue
            return value
        except ValueError:
            print("  Invalid input — please enter a whole number.")


def _configure_line(line: ProductionLine) -> None:
    """Interactively prompt the user to build the production line configuration.

    Args:
        line: The ProductionLine instance to configure.
    """
    line.processes = LinkedList()

    num_processes = _prompt_int("Number of processes: ")
    for p_idx in range(num_processes):
        raw = input(f"  Name for process {p_idx + 1}: ").strip()
        p_name = raw if raw else f"Process{p_idx + 1}"
        process = Process(p_name)

        num_tasks = _prompt_int(f"  Number of tasks in '{p_name}': ")
        for t_idx in range(num_tasks):
            raw_t = input(f"    Name for task {t_idx + 1} of '{p_name}': ").strip()
            t_name = raw_t if raw_t else f"Task{t_idx + 1}"
            t_time = _prompt_int(f"    Process time (cycles) for '{t_name}': ")
            process.add_task(Task(t_name, t_time))

        line.add_process(process)

    line.link_processes()

    first: Optional[Process] = None
    last: Optional[Process] = None
    for p in line.processes:          # LinkedList iterator
        if first is None:
            first = p
        last = p

    print(Color.green(f"\n  Line configured: {len(line.processes)} process(es)."))
    if first and last:
        print(f"  Initial: {Color.cyan(first.name)}  |  Final: {Color.cyan(last.name)}")


def _print_menu() -> None:
    """Print the main simulator menu with color accents."""
    border = Color.cyan("=" * 42)
    print(f"\n{border}")
    print(Color.bold(Color.cyan("        === LinProd Simulator ===")))
    print(border)
    print(f"  {Color.bold('1.')} Configure production line")
    print(f"  {Color.bold('2.')} Start simulation")
    print(f"  {Color.bold('3.')} Step N cycles")
    print(f"  {Color.bold('4.')} Pause / Snapshot")
    print(f"  {Color.bold('5.')} Run until complete")
    print(f"  {Color.bold('6.')} Generate report")
    print(f"  {Color.bold('7.')} Reset")
    print(f"  {Color.bold('8.')} Exit")
    print(border)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    """Menu-driven terminal loop for the LinProd simulator."""
    line = ProductionLine()

    while True:
        _print_menu()
        choice = input("Select option [1-8]: ").strip()

        # ---- 1. Configure ---------------------------------------------------
        if choice == "1":
            _configure_line(line)

        # ---- 2. Start -------------------------------------------------------
        elif choice == "2":
            if len(line.processes) == 0:
                print(Color.red("  No production line configured yet — use option 1 first."))
                continue
            n = _prompt_int("How many products to inject? ")
            line.start(n)
            print(Color.green(
                f"  Simulation started: {n} product(s) ready. "
                "Use option 3 or 5 to advance."
            ))

        # ---- 3. Step N cycles -----------------------------------------------
        elif choice == "3":
            if not line.is_running:
                print(Color.red("  Simulation has not been started — use option 2 first."))
                continue
            n = _prompt_int("How many cycles to step? ")
            for _ in range(n):
                if line.is_complete():
                    print(Color.green(
                        f"  [Cycle {line.current_cycle}] "
                        "All products completed — nothing more to advance."
                    ))
                    break
                line.tick()
                done = len(line.completed_products)
                total = line.num_products
                done_str = Color.green(str(done)) if done == total else Color.yellow(str(done))
                print(
                    Color.bold(f"  [Cycle {line.current_cycle}]")
                    + f" Products done: {done_str} / {total}"
                )

        # ---- 4. Pause / Snapshot --------------------------------------------
        elif choice == "4":
            if not line.is_running:
                print(Color.red("  Simulation has not been started — use option 2 first."))
                continue
            line.pause()
            line.get_snapshot()
            input(Color.yellow("  *** Simulation paused. Press Enter to resume... ***"))
            line.resume()
            print(Color.green("  Simulation resumed."))

        # ---- 5. Run until complete ------------------------------------------
        elif choice == "5":
            if not line.is_running:
                print(Color.red("  Simulation has not been started — use option 2 first."))
                continue
            if line.is_complete():
                print(Color.green(
                    f"  Simulation already complete at cycle {line.current_cycle}."
                ))
                continue
            print(Color.bold("  Running to completion...\n"))
            while not line.is_complete():
                line.tick()
                done = len(line.completed_products)
                total = line.num_products
                done_str = Color.green(str(done)) if done == total else Color.yellow(str(done))
                print(
                    Color.bold(f"  [Cycle {line.current_cycle}]")
                    + f" Products done: {done_str} / {total}"
                )
            print(Color.green(
                f"\n  All {line.num_products} product(s) completed "
                f"at cycle {line.current_cycle}."
            ))

        # ---- 6. Generate report ---------------------------------------------
        elif choice == "6":
            if not line.is_running:
                print(Color.red("  No simulation data available — use options 2 and 3/5 first."))
                continue
            line.generate_report()

        # ---- 7. Reset -------------------------------------------------------
        elif choice == "7":
            if not line.is_running:
                print(Color.red("  No active simulation to reset — use option 2 first."))
                continue
            n = _prompt_int("How many products for the new run? ")
            line.reset(n)
            print(Color.green(f"  Simulation reset: {n} product(s) ready, cycle counter at 0."))

        # ---- 8. Exit --------------------------------------------------------
        elif choice == "8":
            print(Color.cyan("  Goodbye."))
            sys.exit(0)

        else:
            print(Color.red("  Unrecognised option — please enter a number from 1 to 8."))


if __name__ == "__main__":
    main()
