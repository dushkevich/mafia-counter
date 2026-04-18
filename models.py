from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Side(str, Enum):
    CITIZENS = "citizens"
    MAFIA = "mafia"
    MANIAC = "maniac"


class Role(str, Enum):
    CITIZEN = "citizen"
    MAFIA = "mafia"
    DON = "don"
    SHERIFF = "sheriff"
    DOCTOR = "doctor"
    BEAUTY = "beauty"
    MANIAC = "maniac"


class Player(BaseModel):
    telegram_username: str
    display_name: str
    games_played: int = 0
    total_score: float = 0.0
    wins: int = 0
    losses: int = 0
    mafia_games: int = 0
    citizen_games: int = 0
    sheriff_games: int = 0
    doctor_games: int = 0
    don_games: int = 0
    beauty_games: int = 0
    maniac_games: int = 0
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: utcnow().isoformat())


class GameSession(BaseModel):
    """Mutable in-memory state for one game in progress.

    Stored as a plain dict in context.chat_data["session"] via model_dump()
    to allow easy mutation during the conversation flow.
    """

    chat_id: int
    moderator_id: int
    player_count: int = 0

    # Phase: player selection
    selected_usernames: list[str] = Field(default_factory=list)
    players_page: int = 0

    # Phase: role setup
    role_counts: dict[str, int] = Field(default_factory=dict)

    # Phase: role assignment
    role_pool: list[str] = Field(default_factory=list)
    assigned: dict[str, str] = Field(default_factory=dict)  # username -> role
    assignment_index: int = 0

    # Outcome
    winner_side: Optional[str] = None
    game_id: Optional[str] = None


class ParticipantResult(BaseModel, frozen=True):
    game_id: str
    telegram_username: str
    display_name: str
    role: str
    side: str
    is_alive_end: bool = True
    score_delta: float
    won: bool
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())


class CompletedGame(BaseModel, frozen=True):
    game_id: str
    played_at: str
    moderator_chat_id: int
    winner_side: str
    player_count: int
    roles_used: str  # JSON string of role_counts dict
    notes: str = ""
