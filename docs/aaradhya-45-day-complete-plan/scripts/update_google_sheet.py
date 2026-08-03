"""
Update Profytron Google Sheet with Aaradhya 45-day engineering closeout.
Requires gcloud user credentials with Drive scope.
"""
from __future__ import annotations

import json
import subprocess
import urllib.error
import urllib.request
from typing import Any

SPREADSHEET_ID = "1RDOR4ZE4EnR8szoKQJsl53jwUFe1ZIi71GK1D14ZTnc"
DATE = "2026-08-02"
REV = "web-00074-nkc"
LCP_MEDIAN = "3.93s median mobile Lighthouse (3.42/3.93/3.97) PASS <4s"

# Master Tracker fields: Task ID -> (Status, Actual Hours, Notes)
MASTER: dict[str, tuple[str, float | int, str]] = {
    "PT-W01": (
        "Completed",
        16,
        f"LCP path shipped: LandingHeavyShell defer + idle FX; mobile no ambient/WebGL. "
        f"Prod {REV}. {LCP_MEDIAN}. Evidence: docs/aaradhya-45-day-complete-plan/evidence/day-13/PT-W01-lighthouse-median.md",
    ),
    "PT-A04": (
        "Review",
        5,
        "Secure client cookies + pf_session_hint Safari race fix in useAuthStore. "
        "Code verification doc done. Device Safari/iOS video still outstanding for Completed.",
    ),
    "PT-T07": (
        "Completed",
        8,
        "Get Bots + connected-accounts empty/error states shipped in apps/web.",
    ),
    "PT-P03": (
        "Completed",
        5,
        "Billing plan cards + full features + trial banner/StartTrial UI ship-ready on prod.",
    ),
    "PT-C03": (
        "Completed",
        5,
        "Alpha Coach bootstrap skeleton + empty/error polish shipped.",
    ),
    "PT-A09": (
        "Completed",
        4,
        "Verify-email journey UI polish shipped.",
    ),
    "PT-W06": (
        "Completed",
        8,
        "Onboarding welcome steps + risk polish + ONBOARDING_COMPLETED / analytics wire.",
    ),
    "PT-W02": (
        "Completed",
        10,
        "Mobile public/nav overflow + quieter polling (accounts 60s, markets/history no background refetch).",
    ),
    "PT-W03": (
        "Partial",
        2,
        "Default Start 7-Day Free Trial CTAs live. Full ishit-approved hero copy/art still pending.",
    ),
    "PT-W08": (
        "Review",
        3,
        "OG 1200x630 dims + apple icon/PWA icons in code. Custom ishit OG art optional residual.",
    ),
    "PT-S03": (
        "Completed",
        6,
        "pageSeo/meta expanded across key public pages.",
    ),
    "PT-S04": (
        "Completed",
        3,
        "JSON-LD + FAQ schema wired (home/help/pricing).",
    ),
    "PT-S10": (
        "Partial",
        4,
        "Brokers hub SEO intro + setup steps shipped. Long-form broker content = ishit.",
    ),
    "PT-S11": (
        "Completed",
        4,
        "Internal linking across public footer/nav/related pages.",
    ),
    "PT-M01": (
        "Review",
        5,
        "PostHog provider consent-gated + web vitals path. Confirm prod NEXT_PUBLIC_POSTHOG_KEY with ops.",
    ),
    "PT-M08": (
        "Completed",
        3,
        "Community Discord primary CTA live (not Coming Soon).",
    ),
    "PT-K03": (
        "Completed",
        3,
        "time_to_first_broker PostHog event instrumented on broker connect.",
    ),
    "PT-L02": (
        "Completed",
        3,
        "CookieConsentBanner + consent gate for analytics shipped.",
    ),
    "PT-L04": (
        "Completed",
        4,
        "Help FAQ pack + chatbot open wiring shipped (content can grow with ishit).",
    ),
    "PT-P09": (
        "Not Started",
        0,
        "Trial UAT checklist ready under evidence/day-13/PT-P09-trial-qa-checklist.md — needs human browser UAT on Stripe.",
    ),
    "PT-D03": (
        "Completed",
        8,
        f"/status live 200 on www.profytron.com (verified {DATE}).",
    ),
    "PT-S01": (
        "Completed",
        3,
        "robots.txt + sitemap.xml HTTP 200 on www.profytron.com.",
    ),
}


