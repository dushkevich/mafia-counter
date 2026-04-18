"""Single source of truth for role definitions, side mappings, and display labels."""

import random

ROLE_SIDES: dict[str, str] = {
    "citizen": "citizens",
    "sheriff": "citizens",
    "doctor": "citizens",
    "beauty": "citizens",
    "bodyguard": "citizens",
    "prosecutor": "citizens",
    "con_artist": "citizens",
    "thief": "citizens",
    "mafia": "mafia",
    "don": "mafia",
    "judge": "mafia",
    "maniac": "maniac",
}

# Human-readable labels (Russian, as is common for this game)
ROLE_LABELS: dict[str, str] = {
    "citizen": "Мирный",
    "mafia": "Мафия",
    "don": "Дон",
    "sheriff": "Шериф",
    "doctor": "Доктор",
    "beauty": "Красавица",
    "maniac": "Маньяк",
    "judge": "Судья",
    "bodyguard": "Телохранитель",
    "prosecutor": "Прокурор",
    "con_artist": "Аферист",
    "thief": "Вор",
}

# Roles limited to at most 1 per game
SINGLETON_ROLES: set[str] = {
    "don", "sheriff", "doctor", "beauty", "maniac",
    "judge", "bodyguard", "prosecutor", "con_artist", "thief",
}

# Display order for role setup buttons
ROLE_ORDER: list[str] = [
    "citizen",
    "mafia",
    "don",
    "judge",
    "sheriff",
    "doctor",
    "beauty",
    "bodyguard",
    "prosecutor",
    "con_artist",
    "thief",
    "maniac",
]

# Which sides can win
WINNER_SIDES: list[str] = ["citizens", "mafia", "maniac"]

WINNER_LABELS: dict[str, str] = {
    "citizens": "Мирные",
    "mafia": "Мафия",
    "maniac": "Маньяк",
}


def get_side(role: str) -> str:
    """Return the winning side for a given role."""
    return ROLE_SIDES[role]


def build_role_pool(counts: dict[str, int]) -> list[str]:
    """Expand a role-count dict into a shuffled flat list of role strings.

    Example: {"citizen": 3, "mafia": 1} -> ["mafia", "citizen", "citizen", "citizen"]
    """
    pool: list[str] = []
    for role, count in counts.items():
        pool.extend([role] * count)
    random.shuffle(pool)
    return pool


def get_remaining_pool(role_pool: list[str], assigned: dict[str, str]) -> list[str]:
    """Return the roles still available in the pool after subtracting assigned ones.

    Handles duplicates correctly (e.g., 3 citizens → removes one per assignment).
    """
    remaining = list(role_pool)
    for role in assigned.values():
        remaining.remove(role)
    return remaining


def unique_roles_in_pool(remaining: list[str]) -> list[str]:
    """Return unique roles preserving order, for display as buttons."""
    seen: set[str] = set()
    result: list[str] = []
    for r in remaining:
        if r not in seen:
            seen.add(r)
            result.append(r)
    return result
