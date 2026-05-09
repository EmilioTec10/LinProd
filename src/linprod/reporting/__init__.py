"""Production reporting module."""

from linprod.reporting.models import ProductionReport
from linprod.reporting.service import generate_line_report

__all__ = ["ProductionReport", "generate_line_report"]
