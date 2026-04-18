"""Scoring configuration and calculation.

Score = SCORE_TABLE[role][winner_side][is_alive] + adjustment
Adjustment captures moderator-entered bonuses (+) and penalties (−).
"""

from roles import ROLE_SIDES

# SCORE_TABLE[role][winner_side][is_alive: bool]
SCORE_TABLE: dict[str, dict[str, dict[bool, float]]] = {
    "citizen":    {"citizens": {True: 1.0, False: 0.5}, "mafia": {True: 0.0, False: 0.0}, "maniac": {True: 0.0, False: 0.0}},
    "sheriff":    {"citizens": {True: 2.0, False: 1.0}, "mafia": {True: 0.0, False: 0.0}, "maniac": {True: 0.0, False: 0.0}},
    "doctor":     {"citizens": {True: 2.0, False: 1.0}, "mafia": {True: 0.0, False: 0.0}, "maniac": {True: 0.0, False: 0.0}},
    "beauty":     {"citizens": {True: 2.0, False: 1.0}, "mafia": {True: 0.0, False: 0.0}, "maniac": {True: 0.0, False: 0.0}},
    "bodyguard":  {"citizens": {True: 1.0, False: 1.0}, "mafia": {True: 0.0, False: 0.0}, "maniac": {True: 0.0, False: 0.0}},
    "prosecutor": {"citizens": {True: 1.0, False: 0.5}, "mafia": {True: 0.0, False: 0.0}, "maniac": {True: 0.0, False: 0.0}},
    "con_artist": {"citizens": {True: 1.0, False: 0.5}, "mafia": {True: 0.0, False: 0.0}, "maniac": {True: 0.0, False: 0.0}},
    "thief":      {"citizens": {True: 1.0, False: 0.5}, "mafia": {True: 0.0, False: 0.0}, "maniac": {True: 0.0, False: 0.0}},
    "mafia":      {"citizens": {True: 0.0, False: 0.0}, "mafia": {True: 2.0, False: 1.5}, "maniac": {True: 0.0, False: 0.0}},
    "don":        {"citizens": {True: 0.0, False: 0.0}, "mafia": {True: 2.0, False: 1.5}, "maniac": {True: 0.0, False: 0.0}},
    "judge":      {"citizens": {True: 0.0, False: 0.0}, "mafia": {True: 2.0, False: 1.0}, "maniac": {True: 0.0, False: 0.0}},
    "maniac":     {"citizens": {True: 0.0, False: 0.0}, "mafia": {True: 0.0, False: 0.0}, "maniac": {True: 2.0, False: 2.0}},
}


def did_win(role: str, winner_side: str) -> bool:
    return ROLE_SIDES[role] == winner_side


def compute_score(role: str, winner_side: str, is_alive: bool, adjustment: float = 0.0) -> float:
    base = SCORE_TABLE[role][winner_side][is_alive]
    return round(base + adjustment, 2)