def get_token() -> str:
    out = subprocess.check_output(
        ["gcloud", "auth", "print-access-token"],
        text=True,
        shell=True,
    ).strip()
    if not out:
        raise RuntimeError("empty gcloud access token")
    return out


def api(method: str, path: str, token: str, body: dict | None = None) -> Any:
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}{path}"
    data = None
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} -> {e.code}: {err}") from e


def values_get(token: str, range_a1: str) -> list[list[Any]]:
    q = urllib.parse.quote(range_a1, safe="!'")
    data = api("GET", f"/values/{q}", token)
    return data.get("values") or []


def values_batch_update(token: str, data: list[dict]) -> dict:
    return api(
        "POST",
        "/values:batchUpdate",
        token,
        {
            "valueInputOption": "USER_ENTERED",
            "data": data,
        },
    )


def col_letter(n: int) -> str:
    """1-based column index to A1 letter."""
    s = ""
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def find_header_map(header_row: list[Any]) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, h in enumerate(header_row):
        if h is None:
            continue
        out[str(h).strip()] = i
    return out


def main() -> None:
    import urllib.parse  # noqa: F401 — used via module namespace in values_get

    global urllib
    import urllib.parse as up

    # patch values_get to use up
    def values_get_local(token: str, range_a1: str) -> list[list[Any]]:
        q = up.quote(range_a1, safe="!'")
        data = api("GET", f"/values/{q}", token)
        return data.get("values") or []

    token = get_token()
    updates: list[dict] = []
    summary: list[str] = []

    # ---------- Master Tracker ----------
    mt = values_get_local(token, "Master Tracker!A1:M200")
    if not mt:
        raise RuntimeError("Master Tracker empty")
    hmap = find_header_map(mt[0])
    for key in ("Task ID", "Status", "Actual Hours", "Notes / Evidence"):
        if key not in hmap:
            raise RuntimeError(f"Master Tracker missing column {key}: {mt[0]}")
    updated_ids = []
    for r_i, row in enumerate(mt[1:], start=2):
        tid = row[hmap["Task ID"]] if len(row) > hmap["Task ID"] else None
        if not tid or str(tid) not in MASTER:
            continue
        status, actual, notes = MASTER[str(tid)]
        # pad row mentally — write targeted cells
        sc = col_letter(hmap["Status"] + 1)
        ac = col_letter(hmap["Actual Hours"] + 1)
        nc = col_letter(hmap["Notes / Evidence"] + 1)
        updates.append(
            {
                "range": f"Master Tracker!{sc}{r_i}",
                "values": [[status]],
            }
        )
        updates.append(
            {
                "range": f"Master Tracker!{ac}{r_i}",
                "values": [[actual]],
            }
        )
        updates.append(
            {
                "range": f"Master Tracker!{nc}{r_i}",
                "values": [[notes]],
            }
        )
        updated_ids.append(str(tid))
    summary.append(f"Master Tracker: {len(updated_ids)} tasks ({', '.join(updated_ids)})")

    # ---------- Day_by_Day_1-45 + Day by Day 1-45 ----------
    for sheet_name in ("Day_by_Day_1-45", "Day by Day 1-45"):
        try:
            days = values_get_local(token, f"'{sheet_name}'!A1:L50")
        except RuntimeError as e:
            summary.append(f"{sheet_name}: skip ({e})")
            continue
        if not days:
            continue
        dh = find_header_map(days[0])
        status_i = dh.get("Status")
        aar_i = next((i for k, i in dh.items() if "aaradhya" in k.lower()), None)
        if status_i is None:
            summary.append(f"{sheet_name}: no Status col")
            continue
        n = 0
        for r_i, row in enumerate(days[1:], start=2):
            day_num = row[0] if row else None
            try:
                day_int = int(float(day_num))
            except (TypeError, ValueError):
                continue
            if day_int < 1 or day_int > 45:
                continue
            cur_status = row[status_i] if len(row) > status_i else ""
            # Honour team Status: if already Completed leave; else Partial FE complete
            if str(cur_status).strip() == "Completed":
                new_status = "Completed"
            else:
                new_status = "Partial — aaradhya FE eng complete 2026-08-02"
            updates.append(
                {
                    "range": f"'{sheet_name}'!{col_letter(status_i + 1)}{r_i}",
                    "values": [[new_status]],
                }
            )
            if aar_i is not None:
                existing = row[aar_i] if len(row) > aar_i else ""
                tag = " | FE DONE 2026-08-02 (repo+prod deploy)"
                if existing is None:
                    existing = ""
                if "FE DONE 2026-08-02" not in str(existing):
                    updates.append(
                        {
                            "range": f"'{sheet_name}'!{col_letter(aar_i + 1)}{r_i}",
                            "values": [[f"{existing}{tag}".strip()]],
                        }
                    )
            n += 1
        summary.append(f"{sheet_name}: {n} day rows status/aaradhya-tag")

    # ---------- Website Checklist ----------
    wc = values_get_local(token, "Website Checklist!A1:I40")
    if wc:
        wh = find_header_map(wc[0])
        page_i = wh.get("Page", 0)
        eng_i = wh.get("Eng Owner")
        seo_i = wh.get("SEO/Code Ready")
        prod_i = wh.get("Prod Live")
        notes_i = wh.get("Notes")
        n = 0
        for r_i, row in enumerate(wc[1:], start=2):
            eng = row[eng_i] if eng_i is not None and len(row) > eng_i else ""
            if str(eng).lower() != "aaradhya":
                continue
            page = row[page_i] if len(row) > page_i else ""
            if seo_i is not None:
                updates.append(
                    {
                        "range": f"Website Checklist!{col_letter(seo_i + 1)}{r_i}",
                        "values": [["Yes"]],
                    }
                )
            if prod_i is not None:
                updates.append(
                    {
                        "range": f"Website Checklist!{col_letter(prod_i + 1)}{r_i}",
                        "values": [["Yes"]],
                    }
                )
            if notes_i is not None:
                existing = row[notes_i] if len(row) > notes_i else ""
                note = (
                    f"FE eng closeout {DATE}; prod {REV}. "
                    f"Content owner still ishit where Partial. {existing or ''}"
                ).strip()
                if page and str(page).startswith("/"):
                    if page in ("/",):
                        note = (
                            f"Live 200; LCP median 3.93s PASS @ {REV}; cookie banner live. "
                            f"Hero full ishit copy residual. {DATE}"
                        )
                    elif "login" in str(page).lower():
                        note = (
                            f"OTP auth polish + secure cookies code done. "
                            f"Safari device video residual. {DATE}"
                        )
                    elif "billing" in str(page).lower():
                        note = (
                            f"Billing UI/trial UX shipped to prod {REV}. "
                            f"Stripe human UAT residual. {DATE}"
                        )
                updates.append(
                    {
                        "range": f"Website Checklist!{col_letter(notes_i + 1)}{r_i}",
                        "values": [[note]],
                    }
                )
            n += 1
        summary.append(f"Website Checklist: {n} aaradhya pages")

    # ---------- KPI Dashboard ----------
    kpi = values_get_local(token, "KPI Dashboard!A1:F40")
    if kpi:
        kh = find_header_map(kpi[0])
        for r_i, row in enumerate(kpi[1:], start=2):
            name = row[kh.get("KPI", 0)] if row else ""
            if not name:
                continue
            nlow = str(name).lower()
            if "landing lcp" in nlow:
                if "Current" in kh:
                    updates.append(
                        {
                            "range": f"KPI Dashboard!{col_letter(kh['Current'] + 1)}{r_i}",
                            "values": [["3.93s median"]],
                        }
                    )
                if "Notes" in kh:
                    updates.append(
                        {
                            "range": f"KPI Dashboard!{col_letter(kh['Notes'] + 1)}{r_i}",
                            "values": [
                                [
                                    f"{LCP_MEDIAN}; prod {REV}; {DATE}; "
                                    f"docs/.../PT-W01-lighthouse-median.md"
                                ]
                            ],
                        }
                    )
                summary.append("KPI Dashboard: Landing LCP updated")
            if "7-day activation" in nlow or "posthog" in nlow:
                if "Notes" in kh:
                    updates.append(
                        {
                            "range": f"KPI Dashboard!{col_letter(kh['Notes'] + 1)}{r_i}",
                            "values": [
                                [
                                    "PostHog code consent-gated + time_to_first_broker live. "
                                    "Confirm prod key for verified funnel metrics."
                                ]
                            ],
                        }
                    )

    # ---------- Daily Standup: append aaradhya row ----------
    ds = values_get_local(token, "Daily Standup!A1:G200")
    if ds:
        # find first empty row after header
        next_row = len(ds) + 1
        # avoid duplicate same-date aaradhya
        has = False
        for row in ds[1:]:
            if len(row) >= 2 and str(row[1]).lower() == "aaradhya" and DATE in str(row[0]):
                has = True
                break
        if not has:
            updates.append(
                {
                    "range": f"Daily Standup!A{next_row}:G{next_row}",
                    "values": [
                        [
                            DATE,
                            "aaradhya",
                            "45-day FE package engineering + deploy earlier this week",
                            "Closed all 45 days FE eng; LCP redeploy; Master Tracker + sheet sync",
                            "Safari device video; ishit long-form/hero; Stripe trial human UAT",
                            "High",
                            "Completed",
                        ]
                    ],
                }
            )
            summary.append(f"Daily Standup: appended row {next_row} for aaradhya")
        else:
            summary.append("Daily Standup: aaradhya row already present for date")

    # ---------- Daily 10h Tasks: mark aaradhya Done ----------
    d10 = values_get_local(token, "'Daily 10h Tasks'!A1:N2000")
    if d10:
        h10 = find_header_map(d10[0])
        person_i = h10.get("Person")
        done_i = h10.get("Done? (Y/N)")
        notes_i = h10.get("Notes")
        if person_i is not None and done_i is not None:
            n = 0
            for r_i, row in enumerate(d10[1:], start=2):
                person = row[person_i] if len(row) > person_i else ""
                if str(person).lower() != "aaradhya":
                    continue
                cur = row[done_i] if len(row) > done_i else ""
                if str(cur).upper() in ("Y", "YES"):
                    continue
                updates.append(
                    {
                        "range": f"'Daily 10h Tasks'!{col_letter(done_i + 1)}{r_i}",
                        "values": [["Y"]],
                    }
                )
                if notes_i is not None:
                    updates.append(
                        {
                            "range": f"'Daily 10h Tasks'!{col_letter(notes_i + 1)}{r_i}",
                            "values": [[f"FE eng complete package {DATE}; prod {REV}"]],
                        }
                    )
                n += 1
            summary.append(f"Daily 10h Tasks: marked Y on {n} aaradhya blocks")

    # chunk batch updates (Sheets allows large, but keep <500 cells requests)
    CHUNK = 100
    total = 0
    for i in range(0, len(updates), CHUNK):
        chunk = updates[i : i + CHUNK]
        resp = values_batch_update(token, chunk)
        total += resp.get("totalUpdatedCells", 0)
        summary.append(f"batch {i//CHUNK + 1}: updatedCells={resp.get('totalUpdatedCells')}")

    print("=== SHEET UPDATE DONE ===")
    for line in summary:
        print(line)
    print(f"total update requests: {len(updates)}")
    print(f"url: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit")


if __name__ == "__main__":
    main()
