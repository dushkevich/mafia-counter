"""ConversationHandler for /newgame — the core game flow.

States (in order):
    ASK_PLAYER_COUNT   — choose number of players
    SELECT_PLAYERS     — pick players from the Google Sheets list
    ADD_PLAYER_USERNAME — enter username for a new player
    ADD_PLAYER_NAME    — enter display name for a new player
    SETUP_ROLES        — set how many of each role are in this game
    ASSIGN_ROLES       — assign a role from the pool to each player
    FINISH_GAME        — choose the winning side; persist results
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Union

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Message, Update
from telegram.ext import ContextTypes, ConversationHandler

import state
from models import CompletedGame, GameSession, ParticipantResult
from roles import (
    ROLE_LABELS,
    ROLE_ORDER,
    SINGLETON_ROLES,
    WINNER_LABELS,
    build_role_pool,
    get_remaining_pool,
    get_side,
    unique_roles_in_pool,
)
from scoring import compute_score, did_win
from utils import chunk_buttons, generate_game_id, normalize_username, paginate

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# State constants
# ---------------------------------------------------------------------------

(
    ASK_PLAYER_COUNT,
    SELECT_PLAYERS,
    ADD_PLAYER_USERNAME,
    ADD_PLAYER_NAME,
    SETUP_ROLES,
    ASSIGN_ROLES,
    FINISH_GAME,
) = range(7)

# ---------------------------------------------------------------------------
# Session helpers
# ---------------------------------------------------------------------------


def get_session(context: ContextTypes.DEFAULT_TYPE) -> dict:
    return context.chat_data["session"]


def _players_cache(context: ContextTypes.DEFAULT_TYPE) -> list[dict]:
    """Return the cached list of all players (as plain dicts)."""
    return context.chat_data.get("_all_players", [])


# ---------------------------------------------------------------------------
# Entry point: /newgame
# ---------------------------------------------------------------------------


async def newgame_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    session = GameSession(
        chat_id=update.effective_chat.id,
        moderator_id=update.effective_user.id,
    )
    context.chat_data["session"] = session.model_dump()

    keyboard = [
        [
            InlineKeyboardButton("6", callback_data="count:6"),
            InlineKeyboardButton("8", callback_data="count:8"),
        ],
        [
            InlineKeyboardButton("10", callback_data="count:10"),
            InlineKeyboardButton("12", callback_data="count:12"),
        ],
        [InlineKeyboardButton("Другое число", callback_data="count:custom")],
    ]
    await update.message.reply_text(
        "🎭 Новая игра\n\nСколько игроков?",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ASK_PLAYER_COUNT


# ---------------------------------------------------------------------------
# State: ASK_PLAYER_COUNT
# ---------------------------------------------------------------------------


async def received_count_button(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    query = update.callback_query
    await query.answer()
    _, value = query.data.split(":", 1)

    if value == "custom":
        await query.edit_message_text("Введи количество игроков (от 4 до 30):")
        return ASK_PLAYER_COUNT

    count = int(value)
    get_session(context)["player_count"] = count
    return await _load_and_show_player_selection(query, context)


async def received_count_text(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    text = update.message.text.strip()
    if not text.isdigit() or not (4 <= int(text) <= 30):
        await update.message.reply_text("Введи число от 4 до 30:")
        return ASK_PLAYER_COUNT

    get_session(context)["player_count"] = int(text)
    msg = await update.message.reply_text("Загружаю список игроков...")
    return await _load_and_show_player_selection(msg, context)


# ---------------------------------------------------------------------------
# State: SELECT_PLAYERS
# ---------------------------------------------------------------------------


async def _load_and_show_player_selection(
    msg_or_query: Union[Message, object],  # Message or CallbackQuery
    context: ContextTypes.DEFAULT_TYPE,
) -> int:
    """Fetch players from Sheets, cache them, render the selection keyboard."""
    try:
        players = await state.sheets_client.get_all_players()
    except Exception as e:
        logger.error("Failed to load players: %s", e)
        text = "Ошибка загрузки игроков из Google Sheets. Попробуй ещё раз /newgame."
        if hasattr(msg_or_query, "edit_message_text"):
            await msg_or_query.edit_message_text(text)
        else:
            await msg_or_query.edit_text(text)
        return ConversationHandler.END

    context.chat_data["_all_players"] = [p.model_dump() for p in players]
    get_session(context)["players_page"] = 0
    return await _render_player_page(msg_or_query, context)


async def _render_player_page(
    msg_or_query: Union[Message, object],
    context: ContextTypes.DEFAULT_TYPE,
) -> int:
    session = get_session(context)
    all_players = _players_cache(context)
    page = session.get("players_page", 0)
    selected: set[str] = set(session.get("selected_usernames", []))
    player_count: int = session["player_count"]

    page_items, total_pages, page = paginate(all_players, page, page_size=8)
    session["players_page"] = page

    keyboard: list[list[InlineKeyboardButton]] = []

    for player in page_items:
        username = player["telegram_username"]
        display_name = player["display_name"]
        mark = "✅ " if username in selected else ""
        keyboard.append(
            [
                InlineKeyboardButton(
                    f"{mark}{display_name} (@{username})",
                    callback_data=f"player:{username}",
                )
            ]
        )

    # Pagination row
    nav_row: list[InlineKeyboardButton] = []
    if page > 0:
        nav_row.append(InlineKeyboardButton("◀ Назад", callback_data="page:prev"))
    if page < total_pages - 1:
        nav_row.append(InlineKeyboardButton("Вперёд ▶", callback_data="page:next"))
    if nav_row:
        keyboard.append(nav_row)

    keyboard.append(
        [InlineKeyboardButton("➕ Добавить нового игрока", callback_data="add_player")]
    )

    n_selected = len(selected)
    keyboard.append(
        [
            InlineKeyboardButton(
                f"✔ Готово ({n_selected}/{player_count})",
                callback_data="players_done",
            )
        ]
    )

    text = (
        f"Выбери {player_count} игроков "
        f"(выбрано: {n_selected}/{player_count})\n"
        f"Страница {page + 1}/{total_pages}"
    )
    markup = InlineKeyboardMarkup(keyboard)

    # Both Message and CallbackQuery need different edit methods
    if hasattr(msg_or_query, "edit_message_text"):
        # CallbackQuery
        await msg_or_query.edit_message_text(text, reply_markup=markup)
    else:
        # Message (from text input transitions)
        await msg_or_query.edit_text(text, reply_markup=markup)

    return SELECT_PLAYERS


async def toggle_player(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    _, username = query.data.split(":", 1)
    session = get_session(context)
    selected: list[str] = session.setdefault("selected_usernames", [])
    player_count: int = session["player_count"]

    if username in selected:
        selected.remove(username)
        await query.answer()
    else:
        if len(selected) >= player_count:
            await query.answer(
                f"Уже выбрано {player_count} игроков!", show_alert=True
            )
            return SELECT_PLAYERS
        selected.append(username)
        await query.answer()

    return await _render_player_page(query, context)


async def paginate_players(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    direction = query.data.split(":")[1]
    session = get_session(context)
    session["players_page"] += 1 if direction == "next" else -1
    return await _render_player_page(query, context)


async def add_player_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        "Введи Telegram username нового игрока (без @):"
    )
    return ADD_PLAYER_USERNAME


async def players_done(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    session = get_session(context)
    selected: list[str] = session.get("selected_usernames", [])
    player_count: int = session["player_count"]

    if len(selected) != player_count:
        await query.answer(
            f"Нужно выбрать ровно {player_count} игроков. "
            f"Выбрано: {len(selected)}.",
            show_alert=True,
        )
        return SELECT_PLAYERS

    await query.answer()
    # Initialise role_counts with all citizens by default
    session["role_counts"] = {r: 0 for r in ROLE_ORDER}
    session["role_counts"]["citizen"] = player_count
    return await _render_role_setup(query, context)


# ---------------------------------------------------------------------------
# States: ADD_PLAYER_USERNAME and ADD_PLAYER_NAME
# ---------------------------------------------------------------------------


async def received_new_username(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    username = normalize_username(update.message.text)
    if not username:
        await update.message.reply_text("Username не может быть пустым. Попробуй снова:")
        return ADD_PLAYER_USERNAME

    # Check if already exists in cache
    all_players = _players_cache(context)
    existing = next(
        (p for p in all_players if p["telegram_username"] == username), None
    )
    if existing:
        await update.message.reply_text(
            f"Игрок @{username} уже есть ({existing['display_name']}). "
            "Введи другой username:"
        )
        return ADD_PLAYER_USERNAME

    context.chat_data["_new_username"] = username
    await update.message.reply_text(f"Как звать @{username}? (Введи имя для отображения):")
    return ADD_PLAYER_NAME


async def received_new_display_name(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    display_name = update.message.text.strip()
    if not display_name:
        await update.message.reply_text("Имя не может быть пустым:")
        return ADD_PLAYER_NAME

    username = context.chat_data.pop("_new_username", "")
    if not username:
        await update.message.reply_text("Что-то пошло не так. Начни заново: /newgame")
        return ConversationHandler.END

    try:
        new_player = await state.sheets_client.add_new_player(username, display_name)
    except Exception as e:
        logger.error("Failed to add player %s: %s", username, e)
        await update.message.reply_text(
            "Не удалось добавить игрока в Google Sheets. Попробуй снова."
        )
        return ADD_PLAYER_USERNAME

    # Refresh the cached player list
    all_players = _players_cache(context)
    all_players.append(new_player.model_dump())

    # Auto-select the newly added player
    session = get_session(context)
    session.setdefault("selected_usernames", []).append(username)

    msg = await update.message.reply_text(
        f"Игрок {display_name} (@{username}) добавлен и выбран! ✅"
    )
    return await _render_player_page(msg, context)


# ---------------------------------------------------------------------------
# State: SETUP_ROLES
# ---------------------------------------------------------------------------


def _validate_role_counts(
    counts: dict[str, int], player_count: int
) -> tuple[list[str], list[str]]:
    """Return (errors, warnings) for the current role configuration."""
    errors: list[str] = []
    warnings: list[str] = []

    total = sum(counts.values())
    if total != player_count:
        errors.append(f"Итого ролей: {total}, нужно: {player_count}")

    for role in SINGLETON_ROLES:
        if counts.get(role, 0) > 1:
            errors.append(f"Роль «{ROLE_LABELS[role]}» может быть только 1")

    non_citizen_special = sum(
        counts.get(r, 0)
        for r in ["mafia", "don", "sheriff", "doctor", "beauty", "maniac"]
    )
    if non_citizen_special == 0:
        warnings.append("Нет специальных ролей — все будут мирными")

    if counts.get("don", 0) > 0 and counts.get("mafia", 0) == 0:
        warnings.append("Дон без мафии — необычная расстановка")

    return errors, warnings


async def _render_role_setup(
    query: object,  # CallbackQuery or something with edit_message_text
    context: ContextTypes.DEFAULT_TYPE,
) -> int:
    session = get_session(context)
    counts: dict[str, int] = session["role_counts"]
    player_count: int = session["player_count"]

    errors, warnings = _validate_role_counts(counts, player_count)
    total = sum(counts.values())

    keyboard: list[list[InlineKeyboardButton]] = []
    for role in ROLE_ORDER:
        count = counts.get(role, 0)
        keyboard.append(
            [
                InlineKeyboardButton("−", callback_data=f"role_dec:{role}"),
                InlineKeyboardButton(
                    f"{ROLE_LABELS[role]}: {count}", callback_data="noop"
                ),
                InlineKeyboardButton("+", callback_data=f"role_inc:{role}"),
            ]
        )

    if errors:
        keyboard.append(
            [InlineKeyboardButton("⛔ Исправь ошибки", callback_data="noop")]
        )
    else:
        keyboard.append(
            [InlineKeyboardButton("✅ Продолжить", callback_data="roles_done")]
        )

    text_parts = [f"Настройка ролей — итого: {total}/{player_count}\n"]
    if errors:
        text_parts.append("🚫 " + "\n🚫 ".join(errors))
    if warnings:
        text_parts.append("⚠️ " + "\n⚠️ ".join(warnings))

    text = "\n".join(text_parts).strip()
    markup = InlineKeyboardMarkup(keyboard)

    if hasattr(query, "edit_message_text"):
        await query.edit_message_text(text, reply_markup=markup)
    else:
        await query.edit_text(text, reply_markup=markup)

    return SETUP_ROLES


async def role_increment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    _, role = query.data.split(":", 1)
    session = get_session(context)
    counts = session["role_counts"]

    if role in SINGLETON_ROLES and counts.get(role, 0) >= 1:
        await query.answer(f"«{ROLE_LABELS[role]}» может быть только 1!", show_alert=True)
        return SETUP_ROLES

    counts[role] = counts.get(role, 0) + 1
    await query.answer()
    return await _render_role_setup(query, context)


async def role_decrement(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    _, role = query.data.split(":", 1)
    session = get_session(context)
    counts = session["role_counts"]

    if counts.get(role, 0) <= 0:
        await query.answer()
        return SETUP_ROLES

    counts[role] -= 1
    await query.answer()
    return await _render_role_setup(query, context)


async def noop_answer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Answer display-only buttons silently to prevent the spinner."""
    await update.callback_query.answer()
    return SETUP_ROLES


