from linprod.reporting import ProductionReport


def test_production_report_holds_metrics() -> None:
    report = ProductionReport(
        first_product_finish_time=10,
        last_product_finish_time=28,
        average_completion_time=19.5,
        bottleneck_process="Process B",
        average_waiting_time=3.25,
        max_waiting_process="Process C",
        max_waiting_task="Task 2",
        total_processing_time=45,
        extra_statistics={"products_completed": 8},
    )

    assert report.total_elapsed_time == 18
    data = report.as_dict()
    assert data["bottleneck_process"] == "Process B"
    assert data["extra_statistics"]["products_completed"] == 8


def test_production_report_rejects_invalid_times() -> None:
    try:
        ProductionReport(
            first_product_finish_time=12,
            last_product_finish_time=8,
            average_completion_time=10.0,
            bottleneck_process="Process A",
            average_waiting_time=1.0,
            max_waiting_process="Process A",
            max_waiting_task="Task 1",
            total_processing_time=20,
        )
    except ValueError as exc:
        assert "last_product_finish_time" in str(exc)
    else:
        raise AssertionError("Expected ValueError for invalid report times")
