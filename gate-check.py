#!/usr/bin/env python3
"""Local simulation of the token-radar-01 gate (RULES.txt, "The gate", 7 rows).

Usage:  python3 gate-check.py [out_dir] [snapshot_path]
Defaults: out/ and ../kit-token-radar-01/kit/token-radar-01-kit/input/snapshot.json
Exits 0 when every simulated check passes, 1 otherwise.
Does NOT check dossier_matches byte-for-byte (that needs the vendor library);
see gate-dossier.mjs for that row.
"""
import json
import os
import re
import struct
import sys
import zlib

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
SNAP = sys.argv[2] if len(sys.argv) > 2 else (
    "../kit-token-radar-01/kit/token-radar-01-kit/input/snapshot.json"
)

fails = []
passes = []


def check(name, ok, detail=""):
    (passes if ok else fails).append(name)
    print(("PASS " if ok else "FAIL ") + name + ((" — " + detail) if detail else ""))


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(33)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    if head[12:16] != b"IHDR":
        return None
    w, h = struct.unpack(">II", head[16:24])
    return (w, h)


def jpeg_size(path):
    with open(path, "rb") as f:
        data = f.read()
    if data[:2] != b"\xff\xd8":
        return None
    i = 2
    while i < len(data) - 1:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack(">HH", data[i + 5:i + 9])
            return (w, h)
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        length = struct.unpack(">H", data[i + 2:i + 4])[0]
        i += 2 + length
    return None


snap = json.load(open(SNAP))
snap_slugs = {p["slug"] for p in snap["protocols"]}
watchlist = snap["watchlist"]

# 1. dashboard_files
dash = os.path.join(OUT, "dashboard")
dfiles = []
total = 0
for root, _, names in os.walk(dash):
    for n in names:
        p = os.path.join(root, n)
        dfiles.append(p)
        total += os.path.getsize(p)
names = [os.path.basename(p) for p in dfiles]
has_html = "index.html" in names
has_css = any(n.endswith(".css") for n in names)
has_js = any(n.endswith(".js") for n in names)
http_hits = []
for p in dfiles:
    try:
        text = open(p, encoding="utf-8", errors="strict").read()
    except (UnicodeDecodeError, IsADirectoryError):
        continue
    for m in re.finditer(r"https?://[^\s\"'<>]+", text):
        http_hits.append(f"{os.path.relpath(p, dash)}: {m.group(0)[:60]}")
check("dashboard_files",
      has_html and has_css and has_js and len(dfiles) <= 400 and total <= 4 * 1024 * 1024
      and not http_hits and all(os.path.isfile(p) for p in dfiles),
      f"{len(dfiles)} files, {total} bytes, html={has_html} css={has_css} js={has_js}, "
      f"http refs={http_hits or 'none'}")

# 2. board_file
board_path = os.path.join(OUT, "board.json")
board = json.load(open(board_path))
rows = board["rows"] if isinstance(board, dict) else board
ok = isinstance(rows, list) and 100 <= len(rows) <= 4000 and os.path.getsize(board_path) <= 8 * 1024 * 1024
bad = []
for r in rows:
    if r["slug"] not in snap_slugs:
        bad.append(f"invented slug {r['slug']}")
    if not isinstance(r.get("name"), str) or not r["name"].strip():
        bad.append(f"empty name {r['slug']}")
    if not isinstance(r.get("rank"), int) or r["rank"] < 1:
        bad.append(f"bad rank {r['slug']}")
    iv = r.get("implied_value_usd")
    if not isinstance(iv, int) or iv < 1 or iv > 100_000_000_000_000:
        bad.append(f"bad implied {r['slug']}")
    if not isinstance(r.get("farm_steps"), list):
        bad.append(f"farm_steps not a list {r['slug']}")
check("board_file", ok and not bad,
      f"{len(rows)} rows, {os.path.getsize(board_path)} bytes, issues={bad[:3] or 'none'}")

# 3. sorted_by_value
ranks = [r["rank"] for r in rows]
implied = [r["implied_value_usd"] for r in rows]
ordered = sorted(rows, key=lambda r: r["rank"])
mono = all(ordered[i]["implied_value_usd"] >= ordered[i + 1]["implied_value_usd"]
           for i in range(len(ordered) - 1))
check("sorted_by_value",
      sorted(ranks) == list(range(1, len(rows) + 1)) and mono and len(set(implied)) > 1,
      f"ranks 1..{len(rows)} once each, non-increasing={mono}, "
      f"distinct implied={len(set(implied))}")

# 4. coverage
have = {r["slug"] for r in rows}
missing = [s for s in watchlist if s not in have]
check("coverage", not missing,
      f"watchlist {len(watchlist)} slugs, missing={missing or 'none'}")

# 5. farm_steps
bad_steps = []
for r in rows:
    steps = r["farm_steps"]
    if not 3 <= len(steps) <= 12:
        bad_steps.append(f"{r['slug']}: {len(steps)} steps")
        continue
    for s in steps:
        if not 20 <= len(s.strip()) <= 600:
            bad_steps.append(f"{r['slug']}: step {len(s.strip())} chars")
check("farm_steps", not bad_steps,
      f"issues={bad_steps[:3] or 'none'}")

# 6. screenshots
shots_dir = os.path.join(OUT, "screenshots")
shots = sorted(n for n in os.listdir(shots_dir) if not n.startswith("."))
bad_shots = []
for n in shots:
    p = os.path.join(shots_dir, n)
    size = os.path.getsize(p)
    dims = png_size(p) or jpeg_size(p)
    if size > 512 * 1024:
        bad_shots.append(f"{n}: {size} bytes over cap")
    if dims is None:
        bad_shots.append(f"{n}: not a whole PNG/JPEG")
    else:
        long_side, short_side = max(dims), min(dims)
        if long_side > 1440 or short_side < 800:
            bad_shots.append(f"{n}: {dims} outside limits")
check("screenshots", 3 <= len(shots) <= 4 and not bad_shots,
      f"{len(shots)} images ({', '.join(shots)}), issues={bad_shots or 'none'}")

# 7. dossier_matches (size only here; byte-for-byte is gate-dossier.mjs)
dossier_path = os.path.join(OUT, "dossier.json")
dsize = os.path.getsize(dossier_path)
dossier = json.load(open(dossier_path))
check("dossier_size", dsize <= 1_500_000,
      f"{dsize} bytes, schema={dossier.get('schema')}, "
      f"images={[i.get('name') for i in dossier.get('images', [])]}")

print()
print(f"{len(passes)} passed, {len(fails)} failed" + (f": {fails}" if fails else ""))
sys.exit(1 if fails else 0)
