"""Google Sheets access layer.

All public methods are async and delegate to synchronous gspread calls via
asyncio.to_thread to avoid blocking the event loop.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import gspread
from google.oauth2.service_account import Credentials

from config import settings
from models import CompletedGame, ParticipantResult, Player

logger = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

TAB_PLAYERS = "Players"
TAB_GAMES = "Games"
TAB_PARTICIPANTS = "GameParticipants"

PLAYERS_HEADERS = [
    "telegram_username",
    "display_name",
    "games_played",
    "total_score",
    "wins",
    "losses",
    "mafia_games",
    "citizen_games",
    "sheriff_games",
    "doctor_games",
    "don_games",
    "beauty_games",
    "maniac_games",
    "created_at",
    "updated_at",
]

GAMES_HEADERS = [
    "game_id",
    "played_at",
    "moderator_chat_id",
    "winner_side",
    "player_count",
    "roles_used",
    "notes",
]

PARTICIPANTS_HEADERS = [
    "game_id",
    "telegram_username",
    "display_name",
    "role",
    "side",
    "is_alive_end",
    "score_delta",
    "won",
    "created_at",
]

# Maps role name to the corresponding column name in Players sheet
ROLE_STAT_COLUMN: dict[str, str] = {
    "citizen": "citizen_games",
    "mafia": "mafia_games",
    "don": "don_games",
    "sheriff": "sheriff_games",
    "doctor": "doctor_games",
    "beauty": "beauty_games",
    "maniac": "maniac_games",
}


class SheetsClient:
    def __init__(self) -> None:
        creds = Credentials.from_service_account_file(
            settings.google_service_account_json_path, scopes=SCOPES
        )
        self._gc = gspread.authorize(creds)
        self._spreadsheet: Optional[gspread.Spreadsheet] = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_spreadsheet(self) -> gspread.Spreadsheet:
        if self._spreadsheet is None:
            self._spreadsheet = self._gc.open_by_key(settings.google_spreadsheet_id)
        return self._spreadsheet

    def _ws(self, name: str) -> gspread.Worksheet:
        return self._get_spreadsheet().worksheet(name)

    # ------------------------------------------------------------------
    # Players
    # ------------------------------------------------------------------

    def _sync_get_all_players(self) -> list[Player]:
        records = self._ws(TAB_PLAYERS).get_all_records()
        players = []
        for r in records:
            try:
                players.append(Player(**r))
            except Exception as e:
                logger.warning("Skipping invalid player row: %s — %s", r, e)
        return players

    async def get_all_players(self) -> list[Player]:
        return await asyncio.to_thread(self._sync_get_all_players)

    def _sync_get_player(self, username: str) -> Optional[Player]:
        try:
            cell = self._ws(TAB_PLAYERS).find(username, in_column=1)
        except gspread.exceptions.CellNotFound:
            return None
        if cell is None:
            return None
        row_values = self._ws(TAB_PLAYERS).row_values(cell.row)
        data = dict(zip(PLAYERS_HEADERS, row_values))
        try:
            return Player(**data)
        except Exception as e:
            logger.warning("Could not parse player row for %s: %s", username, e)
            return None

    async def get_player(self, username: str) -> Optional[Player]:
        return await asyncio.to_thread(self._sync_get_player, username)

    def _sync_upsert_player(self, player: Player) -> None:
        ws = self._ws(TAB_PLAYERS)
        try:
            cell = ws.find(player.telegram_username, in_column=1)
        except gspread.exceptions.CellNotFound:
            cell = None

        row_data = [
            player.telegram_username,
            player.display_name,
            player.games_played,
            player.total_score,
            player.wins,
            player.losses,
            player.mafia_games,
            player.citizen_games,
            player.sheriff_games,
            player.doctor_games,
            player.don_games,
            player.beauty_games,
            player.maniac_games,
            player.created_at,
            player.updated_at,
        ]

        if cell is None:
            ws.append_row(row_data, value_input_option="USER_ENTERED")
        else:
            end_col = chr(64 + len(row_data))  # e.g., 15 columns -> 'O'
            ws.update(
                f"A{cell.row}:{end_col}{cell.row}",
                [row_data],
                value_input_option="USER_ENTERED",
            )

    async def upsert_player(self, player: Player) -> None:
        await asyncio.to_thread(self._sync_upsert_player, player)

    def _sync_add_new_player(self, username: str, display_name: str) -> Player:
        now = datetime.now(timezone.utc).isoformat()
        player = Player(
            telegram_username=username,
            display_name=display_name,
            created_at=now,
            updated_at=now,
        )
        self._sync_upsert_player(player)
        return player

    async def add_new_player(self, username: str, display_name: str) -> Player:
        return await asyncio.to_thread(self._sync_add_new_player, username, display_name)

    # ------------------------------------------------------------------
    # Game commit — called once when the game finishes
    # ------------------------------------------------------------------

    def _sync_commit_game(
        self,
        game: CompletedGame,
        participants: list[ParticipantResult],
    ) -> None:
        # 1. Append game row
        games_ws = self._ws(TAB_GAMES)
        games_ws.append_row(
            [
                game.game_id,
                game.played_at,
                game.moderator_chat_id,
                game.winner_side,
                game.player_count,
                game.roles_used,
                game.notes,
            ],
            value_input_option="USER_ENTERED",
        )

        # 2. Append participant rows (one batch call)
        if participants:
            part_ws = self._ws(TAB_PARTICIPANTS)
            rows = [
                [
                    p.game_id,
                    p.telegram_username,
                    p.display_name,
                    p.role,
                    p.side,
                    p.is_alive_end,
                    p.score_delta,
                    p.won,
                    p.created_at,
                ]
                for p in participants
            ]
            part_ws.append_rows(rows, value_input_option="USER_ENTERED")

        # 3. Update cumulative player stats
        players_ws = self._ws(TAB_PLAYERS)
        all_records = players_ws.get_all_records()
        # Map username -> 1-based row index (row 1 is the header)
        username_to_row = {
            r["telegram_username"]: i + 2 for i, r in enumerate(all_records)
        }
        col_index = {h: i + 1 for i, h in enumerate(PLAYERS_HEADERS)}
        now_iso = datetime.now(timezone.utc).isoformat()

        for p in participants:
            row_num = username_to_row.get(p.telegram_username)
            if row_num is None:
                logger.warning("Player %s not found in sheet for stat update", p.telegram_username)
                continue

            rec = all_records[row_num - 2]
            role_col = ROLE_STAT_COLUMN.get(p.role, "citizen_games")

            updates = {
                "total_score": round(float(rec.get("total_score", 0)) + p.score_delta, 2),
                "games_played": int(rec.get("games_played", 0)) + 1,
                "wins": int(rec.get("wins", 0)) + (1 if p.won else 0),
                "losses": int(rec.get("losses", 0)) + (0 if p.won else 1),
                role_col: int(rec.get(role_col, 0)) + 1,
                "updated_at": now_iso,
            }

            # Build batch update payload
            cell_updates = []
            for field_name, value in updates.items():
                col = col_index[field_name]
                # gspread range notation: e.g. "D5"
                cell_updates.append(
                    {
                        "range": f"{_col_letter(col)}{row_num}",
                        "values": [[value]],
                    }
                )

            players_ws.batch_update(cell_updates, value_input_option="USER_ENTERED")

    async def commit_game(
        self,
        game: CompletedGame,
        participants: list[ParticipantResult],
    ) -> None:
        await asyncio.to_thread(self._sync_commit_game, game, participants)

    # ------------------------------------------------------------------
    # Leaderboard
    # ------------------------------------------------------------------

    def _sync_get_leaderboard(self, top_n: int = 10) -> list[Player]:
        players = self._sync_get_all_players()
        return sorted(players, key=lambda p: p.total_score, reverse=True)[:top_n]

    async def get_leaderboard(self, top_n: int = 10) -> list[Player]:
        return await asyncio.to_thread(self._sync_get_leaderboard, top_n)

    # ------------------------------------------------------------------
    # Sheet initialisation helper
    # ------------------------------------------------------------------

    def _sync_ensure_sheets(self) -> None:
        """Create missing tabs with header rows. Safe to call on startup."""
        spreadsheet = self._get_spreadsheet()
        existing = {ws.title for ws in spreadsheet.worksheets()}

        def _init_tab(name: str, headers: list[str]) -> None:
            if name not in existing:
                ws = spreadsheet.add_worksheet(title=name, rows=1000, cols=len(headers))
                ws.append_row(headers)
                logger.info("Created sheet tab: %s", name)

        _init_tab(TAB_PLAYERS, PLAYERS_HEADERS)
        _init_tab(TAB_GAMES, GAMES_HEADERS)
        _init_tab(TAB_PARTICIPANTS, PARTICIPANTS_HEADERS)

    async def ensure_sheets(self) -> None:
        """Ensure required tabs exist. Call once on bot startup."""
        await asyncio.to_thread(self._sync_ensure_sheets)


def _col_letter(col: int) -> str:
    """Convert a 1-based column index to a spreadsheet column letter (A, B, ..., Z, AA, ...)."""
    result = ""
    while col > 0:
        col, remainder = divmod(col - 1, 26)
        result = chr(65 + remainder) + result
    return result
