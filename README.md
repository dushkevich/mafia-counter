# Mafia Counter Bot

A Telegram bot for moderating Mafia / Werewolf game sessions. It guides a moderator through the full game setup, randomly assigns roles, tracks eliminations, lets the moderator enter per-player bonuses and penalties, and saves every result with scores to a Google Spreadsheet.

---

## Features

- Pick players from a persistent list fetched from Google Sheets, or add new ones on the fly
- Configure role counts across 12 available roles
- Auto-assign shuffled roles to players one by one
- Mark which players were eliminated before the game ended
- Enter per-player score bonuses (+) and penalties (−) after each game
- Scoring based on role × winning side × alive/dead status
- Results saved automatically to Google Sheets (Players, Games, GameParticipants tabs)
- `/leaderboard` shows the top 10 players by total score

---

## Roles

| Russian | Key | Side |
|---------|-----|------|
| Мирный | `citizen` | Citizens |
| Шериф | `sheriff` | Citizens |
| Доктор | `doctor` | Citizens |
| Красавица | `beauty` | Citizens |
| Телохранитель | `bodyguard` | Citizens |
| Прокурор | `prosecutor` | Citizens |
| Аферист | `con_artist` | Citizens |
| Вор | `thief` | Citizens |
| Мафия | `mafia` | Mafia |
| Дон | `don` | Mafia |
| Судья | `judge` | Mafia |
| Маньяк | `maniac` | Maniac (solo) |

---

## Prerequisites

- Python 3.10 or later (see note on 3.14 below)
- A Telegram bot token
- A Google Cloud service account with access to the Google Sheets API

---

## Step 1 — Create a Telegram Bot

