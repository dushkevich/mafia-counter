"""Shared application state — imported by both bot.py and handlers.

Using a dedicated module avoids the __main__ vs 'bot' module split that
occurs when python bot.py is run directly and handlers do `import bot`.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sheets import SheetsClient

sheets_client: "SheetsClient | None" = None
