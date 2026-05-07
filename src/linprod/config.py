"""Configuration utilities for LinProd."""

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class AppConfig:
    environment: str = "development"
    debug: bool = True



def _parse_bool(value: str, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}



def load_config() -> AppConfig:
    env = os.getenv("LINPROD_ENV", "development")
    debug = _parse_bool(os.getenv("LINPROD_DEBUG"), default=(env != "production"))
    return AppConfig(environment=env, debug=debug)