1. Open Telegram and message **[@BotFather](https://t.me/BotFather)**
2. Send `/newbot` and follow the prompts
3. Copy the **bot token** — it looks like `123456789:ABCDefGhIjKlMnOpQrStUvWxYz`

Optionally register the commands so they appear in the menu:

```
newgame - Начать новую игру
leaderboard - Таблица лидеров
cancel - Отменить текущую игру
```

---

## Step 2 — Create a Google Cloud Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and open or create a project
2. Navigate to **APIs & Services → Library**, search for **Google Sheets API** and click **Enable**
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → Service account**, fill in a name (e.g. `mafia-bot`), click **Done**
5. Click the service account → **Keys** tab → **Add Key → Create new key → JSON**
6. Download the JSON file — this is your credentials file
7. Note the `client_email` inside the JSON (looks like `mafia-bot@project.iam.gserviceaccount.com`)

---

## Step 3 — Create and Share a Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Click **Share**, paste the **service account email** from Step 2, and grant **Editor** access
3. Copy the spreadsheet ID from the URL — it is the string between `/d/` and `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
   ```

The bot will automatically create three tabs on first run: **Players**, **Games**, and **GameParticipants**. If those tabs already exist it will add any missing columns without overwriting data.

---

## Step 4 — Install and Configure

### Clone the repo

```bash
git clone <repo-url>
cd mafia-counter
```

### Install dependencies

**Python 3.10 – 3.13 (standard pip):**

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Python 3.14 (requires uv — pip cannot build pydantic-core on 3.14):**

```bash
uv venv .venv
source .venv/bin/activate
uv pip install "pydantic>=2.10" --prerelease=allow
uv pip install gspread google-auth python-telegram-bot python-dotenv
```

### Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the three values:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIjKlMnOpQrStUvWxYz
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_JSON_PATH=./credentials.json
```

Place the credentials JSON file you downloaded in Step 2 next to `.env` and update `GOOGLE_SERVICE_ACCOUNT_JSON_PATH` to match its filename.

---

## Step 5 — Run the Bot

```bash
source .venv/bin/activate
python bot.py
```

You should see:

```
INFO  Bot starting — polling for updates...
INFO  Ensuring Google Sheets tabs exist...
INFO  Google Sheets ready.
INFO  Application started
```

On first run the bot creates the required tabs. On subsequent runs it checks for and adds any missing columns (safe for existing data).

### Run in the background

```bash
python bot.py > bot.log 2>&1 &
```

View live logs:

```bash
tail -f bot.log
```

Stop the bot:

```bash
pkill -f "python bot.py"
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Show welcome message and available commands |
| `/newgame` | Start a new game (also restarts a game already in progress) |
| `/leaderboard` | Show top 10 players by total score |
| `/cancel` | Abandon the current game |

---

## Game Flow

```
/newgame
  └─ Select player count  (6 / 8 / 10 / 12 or custom 4–30)
       └─ Select players from list  (or add a new player)
            └─ Configure role counts
                 └─ Assign roles one by one
                      └─ Mark eliminated players  (☠️ = eliminated, ✅ = survived)
                           └─ Adjust bonuses / penalties per player  (optional)
                                └─ Select winning side
                                     └─ Results saved to Google Sheets ✓
```

### Adding a new player during game setup

1. Tap **➕ Добавить нового игрока**
2. Enter their Telegram username (without `@`)
3. Enter their display name
4. The player is saved to the spreadsheet and auto-selected for this game

They will appear in the player list for every future game.

### Bonus / penalty adjustments

After the alive/dead marking step, tap any player to open their adjustment panel:

| Button | Effect |
|--------|--------|
| +0.3 / +0.2 / +0.1 | Bonus for a strong positive action |
| −0.1 | Small deduction |
| Удалён −0.2 | Removed from game (fouls or voluntary) |
| ППК −0.3 | Revealed card, hint from corpse, etc. |
| ← Назад | Back to player list |

Tap **✔ Завершить** when done. Buttons stack — you can tap the same player multiple times.

A late-arrival penalty (−0.3 for arriving 15+ min late without notice) is applied the same way — open the player, tap the adjustment that equals −0.3, go back.

---

## Scoring Table

`score = base_score + adjustment`

| Role | Mafia wins alive / dead | Citizens win alive / dead | Maniac wins |
|------|------------------------|--------------------------|-------------|
| citizen | 0 / 0 | 1.0 / 0.5 | 0 |
| sheriff | 0 / 0 | 2.0 / 1.0 | 0 |
| doctor | 0 / 0 | 2.0 / 1.0 | 0 |
| beauty | 0 / 0 | 2.0 / 1.0 | 0 |
| bodyguard | 0 / 0 | 1.0 / 1.0 | 0 |
| prosecutor | 0 / 0 | 1.0 / 0.5 | 0 |
| con_artist | 0 / 0 | 1.0 / 0.5 | 0 |
| thief | 0 / 0 | 1.0 / 0.5 | 0 |
| mafia | 2.0 / 1.5 | 0 / 0 | 0 |
| don | 2.0 / 1.5 | 0 / 0 | 0 |
| judge | 2.0 / 1.0 | 0 / 0 | 0 |
| maniac | 0 / 0 | 0 / 0 | 2.0 |

---

## Google Sheets Structure

### Players tab

| Column | Description |
|--------|-------------|
| `telegram_username` | Unique player key |
| `display_name` | Name shown in the bot |
| `games_played` | Total games participated in |
| `total_score` | Cumulative score |
| `wins` / `losses` | Win and loss counts |
| `*role*_games` | Games played in each role |
| `created_at` / `updated_at` | ISO timestamps |

### Games tab

One row per completed game: `game_id`, `played_at`, `winner_side`, `player_count`, `roles_used`.

### GameParticipants tab

One row per player per game: `game_id`, `telegram_username`, `role`, `side`, `is_alive_end`, `score_delta`, `won`.

---

## Project Structure

```
mafia-counter/
├── bot.py              # entry point, Application builder, handler registration
├── config.py           # .env loading
├── models.py           # Pydantic v2 data models
├── roles.py            # role definitions, side mappings, labels
├── scoring.py          # scoring table and compute_score()
├── sheets.py           # Google Sheets access layer (async gspread wrapper)
├── state.py            # module-level singleton for SheetsClient
├── utils.py            # pagination, button helpers, username normalization
├── handlers/
│   ├── start.py        # /start
│   ├── cancel.py       # /cancel
│   ├── leaderboard.py  # /leaderboard
│   └── newgame.py      # /newgame — full 9-state ConversationHandler
├── requirements.txt
├── .env.example
└── README.md
```

---

## Troubleshooting

**Bot doesn't respond to `/newgame`**
Send `/cancel` first to clear the stuck session, then try again. If it still doesn't work, restart the bot — `/newgame` always restarts the conversation even mid-game.

**Player list is empty even though the Players tab has data**
The new role columns may contain empty cells that cause parse errors. Restart the bot — it handles this automatically on startup.

**`pydantic-core` fails to install**
You are likely on Python 3.14. Use `uv` as described in Step 4.

**Google Sheets API error on startup**
- Confirm the service account email has **Editor** access to the spreadsheet
- Confirm the **Google Sheets API** is enabled in your Google Cloud project
- Check `GOOGLE_SERVICE_ACCOUNT_JSON_PATH` points to the correct file
