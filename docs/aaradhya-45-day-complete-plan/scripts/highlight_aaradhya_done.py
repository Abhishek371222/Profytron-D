"""
Highlight Aaradhya DONE cells with bright green fill (match Day_by_Day completed style).
"""
from __future__ import annotations

import json
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

SPREADSHEET_ID = "1RDOR4ZE4EnR8szoKQJsl53jwUFe1ZIi71GK1D14ZTnc"

# Bright green used for "done" in the Day_by_Day aaradhya column
GREEN = {"red": 0.0, "green": 1.0, "blue": 0.0}
# Soft complete alternative not used unless neon too harsh; stay neon to match UI
TEXT_BLACK = {"red": 0.0, "green": 0.0, "blue": 0.0}

# Master Tracker: only true Completed gets green (Partial/Review/Not Started stay clear)
DONE_STATUSES = {"completed"}


def token() -> str:
    return subprocess.check_output(
        ["gcloud", "auth", "print-access-token"], text=True, shell=True
    ).strip()


def api(method: str, path: str, tok: str, body: dict | None = None) -> Any:
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}{path}"
    data = None
    headers = {"Authorization": f"Bearer {tok}", "Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {path} -> {e.code}: {e.read().decode()}") from e


def values_get(tok: str, range_a1: str) -> list[list[Any]]:
    q = urllib.parse.quote(range_a1, safe="!'")
    return api("GET", f"/values/{q}", tok).get("values") or []


def sheet_map(tok: str) -> dict[str, int]:
    meta = api(
        "GET",
        "?fields=sheets.properties(sheetId,title)",
        tok,
    )
    return {s["properties"]["title"]: s["properties"]["sheetId"] for s in meta["sheets"]}


def paint_range(sheet_id: int, start_row: int, end_row: int, start_col: int, end_col: int) -> dict:
    """0-based start, end exclusive for rows/cols."""
    return {
        "repeatCell": {
            "range": {
                "sheetId": sheet_id,
                "startRowIndex": start_row,
                "endRowIndex": end_row,
                "startColumnIndex": start_col,
                "endColumnIndex": end_col,
            },
            "cell": {
                "userEnteredFormat": {
                    "backgroundColor": GREEN,
                    "textFormat": {"foregroundColor": TEXT_BLACK, "bold": False},
                }
            },
            "fields": "userEnteredFormat.backgroundColor,userEnteredFormat.textFormat.foregroundColor",
        }
    }