async def roles_confirmed(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    session = get_session(context)
    counts = session["role_counts"]
    player_count = session["player_count"]

    errors, _ = _validate_role_counts(counts, player_count)
    if errors:
        await query.answer("Исправь ошибки перед продолжением!", show_alert=True)
        return SETUP_ROLES

    # Build and store the role pool
    session["role_pool"] = build_role_pool(counts)
    session["assigned"] = {}
    session["assignment_index"] = 0

    await query.answer()
    return await _render_assign_next(query, context)


# ---------------------------------------------------------------------------
# State: ASSIGN_ROLES
# ---------------------------------------------------------------------------


async def _render_assign_next(
    query: object,
    context: ContextTypes.DEFAULT_TYPE,
) -> int:
    session = get_session(context)
    all_usernames: list[str] = session["selected_usernames"]
    idx: int = session["assignment_index"]

    if idx >= len(all_usernames):
        return await _render_finish(query, context)

    current_username = all_usernames[idx]
    players_cache = {p["telegram_username"]: p for p in _players_cache(context)}
    display_name = players_cache.get(current_username, {}).get(
        "display_name", current_username
    )

    # Calculate remaining available roles
    role_pool: list[str] = session["role_pool"]
    assigned: dict[str, str] = session["assigned"]
    remaining = get_remaining_pool(role_pool, assigned)
    unique_available = unique_roles_in_pool(remaining)

    buttons = [
        InlineKeyboardButton(ROLE_LABELS[role], callback_data=f"assign:{role}")
        for role in unique_available
    ]
    keyboard = chunk_buttons(buttons, columns=2)

    text = (
        f"Назначь роль игроку {idx + 1}/{len(all_usernames)}:\n"
        f"👤 {display_name} (@{current_username})\n\n"
        f"Осталось ролей в пуле: {len(remaining)}"
    )

    if hasattr(query, "edit_message_text"):
        await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        await query.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard))

    return ASSIGN_ROLES


