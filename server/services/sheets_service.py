def _get_client():
    """Build and return an authenticated gspread client."""
    if not _lazy_import():
        return None

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]

    try:
        # Option A: Base64-encoded JSON in env var (most reliable for Render)
        if settings.GOOGLE_CREDENTIALS_JSON:
            raw = settings.GOOGLE_CREDENTIALS_JSON.strip()
            # Try base64 decode first
            try:
                import base64
                decoded = base64.b64decode(raw).decode("utf-8")
                info = json.loads(decoded)
            except Exception:
                # Fallback: try plain JSON
                info = json.loads(raw)
            creds = _google_auth.from_service_account_info(info, scopes=scopes)

        # Option B: path to credentials file
        elif settings.GOOGLE_CREDENTIALS_FILE:
            creds = _google_auth.from_service_account_file(
                settings.GOOGLE_CREDENTIALS_FILE, scopes=scopes
            )
        else:
            logger.warning("No Google credentials configured.")
            return None

        return _gspread.authorize(creds)
    except Exception as e:
        logger.error(f"Google auth failed: {e}")
        return None