# Mafia Counter Bot

Telegram bot for Mafia/Werewolf game moderators. Manages game sessions, role
assignment, and automatically records scores in Google Sheets.

---

## Project structure

```
mafia-counter/
├── bot.py              # entry point
├── config.py           # .env loading
├── models.py           # Pydantic v2 data models
├── roles.py            # role/side mapping and labels
├── scoring.py          # scoring config and calculation
├── sheets.py           # Google Sheets access layer (async)
├── utils.py            # pagination, button helpers
├── handlers/
│   ├── start.py        # /start
│   ├── cancel.py       # /cancel
│   ├── leaderboard.py  # /leaderboard
│   └── newgame.py      # /newgame — full ConversationHandler
├── requirements.txt
├── .env.example
└── README.md
```

---

## Prerequisites

- Python 3.11+
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- A Google Cloud project with the Sheets API and Drive API enabled
- A service account with a downloaded JSON key

---

## 1. Google Cloud setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use an existing one)
3. Enable **Google Sheets API** and **Google Drive API**
4. Create a **Service Account** under IAM & Admin → Service Accounts
5. Create a JSON key for the service account and download it as `credentials.json`
6. Copy the service account email (looks like `name@project.iam.gserviceaccount.com`)

---

## 2. Google Sheets setup

1. Create a new Google Spreadsheet
2. Share it with the service account email (give **Editor** access)
3. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/**<SPREADSHEET_ID>**/edit`
4. The bot will automatically create the required tabs on first startup:
   - `Players`
   - `Games`
   - `GameParticipants`

### Tab schemas (created automatically)

**Players**
```
telegram_username | display_name | games_played | total_score | wins | losses |
mafia_games | citizen_games | sheriff_games | doctor_games | don_games |
beauty_games | maniac_games | created_at | updated_at
```

**Games**
```
game_id | played_at | moderator_chat_id | winner_side | player_count | roles_used | notes
```

**GameParticipants**
```
game_id | telegram_username | display_name | role | side | is_alive_end |
score_delta | won | created_at
```

---

## 3. Telegram bot setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. `/newbot` → follow prompts → copy the token
3. Optionally set commands via BotFather:
   ```
   newgame - Начать новую игру
   leaderboard - Таблица лидеров
   cancel - Отменить текущую игру
   ```

---

## 4. Installation

```bash
# Clone/copy the project
cd mafia-counter

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in your values
```

**.env** example:
```
TELEGRAM_BOT_TOKEN=7123456789:AAGzSomeLongToken
GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SERVICE_ACCOUNT_JSON_PATH=credentials.json
```

Place your `credentials.json` in the project root (or point the path to wherever you saved it).

---

## 5. Running the bot

```bash
python bot.py
```

On first run the bot will create the missing Google Sheets tabs if they don't exist.

---

## Sample game flow

```
Moderator: /newgame

Bot: 🎭 Новая игра
     Сколько игроков?
     [6] [8] [10] [12] [Другое число]

Moderator: clicks [8]

Bot: Выбери 8 игроков (выбрано: 0/8)
     [Alice (@alice)]
     [Bob (@bob)]
     ...
     [➕ Добавить нового игрока]
     [✔ Готово (0/8)]

Moderator: clicks on 8 players → clicks [✔ Готово (8/8)]

Bot: Настройка ролей — итого: 8/8
     [−] Мирный: 8 [+]
     [−] Мафия: 0 [+]
     ...
     [✅ Продолжить]

Moderator: adjusts to: 4 Мирных, 2 Мафии, 1 Шериф, 1 Доктор
     clicks [✅ Продолжить]

Bot: Назначь роль игроку 1/8:
     👤 Alice (@alice)
     [Мирный] [Мафия]
     [Шериф]  [Доктор]

Moderator: clicks [Мафия]

Bot: Назначь роль игроку 2/8:
     👤 Bob (@bob)
     (Мафия already assigned, 1 left in pool)
     [Мирный] [Мафия]
     [Шериф]  [Доктор]
     ...

(continues until all 8 players have roles)

Bot: 📋 Все роли назначены!
       Alice: Мафия
       Bob: Мирный
       ...
     Кто победил?
     [🏘 Мирные] [🔫 Мафия]

Moderator: clicks [🏘 Мирные]

Bot: 🎉 Игра #A3F7B2C1 завершена!
     Победители: Мирные

     Результаты:
       Alice (Мафия): ❌ Поражение +0.2
       Bob (Мирный): ✅ Победа +1.2
       ...

     Используй /newgame для следующей игры!
```

---

## Scoring rules

Defined in [scoring.py](scoring.py). Easy to change without touching handlers.

| Role       | Win bonus | Loss bonus |
|------------|-----------|------------|
| Мирный     | +1.0      | +0.0       |
| Мафия      | +1.5      | +0.0       |
| Дон        | +1.7      | +0.0       |
| Шериф      | +1.2      | +0.0       |
| Доктор     | +1.2      | +0.0       |
| Красавица  | +1.1      | +0.0       |
| Маньяк     | +2.0      | +0.0       |

**Formula:** `score = 0.2 (participation) + win_bonus (if won) or loss_bonus (if lost)`

---

## Extending later

### Night actions (sheriff checks, doctor saves, etc.)

The scoring engine in [scoring.py](scoring.py) is intentionally isolated.
To add per-action bonuses:

1. Add constants like `SHERIFF_CHECK_BONUS = 0.3` to `scoring.py`
2. Extend `compute_score(role, won, *, sheriff_checks=0, doctor_saves=0)` signature
3. Collect night actions in `GameSession.actions: list[Action]` (add the field to [models.py](models.py))
4. Process them in `_commit_game_results` in [handlers/newgame.py](handlers/newgame.py)

### Database backend

Replace `SheetsClient` with a class implementing the same async interface.
All handlers import `bot.sheets_client` and only call the public methods —
no handler code needs to change.

### Multiple bot instances / groups

`ConversationHandler` uses `per_chat=True`, so each chat has its own game state.
To add access control, add an `allowed_chat_ids` list to [config.py](config.py) and
check it in `newgame_start`.

---

## Commands

| Command | Description |
|---|---|
| `/start` | Welcome message and command list |
| `/newgame` | Start a guided game flow |
| `/leaderboard` | Show top 10 players by score |
| `/cancel` | Cancel the current in-progress game |