async def assign_role(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    _, role = query.data.split(":", 1)
    session = get_session(context)
    role_pool: list[str] = session["role_pool"]
    assigned: dict[str, str] = session["assigned"]
    idx: int = session["assignment_index"]

    # Verify the role is still available
    remaining = get_remaining_pool(role_pool, assigned)
    if role not in remaining:
        await query.answer("Эта роль больше недоступна!", show_alert=True)
        return ASSIGN_ROLES

    username = session["selected_usernames"][idx]
    assigned[username] = role
    session["assignment_index"] = idx + 1

    await query.answer()

    if session["assignment_index"] >= len(session["selected_usernames"]):
        return await _render_finish(query, context)

    return await _render_assign_next(query, context)


# ---------------------------------------------------------------------------
# State: FINISH_GAME
# ---------------------------------------------------------------------------


async def _render_finish(
    query: object,
    context: ContextTypes.DEFAULT_TYPE,
) -> int:
    session = get_session(context)
    assigned: dict[str, str] = session["assigned"]
    players_cache = {p["telegram_username"]: p for p in _players_cache(context)}

    lines = ["📋 Все роли назначены!\n"]
    for username, role in assigned.items():
        dn = players_cache.get(username, {}).get("display_name", username)
        lines.append(f"  {dn}: {ROLE_LABELS[role]}")
    lines.append("\nКто победил?")

    # Only show Maniac button if maniac is in the game
    roles_used = set(assigned.values())
    keyboard = [
        [InlineKeyboardButton("🏘 Мирные", callback_data="winner:citizens")],
        [InlineKeyboardButton("🔫 Мафия", callback_data="winner:mafia")],
    ]
    if "maniac" in roles_used:
        keyboard.append(
            [InlineKeyboardButton("🔪 Маньяк", callback_data="winner:maniac")]
        )

    text = "\n".join(lines)
    if hasattr(query, "edit_message_text"):
        await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        await query.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard))

    return FINISH_GAME


