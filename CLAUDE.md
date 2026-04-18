# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the bot

```bash
cd mafia-counter
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in TELEGRAM_BOT_TOKEN, GOOGLE_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON_PATH
python bot.py
```

There are no tests or linter configs in this project.

## Architecture

**Entry point:** `bot.py` builds the `Application`, registers handlers, and sets `state.sheets_client` (a module-level singleton in `state.py` so handlers can import it without circular-importing `bot`).

**ConversationHandler flow** (`handlers/newgame.py`): multi-step inline-keyboard wizard with states:
`ASK_PLAYER_COUNT → SELECT_PLAYERS → ADD_PLAYER_USERNAME → ADD_PLAYER_NAME → SETUP_ROLES → ASSIGN_ROLES → FINISH_GAME`

In-flight game data lives in `context.chat_data["session"]` as a plain `dict` (serialised from `GameSession` via `model_dump()`). Read it back with `GameSession(**context.chat_data["session"])`.

**Persistence layer** (`sheets.py`): `SheetsClient` wraps synchronous `gspread` calls in `asyncio.to_thread`. All public methods are `async`. Tabs (`Players`, `Games`, `GameParticipants`) are created automatically on first startup via `ensure_sheets()`.

**Scoring** (`scoring.py`): isolated module — `compute_score(role, won) → float`. Formula: `0.2 (participation) + WIN_BONUS[role]` on win, `0.0` loss bonus for all roles. To add per-action bonuses, extend `compute_score` here and call it from `_commit_game_results` in `handlers/newgame.py`.

**Key constraint:** `concurrent_updates=False` on the `Application` is required for `ConversationHandler` correctness — do not change this.
