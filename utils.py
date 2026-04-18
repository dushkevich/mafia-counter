"""General-purpose helper functions."""

import uuid
from telegram import InlineKeyboardButton


def generate_game_id() -> str:
    """Generate a short, unique game ID."""
    return str(uuid.uuid4())[:8].upper()


def paginate(items: list, page: int, page_size: int = 8) -> tuple[list, int, int]:
    """Return (page_items, total_pages, clamped_page).

    page is 0-indexed. Clamps page to valid range automatically.
    """
    total = len(items)
    total_pages = max(1, (total + page_size - 1) // page_size)
    page = max(0, min(page, total_pages - 1))
    start = page * page_size
    return items[start : start + page_size], total_pages, page


def chunk_buttons(
    buttons: list[InlineKeyboardButton], columns: int = 2
) -> list[list[InlineKeyboardButton]]:
    """Split a flat list of buttons into rows of `columns` buttons each."""
    return [buttons[i : i + columns] for i in range(0, len(buttons), columns)]


def normalize_username(username: str) -> str:
    """Normalize a Telegram username: strip spaces, remove leading @, lowercase."""
    return username.strip().lstrip("@").lower()


def format_score(score: float) -> str:
    """Format a score for display, stripping trailing zeros."""
    return f"{score:.1f}".rstrip("0").rstrip(".")
