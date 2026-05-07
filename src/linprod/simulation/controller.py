"""Simulation controller primitives: SimulationController, CycleClock, SnapshotPrinter.

These are a minimal, testable implementation matching the UML class diagram.
"""

from dataclasses import dataclass, field
from typing import Callable, Optional, List


@dataclass
class CycleClock:
    current_time: int = 0

    def tick(self, steps: int = 1) -> None:
        """Advance the clock by a number of cycles."""
        if steps < 0:
            raise ValueError("steps must be non-negative")
        self.current_time += int(steps)

    def set_time(self, t: int) -> None:
        if t < 0:
            raise ValueError("time must be non-negative")
        self.current_time = int(t)


@dataclass
class SnapshotPrinter:
    renderer: Optional[Callable[[], str]] = None

    def print_state(self) -> str:
        """Return a textual snapshot of the system state.

        If a renderer is provided it is used; otherwise a default summary is returned.
        """
        if self.renderer:
            return self.renderer()
        return "<snapshot>"


class SimulationController:
    """Controls the simulation lifecycle in cycles.

    Responsibilities:
    - hold a CycleClock
    - allow advancing cycles manually (advance_cycle)
    - schedule a pauseAt time (pause_at)
    - produce snapshots via SnapshotPrinter
    """

    def __init__(self, clock: Optional[CycleClock] = None, snapshot_printer: Optional[SnapshotPrinter] = None) -> None:
        self.clock = clock or CycleClock()
        self.snapshot_printer = snapshot_printer or SnapshotPrinter()
        self._pause_at: Optional[int] = None
        self._is_running: bool = False
        self._history: List[int] = []

    def start(self) -> None:
        """Mark controller as running. Does not enter an automatic loop (keeps control simple/testable)."""
        self._is_running = True

    def pauseAt(self, t: int) -> None:
        """Request a pause at cycle t."""
        if t < 0:
            raise ValueError("pause time must be non-negative")
        self._pause_at = int(t)

    def reset(self) -> None:
        """Reset controller state and clock."""
        self.clock.set_time(0)
        self._pause_at = None
        self._is_running = False
        self._history.clear()

    def advance_cycle(self, steps: int = 1) -> None:
        """Advance the simulation by a number of cycles and capture snapshots when requested."""
        if steps <= 0:
            raise ValueError("steps must be positive")
        for _ in range(steps):
            self.clock.tick(1)
            self._history.append(self.clock.current_time)
            if self._pause_at is not None and self.clock.current_time >= self._pause_at:
                # emulate a pause: stop running and emit snapshot
                self._is_running = False
                break

    def is_running(self) -> bool:
        return self._is_running

    def get_history(self) -> List[int]:
        return list(self._history)

    def get_snapshot(self) -> str:
        return self.snapshot_printer.print_state()
