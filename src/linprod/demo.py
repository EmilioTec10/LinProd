"""Minimal, prompt-driven manual demo to validate interface functions.

This script uses simple `input()` prompts so UI implementers can see
how to call the domain functions to: create processes, parameterize
tasks, mark a process as initial/final, and link processes.

Run with: python -m linprod.demo
"""
from __future__ import annotations

from linprod.domain.models import ProductionLine, Process, Task
from linprod.reporting import generate_line_report


def ask(prompt: str) -> str:
    try:
        return input(prompt)
    except EOFError:
        return ""


def find_process(line: ProductionLine, name: str) -> Process | None:
    for p in line.processes:
        if p.name == name:
            return p
    return None


def run() -> None:
    print("Simple manual demo - use inputs to configure the line")
    line_name = ask("Enter production line name (or press Enter for 'Demo Line'): ") or "Demo Line"
    line = ProductionLine(name=line_name)
    print(f"Created production line: {line.name}\n")

    while True:
        print("Choose an action:")
        print("  1) Create process")
        print("  2) Add task to process")
        print("  3) Set process as initial")
        print("  4) Set process as final")
        print("  5) Link processes (previous -> next)")
        print("  6) Show line configuration")
        print("  7) Show full production line")
        print("  8) Generate report")
        print("  9) Reset line")
        print("  0) Exit")

        choice = ask("Action number: ").strip()
        if choice == "0":
            print("Exiting demo.")
            break

        if choice == "1":
            name = ask("Process name: ") or "Unnamed"
            p = Process(name=name)
            line.add_process(p)
            print(f"Process '{name}' added to line.")
            continue

        if choice == "2":
            pname = ask("Process name to add task into: ")
            proc = find_process(line, pname)
            if proc is None:
                print("Process not found. Create it first.")
                continue
            tname = ask("Task name: ") or "task"
            try:
                ptime = int(ask("Processing time (integer >0): "))
            except Exception:
                print("Invalid time - must be integer > 0")
                continue
            task = Task(name=tname, processing_time=ptime)
            proc.add_task(task)
            print(f"Added task '{tname}' ({ptime}) to process '{proc.name}'.")
            continue

        if choice == "3":
            pname = ask("Process name to mark as INITIAL: ")
            proc = find_process(line, pname)
            if proc is None:
                print("Process not found.")
                continue
            if line.initial_process is not None:
                print(f"Replacing previous initial process '{line.initial_process.name}'.")
            try:
                line.set_initial_process(proc)
            except ValueError as exc:
                print(f"Cannot set initial process: {exc}")
                continue
            print(f"Process '{proc.name}' set as initial.")
            continue

        if choice == "4":
            pname = ask("Process name to mark as FINAL: ")
            proc = find_process(line, pname)
            if proc is None:
                print("Process not found.")
                continue
            if line.final_process is not None:
                print(f"Replacing previous final process '{line.final_process.name}'.")
            try:
                line.set_final_process(proc)
            except ValueError as exc:
                print(f"Cannot set final process: {exc}")
                continue
            print(f"Process '{proc.name}' set as final.")
            continue

        if choice == "5":
            prev = ask("Previous process name: ")
            nxt = ask("Next process name: ")
            p_prev = find_process(line, prev)
            p_next = find_process(line, nxt)
            if p_prev is None or p_next is None:
                print("Both processes must exist. Create them first.")
                continue
            try:
                line.link_process(p_prev, p_next)
            except ValueError as exc:
                print(f"Cannot link processes: {exc}")
                continue
            print(f"Linked '{p_prev.name}' -> '{p_next.name}'.")
            continue

        if choice == "6":
            print(f"Production line: {line.name}")
            print("Processes:")
            for p in line.processes:
                flags = []
                if p.is_initial:
                    flags.append("INITIAL")
                if p.is_final:
                    flags.append("FINAL")
                prev = p.input_process.name if p.input_process else "-"
                print(f" - {p.name} (prev: {prev}) [{' '.join(flags)}]")
                for t in p.tasks:
                    print(f"    * Task: {t.name}, time={t.processing_time}")
            print("")
            continue

        if choice == "7":
            print(f"\nProduction line flow: {line.name}")
            if not line.processes:
                print("  (no processes)")
            elif line.initial_process is None:
                print("  (no initial process set)")
            else:
                current = line.initial_process
                path = []
                visited = set()
                while current is not None and current.name not in visited:
                    path.append(current.name)
                    visited.add(current.name)
                    next_proc = None
                    for p in line.processes:
                        if p.input_process is current:
                            next_proc = p
                            break
                    current = next_proc
                print("  " + " -> ".join(path))
            print("")
            continue

        if choice == "8":
            report = generate_line_report(line)
            print(f"\n=== Production Report: {report.line_name} ===")
            print(f"Total Processes: {report.total_processes}")
            print(f"Total Tasks: {report.total_tasks}")
            if report.total_cycle_time is not None:
                print(f"Total Processing Time (sum of all task times): {report.total_cycle_time}")
            if report.bottleneck_process:
                print(f"Bottleneck Process: {report.bottleneck_process} ({report.bottleneck_waiting_time})")
            print("\nReport Notes:")
            for note in report.notes:
                print(f"  - {note}")
            print("")
            continue

        if choice == "9":
            line.reset_line()
            line.processes = []
            print("Line reset (process list cleared, initial/final unset).")
            continue

        print("Unknown choice - try again.")


if __name__ == "__main__":
    run()
