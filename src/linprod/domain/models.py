"""Core domain entities for the production line simulator."""

from collections import deque
from dataclasses import dataclass, field
from typing import Deque, Iterable, Optional


@dataclass
class Product:
    """Product moving through the production line."""

    id: str
    arrival_time: int = 0
    start_time: Optional[int] = None
    finish_time: Optional[int] = None
    status: str = "pending"

    def mark_started(self, time: int) -> None:
        if time < 0:
            raise ValueError("time must be non-negative")
        self.start_time = time
        self.status = "processing"

    def mark_finished(self, time: int) -> None:
        if time < 0:
            raise ValueError("time must be non-negative")
        self.finish_time = time
        self.status = "finished"


@dataclass
class Queue:
    """FIFO queue for products waiting on a task."""

    items: Deque[Product] = field(default_factory=deque)

    def enqueue(self, product: Product) -> None:
        self.items.append(product)

    def dequeue(self) -> Product:
        if not self.items:
            raise IndexError("dequeue from an empty queue")
        return self.items.popleft()

    def size(self) -> int:
        return len(self.items)

    def __iter__(self):
        return iter(self.items)


@dataclass
class Task:
    """A processing step inside a process."""

    name: str
    processing_time: int
    busy: bool = False
    current_product: Optional[Product] = None
    waiting_queue: Queue = field(default_factory=Queue)

    def __post_init__(self) -> None:
        if self.processing_time <= 0:
            raise ValueError("processing_time must be positive")

    def accept_product(self, product: Product, current_time: Optional[int] = None) -> None:
        """Accept a product immediately if the task is free, otherwise enqueue it."""
        if self.busy:
            self.waiting_queue.enqueue(product)
            return
        self.current_product = product
        self.busy = True
        product.mark_started(product.arrival_time if current_time is None else current_time)

    def start_processing(self, product: Product, current_time: Optional[int] = None) -> None:
        self.accept_product(product, current_time=current_time)

    def finish_processing(self, current_time: int) -> Optional[Product]:
        """Finish the current product and move the next waiting product into place."""
        if self.current_product is None:
            return None

        finished_product = self.current_product
        finished_product.mark_finished(current_time)

        if self.waiting_queue.size() > 0:
            next_product = self.waiting_queue.dequeue()
            self.current_product = next_product
            next_product.mark_started(current_time)
            self.busy = True
        else:
            self.current_product = None
            self.busy = False

        return finished_product


@dataclass
class Process:
    """A process groups ordered tasks and may link to another process."""

    name: str
    is_initial: bool = False
    is_final: bool = False
    input_process: Optional["Process"] = None
    tasks: list[Task] = field(default_factory=list)

    def add_task(self, task: Task) -> None:
        self.tasks.append(task)

    def get_next_task(self, current_task: Optional[Task] = None) -> Optional[Task]:
        if not self.tasks:
            return None
        if current_task is None:
            return self.tasks[0]
        try:
            index = self.tasks.index(current_task)
        except ValueError:
            return None
        next_index = index + 1
        if next_index >= len(self.tasks):
            return None
        return self.tasks[next_index]

    def set_previous_process(self, process: Optional["Process"]) -> None:
        self.input_process = process

    # Aliases matching the UML naming style.
    def setPreviousProcess(self, process: Optional["Process"]) -> None:
        self.set_previous_process(process)


@dataclass
class ProductionLine:
    """Container for the complete production line configuration."""

    name: str
    initial_process: Optional[Process] = None
    final_process: Optional[Process] = None
    processes: list[Process] = field(default_factory=list)

    def add_process(self, process: Process) -> None:
        self.processes.append(process)

    def link_process(self, previous_process: Process, next_process: Process) -> None:
        if next_process.is_initial:
            raise ValueError("cannot link to a process marked as initial")
        next_process.set_previous_process(previous_process)

    def set_initial_process(self, process: Process) -> None:
        if self.final_process is process:
            raise ValueError("a process cannot be both initial and final")
        if process.input_process is not None:
            raise ValueError("initial process cannot have a predecessor")
        if self.initial_process is not None and self.initial_process is not process:
            self.initial_process.is_initial = False
        self.initial_process = process
        process.is_initial = True

    def set_final_process(self, process: Process) -> None:
        if self.initial_process is process:
            raise ValueError("a process cannot be both initial and final")
        for p in self.processes:
            if p.input_process is process:
                raise ValueError("final process cannot have a successor")
        if self.final_process is not None and self.final_process is not process:
            self.final_process.is_final = False
        self.final_process = process
        process.is_final = True

    def reset_line(self) -> None:
        self.initial_process = None
        self.final_process = None
        for process in self.processes:
            process.is_initial = False
            process.is_final = False
            process.input_process = None

    # UML-style aliases.
    def addProcess(self, process: Process) -> None:
        self.add_process(process)

    def linkProcess(self, previous_process: Process, next_process: Process) -> None:
        self.link_process(previous_process, next_process)

    def setInitialProcess(self, process: Process) -> None:
        self.set_initial_process(process)

    def setFinalProcess(self, process: Process) -> None:
        self.set_final_process(process)

    def resetLine(self) -> None:
        self.reset_line()


def build_production_line(name: str, processes: Iterable[Process]) -> ProductionLine:
    """Helper to create a line from a sequence of processes."""
    line = ProductionLine(name=name)
    for process in processes:
        line.add_process(process)
    return line
