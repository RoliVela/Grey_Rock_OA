"""Scrape phone/address off each seed business's own website and insert into Supabase.

Usage:
    python scrape_businesses.py [seed_csv]   # defaults to seed_businesses.csv

Requires scripts/.env (see .env.example) with SUPABASE_URL and
SUPABASE_SERVICE_ROLE_KEY. Writes go through the service role key because RLS
only allows public SELECT on categories/businesses (see supabase/migrations).
"""

import csv
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup
from supabase import create_client

SCRIPT_DIR = Path(__file__).parent
DEFAULT_SEED_CSV = SCRIPT_DIR / "seed_businesses.csv"
LOG_PATH = SCRIPT_DIR / "scrape_log.txt"

USER_AGENT = "GreyRockDirectoryBot/0.1 (Dallas parent recommendations directory; research project)"
REQUEST_TIMEOUT = 10
DELAY_SECONDS = 1.5

PHONE_RE = re.compile(r"(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")

# ponytail: heuristic street-address match, not a real address parser — upgrade
# to a library like `usaddress` if precision on odd formats ever matters.
ADDRESS_RE = re.compile(
    r"\d{1,6}\s+[A-Za-z0-9.\s]{2,40}?\s"
    r"(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|"
    r"Ct|Court|Pl|Place|Pkwy|Parkway|Cir|Circle|Hwy|Highway)\.?,?\s*"
    r"(?:[A-Za-z\s]{2,25},?\s*)?(?:TX|Texas)?\s*\d{5}?",
    re.IGNORECASE,
)

_robot_cache: dict[str, RobotFileParser | None] = {}


def load_env(path: Path) -> dict[str, str]:
    env = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def can_fetch(url: str) -> bool:
    parsed = urlparse(url)
    domain = f"{parsed.scheme}://{parsed.netloc}"
    if domain not in _robot_cache:
        rp = RobotFileParser()
        rp.set_url(f"{domain}/robots.txt")
        try:
            rp.read()
        except Exception:
            rp = None  # couldn't fetch robots.txt; treat as no restrictions
        _robot_cache[domain] = rp
    rp = _robot_cache[domain]
    return rp is None or rp.can_fetch(USER_AGENT, url)


def visible_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return re.sub(r"\s+", " ", soup.get_text(separator=" "))


def extract_phone(text: str) -> str | None:
    match = PHONE_RE.search(text)
    return match.group(0).strip() if match else None


def extract_address(text: str) -> str | None:
    match = ADDRESS_RE.search(text)
    return match.group(0).strip() if match else None


def _selftest() -> None:
    assert extract_phone("Call us at (214) 555-1234 today") == "(214) 555-1234"
    assert extract_phone("214-555-1234") == "214-555-1234"
    assert extract_phone("+1 214.555.1234") == "+1 214.555.1234"
    assert extract_phone("no digits here") is None
    addr = extract_address("Visit us at 1234 Main St, Dallas, TX 75201 for a tour")
    assert addr is not None and "1234 Main St" in addr
    assert extract_address("nothing address-like here") is None


def get_or_create_category(supabase, name: str, cache: dict[str, int]) -> int:
    if name in cache:
        return cache[name]
    existing = supabase.table("categories").select("id").eq("name", name).execute()
    if existing.data:
        cat_id = existing.data[0]["id"]
    else:
        created = supabase.table("categories").insert({"name": name}).execute()
        cat_id = created.data[0]["id"]
    cache[name] = cat_id
    return cat_id


def main(seed_csv: Path) -> None:
    _selftest()

    env = load_env(SCRIPT_DIR / ".env")
    supabase_url = os.environ.get("SUPABASE_URL") or env.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        sys.exit("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set in scripts/.env or the environment).")

    supabase = create_client(supabase_url, supabase_key)
    category_cache: dict[str, int] = {}

    counts = {"OK": 0, "NO_PHONE": 0, "ROBOTS_DISALLOWED": 0, "ERROR": 0}

    with seed_csv.open(newline="") as f, LOG_PATH.open("w") as log:
        for row in csv.DictReader(f):
            name, category, url = row["name"], row["category"], row["url"]

            if not can_fetch(url):
                counts["ROBOTS_DISALLOWED"] += 1
                log.write(f"ROBOTS_DISALLOWED\t{name}\t{url}\n")
                print(f"[skip] {name}: robots.txt disallows scraping")
                continue

            try:
                resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
                resp.raise_for_status()
            except requests.RequestException as exc:
                counts["ERROR"] += 1
                log.write(f"ERROR\t{name}\t{url}\t{exc}\n")
                print(f"[error] {name}: {exc}")
                time.sleep(DELAY_SECONDS)
                continue

            text = visible_text(resp.text)
            phone = extract_phone(text)
            address = extract_address(text)
            category_id = get_or_create_category(supabase, category, category_cache)

            supabase.table("businesses").insert(
                {
                    "name": name,
                    "category_id": category_id,
                    "phone": phone,
                    "address": address,
                    "website_url": url,
                    "source": "basic_scraper",
                }
            ).execute()

            if phone:
                counts["OK"] += 1
                log.write(f"OK\t{name}\t{url}\tphone={phone}\n")
                print(f"[ok] {name}: {phone}")
            else:
                counts["NO_PHONE"] += 1
                log.write(f"NO_PHONE\t{name}\t{url}\n")
                print(f"[no phone] {name}: {url}")

            time.sleep(DELAY_SECONDS)

    print(
        f"\nDone. OK={counts['OK']} NO_PHONE={counts['NO_PHONE']} "
        f"ROBOTS_DISALLOWED={counts['ROBOTS_DISALLOWED']} ERROR={counts['ERROR']}"
    )
    print(f"Full log: {LOG_PATH}")


if __name__ == "__main__":
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SEED_CSV
    main(csv_path)