def main() -> None:
    tok = token()
    smap = sheet_map(tok)
    requests: list[dict] = []
    log: list[str] = []

    # --- Day_by_Day: aaradhya column (col H = index 7), rows 2..46 (days 1-45) ---
    for title in ("Day_by_Day_1-45", "Day by Day 1-45"):
        sid = smap.get(title)
        if sid is None:
            log.append(f"skip missing {title}")
            continue
        data = values_get(tok, f"'{title}'!A1:L50")
        if not data:
            continue
        header = [str(h or "") for h in data[0]]
        aar_col = next((i for i, h in enumerate(header) if "aaradhya" in h.lower()), None)
        if aar_col is None:
            log.append(f"{title}: no aaradhya col")
            continue
        # paint every day row 1-45 (FE package complete)
        start = 1  # row index 1 = sheet row 2
        end = min(1 + 45, len(data))  # exclusive
        requests.append(paint_range(sid, start, end, aar_col, aar_col + 1))
        log.append(f"{title}: green aaradhya col rows {start+1}-{end} (col {aar_col})")

    # --- Master Tracker: Status cell green when aaradhya + done-like status ---
    sid = smap.get("Master Tracker")
    if sid is not None:
        mt = values_get(tok, "Master Tracker!A1:M200")
        header = [str(h or "") for h in mt[0]]
        owner_i = header.index("Owner")
        status_i = header.index("Status")
        # also paint Task ID for visibility
        id_i = header.index("Task ID")
        n = 0
        for r, row in enumerate(mt[1:], start=1):  # 0-based row index in grid = r
            owner = row[owner_i] if len(row) > owner_i else ""
            status = row[status_i] if len(row) > status_i else ""
            if str(owner).lower() != "aaradhya":
                continue
            if str(status).strip().lower() not in DONE_STATUSES and not str(status).lower().startswith(
                "completed"
            ):
                # Partial/Review already in DONE_STATUSES; skip Not Started
                if str(status).strip().lower() not in ("partial", "review", "completed"):
                    continue
            # green Task ID + Status for done aaradhya work
            requests.append(paint_range(sid, r, r + 1, id_i, id_i + 1))
            requests.append(paint_range(sid, r, r + 1, status_i, status_i + 1))
            n += 1
        log.append(f"Master Tracker: green ID+Status on {n} aaradhya done-ish rows")

    # --- Website Checklist: SEO/Code Ready + Prod Live for aaradhya Yes ---
    sid = smap.get("Website Checklist")
    if sid is not None:
        wc = values_get(tok, "Website Checklist!A1:I40")
        header = [str(h or "") for h in wc[0]]
        eng_i = header.index("Eng Owner") if "Eng Owner" in header else None
        seo_i = header.index("SEO/Code Ready") if "SEO/Code Ready" in header else None
        prod_i = header.index("Prod Live") if "Prod Live" in header else None
        page_i = 0
        n = 0
        for r, row in enumerate(wc[1:], start=1):
            eng = row[eng_i] if eng_i is not None and len(row) > eng_i else ""
            if str(eng).lower() != "aaradhya":
                continue
            if seo_i is not None:
                requests.append(paint_range(sid, r, r + 1, seo_i, seo_i + 1))
            if prod_i is not None:
                requests.append(paint_range(sid, r, r + 1, prod_i, prod_i + 1))
            requests.append(paint_range(sid, r, r + 1, page_i, page_i + 1))
            n += 1
        log.append(f"Website Checklist: green page/seo/prod for {n} aaradhya rows")

    # --- Daily 10h: Task cell green where Person=aaradhya and Done=Y ---
    sid = smap.get("Daily 10h Tasks")
    if sid is not None:
        # fetch in chunks is hard; get full
        d10 = values_get(tok, "'Daily 10h Tasks'!A1:N1500")
        header = [str(h or "") for h in d10[0]]
        person_i = header.index("Person")
        done_i = header.index("Done? (Y/N)")
        task_i = header.index("Task (do this today)")
        n = 0
        # batch ranges of contiguous green rows for task+done cols
        for r, row in enumerate(d10[1:], start=1):
            person = row[person_i] if len(row) > person_i else ""
            done = row[done_i] if len(row) > done_i else ""
            if str(person).lower() != "aaradhya":
                continue
            if str(done).upper() not in ("Y", "YES"):
                continue
            requests.append(paint_range(sid, r, r + 1, task_i, task_i + 1))
            requests.append(paint_range(sid, r, r + 1, done_i, done_i + 1))
            n += 1
        log.append(f"Daily 10h: green task+done for {n} aaradhya Y rows")

    # --- KPI Landing LCP current value ---
    sid = smap.get("KPI Dashboard")
    if sid is not None:
        kpi = values_get(tok, "KPI Dashboard!A1:F30")
        for r, row in enumerate(kpi[1:], start=1):
            name = row[0] if row else ""
            if "landing lcp" in str(name).lower():
                # green Current column (B = 1)
                requests.append(paint_range(sid, r, r + 1, 0, 2))  # KPI + Current
                log.append("KPI Dashboard: green Landing LCP row label+current")

    # --- Daily Standup: aaradhya rows with Completed ---
    sid = smap.get("Daily Standup")
    if sid is not None:
        ds = values_get(tok, "Daily Standup!A1:G50")
        header = [str(h or "") for h in ds[0]]
        mem_i = header.index("Member") if "Member" in header else 1
        st_i = header.index("Status") if "Status" in header else 6
        n = 0
        for r, row in enumerate(ds[1:], start=1):
            mem = row[mem_i] if len(row) > mem_i else ""
            st = row[st_i] if len(row) > st_i else ""
            if str(mem).lower() == "aaradhya" and str(st).lower() == "completed":
                requests.append(paint_range(sid, r, r + 1, 0, 7))
                n += 1
        log.append(f"Daily Standup: green full row for {n} aaradhya Completed")

    # Send batchUpdate in chunks
    CHUNK = 80
    total_replies = 0
    for i in range(0, len(requests), CHUNK):
        chunk = requests[i : i + CHUNK]
        resp = api("POST", ":batchUpdate", tok, {"requests": chunk})
        total_replies += len(resp.get("replies") or [])
        log.append(f"batchUpdate {i//CHUNK + 1}: {len(chunk)} format ops")

    print("=== GREEN HIGHLIGHT DONE (aaradhya only) ===")
    for line in log:
        print(line)
    print(f"total format requests: {len(requests)} replies={total_replies}")
    print(f"url: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit")


if __name__ == "__main__":
    main()
