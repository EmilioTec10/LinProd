"""Reporting data structures for the production line simulator."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class ProductionReport:
    """Summary of a completed simulation run.

    This is a pure data model. It captures the metrics required by the PDF:
    - first and last product completion time
    - average completion time
    - bottleneck process
    - average waiting time
    - process/task with highest waiting time
    - total processing time
    - optional extra statistics for future extensions
    """

    first_product_finish_time: int
    last_product_finish_time: int
    average_completion_time: float
    bottleneck_process: str
    average_waiting_time: float
    max_waiting_process: str
    max_waiting_task: str
    total_processing_time: int
    extra_statistics: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        for field_name in (
            "first_product_finish_time",
            "last_product_finish_time",
            "total_processing_time",
        ):
            value = getattr(self, field_name)
            if value < 0:
                raise ValueError(f"{field_name} must be non-negative")

        for field_name in ("average_completion_time", "average_waiting_time"):
            value = getattr(self, field_name)
            if value < 0:
                raise ValueError(f"{field_name} must be non-negative")

        if self.last_product_finish_time < self.first_product_finish_time:
            raise ValueError("last_product_finish_time must be greater than or equal to first_product_finish_time")

    @property
    def total_elapsed_time(self) -> int:
        """Elapsed time from first finished product to last finished product."""
        return self.last_product_finish_time - self.first_product_finish_time

    def as_dict(self) -> dict[str, Any]:
        """Return a serializable view of the report."""
        return {
            "first_product_finish_time": self.first_product_finish_time,
            "last_product_finish_time": self.last_product_finish_time,
            "average_completion_time": self.average_completion_time,
            "bottleneck_process": self.bottleneck_process,
            "average_waiting_time": self.average_waiting_time,
            "max_waiting_process": self.max_waiting_process,
            "max_waiting_task": self.max_waiting_task,
            "total_processing_time": self.total_processing_time,
            "total_elapsed_time": self.total_elapsed_time,
            "extra_statistics": dict(self.extra_statistics),
        }
