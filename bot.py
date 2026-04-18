"""Entry point for the Mafia Counter Telegram bot."""

import logging

import state
from config import settings
from handlers.cancel import cancel
from handlers.leaderboard import leaderboard
from handlers.newgame import (
    ASK_PLAYER_COUNT,
    ADD_PLAYER_NAME,
    ADD_PLAYER_USERNAME,
    ASSIGN_ROLES,
    FINISH_GAME,
    SELECT_PLAYERS,
    SETUP_ROLES,
    add_player_prompt,
    assign_role,
    finish_game,
    newgame_start,
    noop_answer,
    paginate_players,
    players_done,
    received_count_button,
    received_count_text,
    received_new_display_name,
    received_new_username,
    role_decrement,
    role_increment,
    roles_confirmed,
    toggle_player,
)
from handlers.start import start
from sheets import SheetsClient
from telegram import Update
from telegram.ext import (
    Application,
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    ConversationHandler,
    MessageHandler,
    filters,
)

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def _build_conv_handler() -> ConversationHandler:
    """Assemble the /newgame ConversationHandler."""
    return ConversationHandler(
        entry_points=[CommandHandler("newgame", newgame_start)],
        states={
            ASK_PLAYER_COUNT: [
                CallbackQueryHandler(received_count_button, pattern=r"^count:"),
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND, received_count_text
                ),
            ],
            SELECT_PLAYERS: [
                CallbackQueryHandler(toggle_player, pattern=r"^player:"),
                CallbackQueryHandler(paginate_players, pattern=r"^page:"),
                CallbackQueryHandler(add_player_prompt, pattern=r"^add_player$"),
                CallbackQueryHandler(players_done, pattern=r"^players_done$"),
            ],
            ADD_PLAYER_USERNAME: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND, received_new_username
                ),
            ],
            ADD_PLAYER_NAME: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND, received_new_display_name
                ),
            ],
            SETUP_ROLES: [
                CallbackQueryHandler(role_increment, pattern=r"^role_inc:"),
                CallbackQueryHandler(role_decrement, pattern=r"^role_dec:"),
                CallbackQueryHandler(roles_confirmed, pattern=r"^roles_done$"),
                CallbackQueryHandler(noop_answer, pattern=r"^noop$"),
            ],
            ASSIGN_ROLES: [
                CallbackQueryHandler(assign_role, pattern=r"^assign:"),
            ],
            FINISH_GAME: [
                CallbackQueryHandler(finish_game, pattern=r"^winner:"),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        per_chat=True,
        per_user=False,
        per_message=False,
    )


async def _post_init(application: Application) -> None:
    """Run after the Application is initialised but before polling starts."""
    logger.info("Ensuring Google Sheets tabs exist...")
    try:
        await state.sheets_client.ensure_sheets()
        logger.info("Google Sheets ready.")
    except Exception as e:
        logger.error("Failed to initialise Google Sheets: %s", e)
        raise


def main() -> None:
    # Initialise the shared singleton in state.py so all handlers find it
    # regardless of whether they import 'bot' or '__main__'.
    state.sheets_client = SheetsClient()

    app: Application = (
        ApplicationBuilder()
        .token(settings.telegram_bot_token)
        .concurrent_updates(False)  # CRITICAL for ConversationHandler
        .post_init(_post_init)
        .build()
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("leaderboard", leaderboard))
    app.add_handler(_build_conv_handler())

    # Catch-all for stale callback queries (e.g. user clicks an old button).
    # Registered after ConversationHandler so it has lower priority.
    async def _stale_callback(update: Update, _ctx) -> None:
        await update.callback_query.answer()

    app.add_handler(CallbackQueryHandler(_stale_callback))

    logger.info("Bot starting — polling for updates...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
