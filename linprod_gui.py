"""
linprod_gui.py — tkinter GUI frontend for the LinProd production line simulator.
Run with: python3 linprod_gui.py
Requires linprod_core.py in the same directory.
"""

from __future__ import annotations

import re
import tkinter as tk
from tkinter import messagebox, scrolledtext, simpledialog, ttk
from typing import List, Tuple

from linprod_core import LinkedList, Process, ProductionLine, Task


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def strip_ansi(text: str) -> str:
    """Remove ANSI escape codes so strings render cleanly in tk widgets."""
    return re.sub(r"\033\[[0-9;]*[mK]", "", text)


# ---------------------------------------------------------------------------
# Main application
# ---------------------------------------------------------------------------


class LinProdApp:
    """Main window of the LinProd GUI simulator."""

    def __init__(self, root: tk.Tk) -> None:
        """
        Initialize the application.

        Args:
            root: The tkinter root window.
        """
        self.root = root
        self.root.title("LinProd — Production Line Simulator")
        self.root.minsize(860, 620)

        self.line = ProductionLine()
        self._line_built: bool = False

        # Staging area used only in the Configure tab before Build Line is clicked.
        # Structure: [(process_name, [(task_name, cycles), ...]), ...]
        self._config_data: List[Tuple[str, List[Tuple[str, int]]]] = []

        self._running: bool = False  # True while "Run to Completion" after() loop is active

        self._build_ui()
        self.refresh_status()

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _build_ui(self) -> None:
        """Create all widgets: status panel (bottom) + notebook (3 tabs)."""
        # Status panel packed first at bottom so it is always visible
        status_outer = tk.LabelFrame(self.root, text="Status", padx=4, pady=4)
        status_outer.pack(side=tk.BOTTOM, fill=tk.X, padx=6, pady=(0, 6))
        self._build_status_panel(status_outer)

        self._notebook = ttk.Notebook(self.root)
        self._notebook.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)

        tab_cfg = ttk.Frame(self._notebook)
        tab_sim = ttk.Frame(self._notebook)
        tab_rpt = ttk.Frame(self._notebook)

        self._notebook.add(tab_cfg, text="  Configure  ")
        self._notebook.add(tab_sim, text="  Simulation  ")
        self._notebook.add(tab_rpt, text="  Report  ")

        self._build_configure_tab(tab_cfg)
        self._build_simulation_tab(tab_sim)
        self._build_report_tab(tab_rpt)

    # ── Configure tab ─────────────────────────────────────────────────

    def _build_configure_tab(self, parent: ttk.Frame) -> None:
        """Build the Configure tab: process/task editor + Build Line button."""
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(2, weight=1)

        tk.Label(
            parent,
            text="First process added = INITIAL  |  Last process added = FINAL  |  Click 'Build Line' to commit.",
            fg="gray40", font=("TkDefaultFont", 9, "italic"),
        ).grid(row=0, column=0, sticky="w", padx=8, pady=(8, 2))

        # Add-process row
        pf = tk.LabelFrame(parent, text="Add Process", padx=6, pady=6)
        pf.grid(row=1, column=0, sticky="ew", padx=8, pady=4)

        tk.Label(pf, text="Process name:").grid(row=0, column=0, sticky="w")
        self._proc_name_var = tk.StringVar()
        tk.Entry(pf, textvariable=self._proc_name_var, width=26).grid(row=0, column=1, padx=6)
        tk.Button(pf, text="Add Process", command=self._on_add_process).grid(row=0, column=2, padx=4)

        # Treeview showing line structure
        tf = tk.LabelFrame(parent, text="Line Structure (select a process or task, then act below)", padx=6, pady=6)
        tf.grid(row=2, column=0, sticky="nsew", padx=8, pady=4)
        tf.rowconfigure(0, weight=1)
        tf.columnconfigure(0, weight=1)

        self._tree = ttk.Treeview(tf, columns=("info",), height=8)
        self._tree.heading("#0", text="Name")
        self._tree.heading("info", text="Info")
        self._tree.column("#0", width=220, minwidth=120)
        self._tree.column("info", width=180, minwidth=100)
        vsb = ttk.Scrollbar(tf, orient="vertical", command=self._tree.yview)
        self._tree.configure(yscrollcommand=vsb.set)
        self._tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")

        tk.Button(tf, text="Delete Selected", command=self._on_delete_selected).grid(
            row=1, column=0, sticky="w", pady=(6, 0)
        )

        # Add-task row
        atf = tk.LabelFrame(parent, text="Add Task to Selected Process", padx=6, pady=6)
        atf.grid(row=3, column=0, sticky="ew", padx=8, pady=4)

        tk.Label(atf, text="Task name:").grid(row=0, column=0, sticky="w")
        self._task_name_var = tk.StringVar()
        tk.Entry(atf, textvariable=self._task_name_var, width=20).grid(row=0, column=1, padx=6)
        tk.Label(atf, text="Cycles:").grid(row=0, column=2, sticky="w")
        self._task_cycles_var = tk.StringVar(value="1")
        tk.Entry(atf, textvariable=self._task_cycles_var, width=6).grid(row=0, column=3, padx=4)
        tk.Button(atf, text="Add Task", command=self._on_add_task).grid(row=0, column=4, padx=6)

        # Build-line row
        bf = tk.Frame(parent)
        bf.grid(row=4, column=0, sticky="ew", padx=8, pady=8)

        tk.Button(
            bf, text="Build Line", bg="#4a90d9", fg="white",
            font=("TkDefaultFont", 10, "bold"),
            command=self._on_build_line,
        ).pack(side=tk.LEFT)

        self._build_status_lbl = tk.Label(bf, text="Not built yet.", fg="gray50")
        self._build_status_lbl.pack(side=tk.LEFT, padx=12)

    # ── Simulation tab ────────────────────────────────────────────────

    def _build_simulation_tab(self, parent: ttk.Frame) -> None:
        """Build the Simulation tab: controls + scrolled output area."""
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(2, weight=1)

        # Products + start/reset
        cf = tk.LabelFrame(parent, text="Control", padx=6, pady=6)
        cf.grid(row=0, column=0, sticky="ew", padx=8, pady=(8, 4))

        tk.Label(cf, text="Products:").grid(row=0, column=0, sticky="w")
        self._products_var = tk.StringVar(value="5")
        tk.Entry(cf, textvariable=self._products_var, width=6).grid(row=0, column=1, padx=4)
        tk.Button(cf, text="Start", bg="#5cb85c", fg="white",
                  command=self._on_start).grid(row=0, column=2, padx=6)
        tk.Button(cf, text="Reset…", command=self._on_reset).grid(row=0, column=3, padx=4)

        # Step / run / snapshot buttons
        bf = tk.Frame(parent)
        bf.grid(row=1, column=0, sticky="ew", padx=8, pady=4)

        tk.Button(bf, text="Step 1 Cycle",
                  command=self._on_step1).pack(side=tk.LEFT, padx=3)
        tk.Button(bf, text="Step N Cycles…",
                  command=self._on_step_n).pack(side=tk.LEFT, padx=3)
        self._run_btn = tk.Button(
            bf, text="Run to Completion", bg="#d9534f", fg="white",
            command=self._on_run,
        )
        self._run_btn.pack(side=tk.LEFT, padx=3)
        tk.Button(bf, text="Pause / Snapshot",
                  command=self._on_snapshot).pack(side=tk.LEFT, padx=3)

        # Output area
        of = tk.LabelFrame(parent, text="Output", padx=4, pady=4)
        of.grid(row=2, column=0, sticky="nsew", padx=8, pady=4)
        of.rowconfigure(0, weight=1)
        of.columnconfigure(0, weight=1)

        self._output = scrolledtext.ScrolledText(
            of, wrap=tk.WORD, state=tk.DISABLED,
            font=("Courier", 9), bg="#1e1e1e", fg="#d4d4d4",
        )
        self._output.grid(row=0, column=0, sticky="nsew")

    # ── Report tab ────────────────────────────────────────────────────

    def _build_report_tab(self, parent: ttk.Frame) -> None:
        """Build the Report tab: generate button + scrolled text area."""
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(1, weight=1)

        tk.Button(
            parent, text="Generate Report", bg="#4a90d9", fg="white",
            font=("TkDefaultFont", 10, "bold"),
            command=self._on_report,
        ).grid(row=0, column=0, sticky="w", padx=8, pady=8)

        rf = tk.LabelFrame(parent, text="Report", padx=4, pady=4)
        rf.grid(row=1, column=0, sticky="nsew", padx=8, pady=(0, 8))
        rf.rowconfigure(0, weight=1)
        rf.columnconfigure(0, weight=1)

        self._report_text = scrolledtext.ScrolledText(
            rf, wrap=tk.WORD, state=tk.DISABLED,
            font=("Courier", 9),
        )
        self._report_text.grid(row=0, column=0, sticky="nsew")

    # ── Status panel ──────────────────────────────────────────────────

    def _build_status_panel(self, parent: tk.LabelFrame) -> None:
        """Build the always-visible status panel at the bottom of the window."""
        parent.columnconfigure(1, weight=1)

        self._lbl_cycle = tk.Label(parent, text="Cycle: —", font=("TkDefaultFont", 10, "bold"))
        self._lbl_cycle.grid(row=0, column=0, sticky="w", padx=(0, 16))

        self._lbl_done = tk.Label(parent, text="Products: —")
        self._lbl_done.grid(row=0, column=1, sticky="w")

        self._status_text = tk.Text(
            parent, height=4, wrap=tk.WORD,
            font=("Courier", 8), state=tk.DISABLED,
            bg=parent.cget("bg"), relief=tk.FLAT,
        )
        self._status_text.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(4, 0))

    # ------------------------------------------------------------------
    # Configure tab handlers
    # ------------------------------------------------------------------

    def _refresh_tree(self) -> None:
        """Rebuild the Treeview entirely from _config_data."""
        for item in self._tree.get_children():
            self._tree.delete(item)

        n = len(self._config_data)
        for p_idx, (p_name, tasks) in enumerate(self._config_data):
            if n == 1:
                tag = "[INITIAL / FINAL]"
            elif p_idx == 0:
                tag = "[INITIAL]"
            elif p_idx == n - 1:
                tag = "[FINAL]"
            else:
                tag = f"[middle {p_idx + 1}/{n}]"

            p_iid = f"proc_{p_idx}"
            self._tree.insert(
                "", "end", iid=p_iid,
                text=p_name, values=(f"{tag}  ({len(tasks)} task(s))",),
                open=True,
            )
            for t_idx, (t_name, cycles) in enumerate(tasks):
                self._tree.insert(
                    p_iid, "end",
                    iid=f"task_{p_idx}_{t_idx}",
                    text=f"    {t_name}",
                    values=(f"({cycles} cycle(s))",),
                )

    def _on_add_process(self) -> None:
        """Append a new process entry to _config_data and refresh the tree."""
        name = self._proc_name_var.get().strip()
        if not name:
            messagebox.showwarning("Input error", "Process name cannot be empty.")
            return
        self._config_data.append((name, []))
        self._proc_name_var.set("")
        self._refresh_tree()

    def _on_add_task(self) -> None:
        """Add a task to the process that is currently selected in the tree."""
        sel = self._tree.selection()
        if not sel:
            messagebox.showwarning("Selection", "Select a process (or one of its tasks) first.")
            return

        iid = sel[0]
        if iid.startswith("task_"):
            p_idx = int(iid.split("_")[1])
        elif iid.startswith("proc_"):
            p_idx = int(iid.split("_")[1])
        else:
            return

        t_name = self._task_name_var.get().strip()
        if not t_name:
            messagebox.showwarning("Input error", "Task name cannot be empty.")
            return
        try:
            cycles = int(self._task_cycles_var.get().strip())
            if cycles < 1:
                raise ValueError
        except ValueError:
            messagebox.showwarning("Input error", "Cycles must be a positive integer ≥ 1.")
            return

        self._config_data[p_idx][1].append((t_name, cycles))
        self._task_name_var.set("")
        self._task_cycles_var.set("1")
        self._refresh_tree()

    def _on_delete_selected(self) -> None:
        """Remove the selected process or task from _config_data."""
        sel = self._tree.selection()
        if not sel:
            return
        iid = sel[0]
        if iid.startswith("proc_"):
            self._config_data.pop(int(iid.split("_")[1]))
        elif iid.startswith("task_"):
            parts = iid.split("_")
            self._config_data[int(parts[1])][1].pop(int(parts[2]))
        self._refresh_tree()

    def _on_build_line(self) -> None:
        """Commit _config_data to the ProductionLine (creates Process/Task objects)."""
        if not self._config_data:
            messagebox.showwarning("Configure", "Add at least one process first.")
            return
        for p_name, tasks in self._config_data:
            if not tasks:
                messagebox.showwarning(
                    "Configure",
                    f"Process '{p_name}' has no tasks. Every process needs at least one task.",
                )
                return

        self.line.processes = LinkedList()
        for p_name, tasks in self._config_data:
            proc = Process(p_name)
            for t_name, cycles in tasks:
                proc.add_task(Task(t_name, cycles))
            self.line.add_process(proc)
        self.line.link_processes()
        self._line_built = True

        n_proc  = len(self._config_data)
        n_tasks = sum(len(t) for _, t in self._config_data)
        self._build_status_lbl.config(
            text=f"Built: {n_proc} process(es), {n_tasks} task(s). Ready to simulate.",
            fg="green",
        )
        self.refresh_status()

    # ------------------------------------------------------------------
    # Simulation tab handlers
    # ------------------------------------------------------------------

    def _on_start(self) -> None:
        """Start a new simulation run with the configured product count."""
        if not self._line_built:
            messagebox.showwarning("Simulate", "Build the production line first (Configure tab → Build Line).")
            return
        try:
            n = int(self._products_var.get().strip())
            if n < 1:
                raise ValueError
        except ValueError:
            messagebox.showwarning("Input error", "Products must be a positive integer ≥ 1.")
            return
        self._running = False
        self.line.start(n)
        self._append_output(f"=== Simulation started: {n} product(s), {len(self._config_data)} process(es) ===")
        self.refresh_status()

    def _on_step1(self) -> None:
        """Advance the simulation by exactly one cycle."""
        if not self.line.is_running:
            messagebox.showwarning("Simulate", "Start the simulation first (Products + Start).")
            return
        if self.line.is_complete():
            self._append_output(f"[Cycle {self.line.current_cycle}] All products already completed.")
            return
        self.line.tick()
        done, total = len(self.line.completed_products), self.line.num_products
        self._append_output(f"[Cycle {self.line.current_cycle}]  Products done: {done} / {total}")
        self.refresh_status()

    def _on_step_n(self) -> None:
        """Ask the user for N and advance N cycles, logging each one."""
        if not self.line.is_running:
            messagebox.showwarning("Simulate", "Start the simulation first.")
            return
        n = simpledialog.askinteger(
            "Step N Cycles", "How many cycles to advance?",
            minvalue=1, parent=self.root,
        )
        if n is None:
            return
        for _ in range(n):
            if self.line.is_complete():
                break
            self.line.tick()
            done, total = len(self.line.completed_products), self.line.num_products
            self._append_output(f"[Cycle {self.line.current_cycle}]  Products done: {done} / {total}")
        self.refresh_status()

    def _on_run(self) -> None:
        """Start the non-blocking 'run to completion' loop, or stop it if already running."""
        if self._running:
            # Toggle: stop the loop
            self._running = False
            self._run_btn.config(text="Run to Completion", bg="#d9534f")
            return
        if not self.line.is_running:
            messagebox.showwarning("Simulate", "Start the simulation first.")
            return
        if self.line.is_complete():
            self._append_output(f"Simulation already complete at cycle {self.line.current_cycle}.")
            return
        self._running = True
        self._run_btn.config(text="Stop", bg="#e8a838")
        self.root.after(1, self._run_tick)

    def _run_tick(self) -> None:
        """Execute one tick, update UI, then schedule the next tick via after()."""
        if not self._running:
            return
        if self.line.is_complete():
            self._running = False
            self._run_btn.config(text="Run to Completion", bg="#d9534f")
            done = len(self.line.completed_products)
            self._append_output(
                f"=== All {done} product(s) completed at cycle {self.line.current_cycle} ==="
            )
            self.refresh_status()
            return
        self.line.tick()
        done, total = len(self.line.completed_products), self.line.num_products
        self._append_output(f"[Cycle {self.line.current_cycle}]  Products done: {done} / {total}")
        self.refresh_status()
        self.root.after(1, self._run_tick)

    def _on_snapshot(self) -> None:
        """Pause the simulation, display a snapshot in the output area, then resume."""
        if not self.line.is_running:
            messagebox.showwarning("Simulate", "Start the simulation first.")
            return
        self.line.pause()
        self._append_output(strip_ansi(self.line.get_snapshot()))
        self.line.resume()

    def _on_reset(self) -> None:
        """Ask for a new product count and reset the simulation from cycle 0."""
        if not self.line.is_running:
            messagebox.showwarning("Simulate", "Start the simulation first.")
            return
        self._running = False
        self._run_btn.config(text="Run to Completion", bg="#d9534f")
        n = simpledialog.askinteger(
            "Reset", "Products for the new run?",
            minvalue=1, parent=self.root,
        )
        if n is None:
            return
        self.line.reset(n)
        self._clear_output()
        self._append_output(f"=== Simulation reset: {n} product(s), starting from cycle 0 ===")
        self.refresh_status()

    # ------------------------------------------------------------------
    # Report tab handlers
    # ------------------------------------------------------------------

    def _on_report(self) -> None:
        """Generate and display the statistical report."""
        if not self.line.is_running:
            messagebox.showwarning("Report", "No simulation data yet. Start and run first.")
            return
        text = strip_ansi(self.line.generate_report())
        self._report_text.config(state=tk.NORMAL)
        self._report_text.delete("1.0", tk.END)
        self._report_text.insert(tk.END, text)
        self._report_text.config(state=tk.DISABLED)
        self._report_text.see(tk.END)

    # ------------------------------------------------------------------
    # Status panel
    # ------------------------------------------------------------------

    def refresh_status(self) -> None:
        """Refresh the always-visible bottom panel with current simulation state."""
        self._lbl_cycle.config(text=f"Cycle: {self.line.current_cycle}")
        done  = len(self.line.completed_products)
        total = self.line.num_products
        self._lbl_done.config(text=f"Products done: {done} / {total}")

        lines: List[str] = []
        for proc in self.line.processes:           # LinkedList iterator
            summaries: List[str] = []
            for task in proc.tasks:                # LinkedList iterator
                if task.is_busy and task.current_product:
                    s = (
                        f"{task.name}: BUSY {task.current_product} "
                        f"({task.cycles_remaining}rem) q={len(task.queue)}"
                    )
                else:
                    s = f"{task.name}: idle q={len(task.queue)}"
                summaries.append(s)
            flag = ""
            if proc.is_initial:
                flag = " [INIT]"
            elif proc.is_final:
                flag = " [FINAL]"
            lines.append(f"{proc.name}{flag}: " + "  |  ".join(summaries))

        self._status_text.config(state=tk.NORMAL)
        self._status_text.delete("1.0", tk.END)
        self._status_text.insert(tk.END, "\n".join(lines) if lines else "(no line configured)")
        self._status_text.config(state=tk.DISABLED)

    # ------------------------------------------------------------------
    # Output helpers
    # ------------------------------------------------------------------

    def _append_output(self, text: str) -> None:
        """Append a line of text to the simulation output area and scroll to end."""
        self._output.config(state=tk.NORMAL)
        self._output.insert(tk.END, text + "\n")
        self._output.config(state=tk.DISABLED)
        self._output.see(tk.END)

    def _clear_output(self) -> None:
        """Clear the simulation output area."""
        self._output.config(state=tk.NORMAL)
        self._output.delete("1.0", tk.END)
        self._output.config(state=tk.DISABLED)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    """Launch the LinProd GUI application."""
    root = tk.Tk()
    LinProdApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
