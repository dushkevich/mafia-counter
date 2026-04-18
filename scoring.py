"""Scoring configuration and calculation.

All scoring rules live in this module. To extend scoring (e.g., sheriff bonus for
successful check, doctor bonus for saving a life), add new parameters here and
pass them into compute_score() from the handler that resolves night actions.
"""

from roles import get_side

# Awarded to every participant regardless of win/loss
BASE_PARTICIPATION: float = 0.2

# Awarded on top of BASE_PARTICIPATION when the player's side wins
WIN_BONUS: dict[str, float] = {
    "citizen": 1.0,
    "mafia": 1.5,
    "don": 1.7,
    "sheriff": 1.2,
    "doctor": 1.2,
    "beauty": 1.1,
    "maniac": 2.0,
}

# Awarded on top of BASE_PARTICIPATION on loss (currently 0 for all)
LOSS_BONUS: dict[str, float] = {role: 0.0 for role in WIN_BONUS}

# Placeholder for future per-action bonuses.
# Example extension:
#   SHERIFF_CHECK_BONUS = 0.3   # per successful check
#   DOCTOR_SAVE_BONUS   = 0.5   # per successful save
#   BEAUTY_INFLUENCE_BONUS = 0.2


def did_win(role: str, winner_side: str) -> bool:
    """Return True if this role is on the winning side."""
    return get_side(role) == winner_side


def compute_score(role: str, won: bool) -> float:
    """Calculate total score delta for one participant.

    Formula: BASE_PARTICIPATION + (WIN_BONUS if won else LOSS_BONUS)

    Future extension: accept optional keyword args for night-action bonuses.
    """
    bonus = WIN_BONUS[role] if won else LOSS_BONUS[role]
    return round(BASE_PARTICIPATION + bonus, 2)
