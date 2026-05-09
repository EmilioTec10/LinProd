from linprod.domain import Product, Queue, Task, Process, ProductionLine
import pytest


def test_queue_behaves_fifo() -> None:
    queue = Queue()
    first = Product("p1")
    second = Product("p2")

    queue.enqueue(first)
    queue.enqueue(second)

    assert queue.size() == 2
    assert queue.dequeue() is first
    assert queue.dequeue() is second


def test_task_finishes_and_starts_waiting_product() -> None:
    task = Task(name="Cutting", processing_time=3)
    first = Product("p1")
    second = Product("p2")

    task.start_processing(first, current_time=5)
    task.start_processing(second, current_time=6)

    assert task.busy is True
    assert task.current_product is first
    assert task.waiting_queue.size() == 1

    finished = task.finish_processing(current_time=8)

    assert finished is first
    assert first.finish_time == 8
    assert first.status == "finished"
    assert task.current_product is second
    assert second.start_time == 8
    assert second.status == "processing"


def test_process_and_line_linking() -> None:
    process_a = Process(name="Process A")
    process_b = Process(name="Process B")
    process_c = Process(name="Process C")
    task_a = Task(name="Task A", processing_time=2)
    task_b = Task(name="Task B", processing_time=4)

    process_a.add_task(task_a)
    process_a.add_task(task_b)

    assert process_a.get_next_task() is task_a
    assert process_a.get_next_task(task_a) is task_b
    assert process_a.get_next_task(task_b) is None

    line = ProductionLine(name="Main line")
    line.add_process(process_a)
    line.add_process(process_b)
    line.add_process(process_c)
    line.set_initial_process(process_a)
    line.set_final_process(process_c)
    line.link_process(process_a, process_b)
    line.link_process(process_b, process_c)

    assert line.initial_process is process_a
    assert line.final_process is process_c
    assert process_a.is_initial is True
    assert process_c.is_final is True
    assert process_b.input_process is process_a
    assert process_c.input_process is process_b

    line.reset_line()

    assert line.initial_process is None
    assert line.final_process is None
    assert process_a.is_initial is False
    assert process_c.is_final is False
    assert process_b.input_process is None


def test_replacing_initial_and_final_process_clears_previous_flags() -> None:
    process_a = Process(name="Process A")
    process_b = Process(name="Process B")
    process_c = Process(name="Process C")

    line = ProductionLine(name="Main line")
    line.add_process(process_a)
    line.add_process(process_b)
    line.add_process(process_c)

    line.set_initial_process(process_a)
    line.set_initial_process(process_b)

    assert line.initial_process is process_b
    assert process_a.is_initial is False
    assert process_b.is_initial is True

    line.set_final_process(process_c)
    line.set_final_process(process_a)

    assert line.final_process is process_a
    assert process_c.is_final is False
    assert process_a.is_final is True


def test_process_cannot_be_both_initial_and_final() -> None:
    process_a = Process(name="Process A")
    process_b = Process(name="Process B")
    line = ProductionLine(name="Main line")
    line.add_process(process_a)
    line.add_process(process_b)

    line.set_initial_process(process_a)
    with pytest.raises(ValueError):
        line.set_final_process(process_a)

    line.set_final_process(process_b)
    with pytest.raises(ValueError):
        line.set_initial_process(process_b)
