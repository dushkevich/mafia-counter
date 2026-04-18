from telegram import Update
from telegram.ext import ContextTypes


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Добро пожаловать в Mafia Counter Bot! 🎭\n\n"
        "Команды:\n"
        "/newgame — начать новую игру\n"
        "/leaderboard — таблица лидеров\n"
        "/cancel — отменить текущую игру\n\n"
        "Бот помогает ведущему управлять игрой и записывать результаты в Google Sheets."
    )
