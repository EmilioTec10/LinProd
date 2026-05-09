"""Reporting data models for production line analysis."""

from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class ProductionReport:
    """Report containing production line metrics and analysis."""

    line_name: str
    total_processes: int
    total_tasks: int
    first_finish_time: Optional[int] = None
    last_finish_time: Optional[int] = None
    average_completion_time: Optional[float] = None
    average_waiting_time: Optional[float] = None
    bottleneck_process: Optional[str] = None
    bottleneck_waiting_time: Optional[float] = None
    total_cycle_time: Optional[int] = None
    notes: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.total_processes < 0:
            raise ValueError("total_processes must be non-negative")
        if self.total_tasks < 0:
            raise ValueError("total_tasks must be non-negative")

    def add_note(self, note: str) -> None:
        """Add a note to the report."""
        self.notes.append(note)

    def as_dict(self) -> dict:
        """Convert report to dictionary."""
        return asdict(self)

    def total_elapsed_time(self) -> Optional[int]:
        """Calculate total elapsed time from first to last finish."""
        if self.first_finish_time is None or self.last_finish_time is None:
            return None
        return self.last_finish_time - self.first_finish_time
