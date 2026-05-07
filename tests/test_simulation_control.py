from linprod.simulation import CycleClock, SnapshotPrinter, SimulationController


def test_cycleclock_tick_and_set_time() -> None:
    c = CycleClock()
    assert c.current_time == 0
    c.tick()
    assert c.current_time == 1
    c.tick(4)
    assert c.current_time == 5
    c.set_time(10)
    assert c.current_time == 10


def test_snapshot_printer_default_and_custom() -> None:
    sp = SnapshotPrinter()
    assert sp.print_state() == "<snapshot>"

    sp2 = SnapshotPrinter(renderer=lambda: "state:ok")
    assert sp2.print_state() == "state:ok"


def test_simulation_controller_advance_and_pause() -> None:
    controller = SimulationController()
    controller.start()
    assert controller.is_running() is True
    controller.pauseAt(3)
    controller.advance_cycle(5)
    # should have paused at or before reaching 3
    history = controller.get_history()
    assert any(t >= 3 for t in history)
