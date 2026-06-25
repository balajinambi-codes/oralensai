"""Image validation and decoding utilities."""

from __future__ import annotations

import base64
import imghdr
from typing import Final

ALLOWED_CONTENT_TYPES: Final[frozenset[str]] = frozenset(
    {"image/jpeg", "image/png", "image/jpg"}
)
MAX_FILE_SIZE_BYTES: Final[int] = 10 * 1024 * 1024


def validate_content_type(content_type: str | None) -> None:
    """Raise ValueError when the uploaded file is not JPEG or PNG."""
    if content_type is None or content_type.split(";")[0].strip().lower() not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Invalid file type. Only JPEG and PNG images are supported.")


def validate_file_size(size_bytes: int) -> None:
    """Raise ValueError when the uploaded file exceeds the size limit."""
    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise ValueError("File too large. Maximum allowed size is 10 MB.")


def validate_image_bytes(image_bytes: bytes) -> None:
    """Raise ValueError when bytes do not represent a valid image."""
    if not image_bytes:
        raise ValueError("Empty file uploaded.")

    image_kind = imghdr.what(None, h=image_bytes)
    if image_kind not in {"jpeg", "png"}:
        raise ValueError("Invalid or corrupted image file.")


def decode_base64_image(data: str) -> bytes:
    """Decode a base64-encoded image string, stripping optional data-URI prefix."""
    if "," in data and data.strip().startswith("data:"):
        _, encoded = data.split(",", 1)
    else:
        encoded = data

    try:
        image_bytes = base64.b64decode(encoded, validate=True)
    except (ValueError, base64.binascii.Error) as exc:
        raise ValueError("Invalid base64 image data.") from exc

    validate_image_bytes(image_bytes)
    return image_bytes
