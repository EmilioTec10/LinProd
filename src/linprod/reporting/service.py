"""Reporting service to generate production reports from line configuration."""

from linprod.domain.models import ProductionLine
from linprod.reporting.models import ProductionReport


def generate_line_report(line: ProductionLine) -> ProductionReport:
    """
    Generate a basic report from the current line configuration.

    This provides configuration-level metrics (not simulation-based).
    """
    total_processes = len(line.processes)
    total_tasks = sum(len(p.tasks) for p in line.processes)
    total_processing_time = sum(
        sum(t.processing_time for t in p.tasks) for p in line.processes
    )

    report = ProductionReport(
        line_name=line.name,
        total_processes=total_processes,
        total_tasks=total_tasks,
        total_cycle_time=total_processing_time,
    )

    # Configuration validation notes
    if line.initial_process is None:
        report.add_note("Warning: No initial process set")
    else:
        report.add_note(f"Initial process: {line.initial_process.name}")

    if line.final_process is None:
        report.add_note("Warning: No final process set")
    else:
        report.add_note(f"Final process: {line.final_process.name}")

    # Check process chain completeness
    if line.initial_process and line.final_process:
        current = line.initial_process
        visited = set()
        while current is not None and current.name not in visited:
            visited.add(current.name)
            if current is line.final_process:
                report.add_note("Process chain is complete (initial -> ... -> final)")
                break
            next_proc = None
            for p in line.processes:
                if p.input_process is current:
                    next_proc = p
                    break
            current = next_proc
        if current is None or current.name in visited and current is not line.final_process:
            report.add_note("Warning: Final process not reachable from initial")

    # Bottleneck analysis (highest processing time)
    max_task_time = 0
    bottleneck = None
    for p in line.processes:
        for t in p.tasks:
            if t.processing_time > max_task_time:
                max_task_time = t.processing_time
                bottleneck = p.name
    if bottleneck:
        report.bottleneck_process = bottleneck
        report.bottleneck_waiting_time = float(max_task_time)
        report.add_note(
            f"Potential bottleneck: {bottleneck} (max task time: {max_task_time})"
        )

    return report
