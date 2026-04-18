import logging

import state
from telegram import Update
from telegram.ext import ContextTypes

logger = logging.getLogger(__name__)


async def leaderboard(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("Загружаю таблицу лидеров...")

    try:
        players = await state.sheets_client.get_leaderboard(top_n=10)
    except Exception as e:
        logger.error("Failed to fetch leaderboard: %s", e)
        await update.message.reply_text(
            "Не удалось загрузить таблицу лидеров. Попробуй позже."
        )
        return

    if not players:
        await update.message.reply_text("Пока нет данных об игроках.")
        return

    lines = ["🏆 Топ-10 игроков:\n"]
    for i, p in enumerate(players, 1):
        lines.append(
            f"{i}. {p.display_name} — {p.total_score:.1f} очков "
            f"({p.wins}П / {p.losses}П)"
        )

    await update.message.reply_text("\n".join(lines))
