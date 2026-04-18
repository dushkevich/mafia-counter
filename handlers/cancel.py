from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel any active game and clear session state."""
    context.chat_data.clear()
    await update.message.reply_text(
        "Игра отменена. Используй /newgame чтобы начать снова."
    )
    return ConversationHandler.END
