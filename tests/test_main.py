from linprod.main import Application


def test_application_starts() -> None:
    app = Application()
    message = app.start()
    assert "LinProd started in" in message