async def finish_game(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    _, winner_side = query.data.split(":", 1)
    await query.answer()

    await query.edit_message_text("Сохраняю результаты в Google Sheets...")

    try:
        summary = await _commit_game_results(context, winner_side)
    except Exception as e:
        logger.error("Failed to commit game results: %s", e)
        await query.edit_message_text(
            f"❌ Ошибка сохранения: {e}\n"
            "Данные могли не сохраниться. Проверь Google Sheets."
        )
        context.chat_data.clear()
        return ConversationHandler.END

    await query.edit_message_text(summary)
    context.chat_data.clear()
    return ConversationHandler.END


async def _commit_game_results(
    context: ContextTypes.DEFAULT_TYPE, winner_side: str
) -> str:
    """Persist all game data to Sheets and return a summary message."""
    session = get_session(context)
    game_id = generate_game_id()
    assigned: dict[str, str] = session["assigned"]
    players_cache = {p["telegram_username"]: p for p in _players_cache(context)}
    now_iso = datetime.now(timezone.utc).isoformat()

    participants: list[ParticipantResult] = []
    for username, role in assigned.items():
        won = did_win(role, winner_side)
        score = compute_score(role, won)
        dn = players_cache.get(username, {}).get("display_name", username)
        participants.append(
            ParticipantResult(
                game_id=game_id,
                telegram_username=username,
                display_name=dn,
                role=role,
                side=get_side(role),
                score_delta=score,
                won=won,
            )
        )

    game = CompletedGame(
        game_id=game_id,
        played_at=now_iso,
        moderator_chat_id=session["chat_id"],
        winner_side=winner_side,
        player_count=session["player_count"],
        roles_used=json.dumps(session["role_counts"], ensure_ascii=False),
    )

    await state.sheets_client.commit_game(game, participants)

    # Build summary message
    winner_label = WINNER_LABELS.get(winner_side, winner_side)
    lines = [
        f"🎉 Игра #{game_id} завершена!",
        f"Победители: {winner_label}\n",
        "Результаты:",
    ]
    for p in participants:
        status = "✅ Победа" if p.won else "❌ Поражение"
        lines.append(
            f"  {p.display_name} ({ROLE_LABELS[p.role]}): "
            f"{status} +{p.score_delta:.1f}"
        )
    lines.append("\nИспользуй /newgame для следующей игры!")

    return "\n".join(lines)
