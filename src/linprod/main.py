"""Application entrypoint for LinProd."""

from linprod.config import load_config


class Application:
    def __init__(self) -> None:
        self.config = load_config()

    def start(self) -> str:
        mode = "DEBUG" if self.config.debug else "STANDARD"
        message = f"LinProd started in {self.config.environment} ({mode}) mode"
        print(message)
        return message



def run() -> None:
    app = Application()
    app.start()


if __name__ == "__main__":
    run()
