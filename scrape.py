#!/usr/bin/env python3
"""Scrape the weekly training schedule from panuderech.vercel.app to JSON."""

import json
import re
import sys
from playwright.sync_api import sync_playwright

URL = "https://panuderech.vercel.app/"
DAYS_HE = {"ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"}


def parse_card(text: str) -> dict | None:
    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
    if not lines or lines[0] not in DAYS_HE:
        return None

    day = lines[0]
    sessions = []
    i = 1
    while i < len(lines):
        m = re.match(r"^(\d{1,2}:\d{2})\s*[-–]\s*(.+)", lines[i])
        if m:
            time, group = m.group(1), m.group(2).strip()
            location_parts = []
            i += 1
            while i < len(lines) and not re.match(r"^\d{1,2}:\d{2}\s*[-–]", lines[i]):
                location_parts.append(lines[i])
                i += 1
            sessions.append({
                "time": time,
                "group": group,
                "location": "\n".join(location_parts),
            })
        else:
            i += 1

    return {"day": day, "sessions": sessions}


def scrape():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(URL, wait_until="networkidle", timeout=30000)

        title = ""
        h2 = page.query_selector("#schedule h2")
        if h2:
            title = h2.inner_text().strip()

        days = []
        for card in page.query_selector_all('#schedule [class*="bg-white"]'):
            text = card.inner_text().strip()
            if text and (parsed := parse_card(text)):
                days.append(parsed)

        browser.close()

    return {"title": title, "days": days}


if __name__ == "__main__":
    from datetime import datetime, timezone
    import pathlib

    try:
        data = scrape()
        data["scraped_at"] = datetime.now(timezone.utc).isoformat()
        out = json.dumps(data, ensure_ascii=False, indent=2)
        pathlib.Path(pathlib.Path(__file__).parent / "schedule.json").write_text(out, encoding="utf-8")
        print(f"Wrote schedule.json — {len(data['days'])} days, {sum(len(d['sessions']) for d in data['days'])} sessions")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
