import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import HTTPException


ERROR_CODES_PATH = Path(__file__).parent / "error_codes.json"


@lru_cache
def get_error_codes() -> dict[str, dict[str, Any]]:
    with open(ERROR_CODES_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def build_error(error_key: str, details: dict[str, Any] | None = None) -> tuple[dict[str, Any], int]:
    error_codes = get_error_codes()
    error = error_codes.get(error_key, error_codes["COMMON_002"])
    return {
        "error": {
            "code": error["code"],
            "message": error["message"],
            "details": details or {},
        }
    }, error["http_status"]


def api_error(error_key: str, details: dict[str, Any] | None = None) -> HTTPException:
    response, status_code = build_error(error_key, details)
    return HTTPException(status_code=status_code, detail=response)
