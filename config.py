import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    telegram_bot_token: str
    google_spreadsheet_id: str
    google_service_account_json_path: str

    @classmethod
    def from_env(cls) -> "Settings":
        token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID", "")
        creds_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON_PATH", "credentials.json")

        if not token:
            raise ValueError("TELEGRAM_BOT_TOKEN is not set")
        if not spreadsheet_id:
            raise ValueError("GOOGLE_SPREADSHEET_ID is not set")

        return cls(
            telegram_bot_token=token,
            google_spreadsheet_id=spreadsheet_id,
            google_service_account_json_path=creds_path,
        )


settings = Settings.from_env()
