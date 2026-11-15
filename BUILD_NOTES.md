# Token Radar — build notes

Entry for the make.fun bounty **"Build the best token launch radar"**
(competition `token-radar-01`, $1,325 total, #1 $1,000, deadline
2026-12-14 10:00 UTC). Custom entry, not the starter: model `radar-2`,
dashboard rewritten, 178 rows vs the starter's 200. Only `vendor/` is
taken verbatim from the kit, as its header requires.

## How to run

Requires **Node 22.18+** (this machine: **Node v24.22.1** — newer majors
count per the kit). Standard library only; no install step, no network.

```sh
cd ~/workspace/makefun/token-radar-01
MAKEFUN_OUTPUT_DIR=out node main.ts \
  --input ../kit-token-radar-01/kit/token-radar-01-kit/input/snapshot.json
```

With no `--input` it reads `/input/snapshot.json` (the grader's mount);
with no `--output` it writes to `$MAKEFUN_OUTPUT_DIR`, else `/output`.
`--input` also accepts a directory holding `snapshot.json`. Runs in well
under a second; two runs write byte-identical output (verified with
`diff -r` on 2026-11-15).

## How board.json was produced

The sealed snapshot is the kit's `input/snapshot.json` (DefiLlama
`https://api.llama.fi/protocols`, fetched 2026-11-14T01:18:33.201Z,
`as_of` 2026-11-14): 758 protocols with TVL ≥ $5M, floor $50M, and a
40-slug `watchlist` the kit computed from DefiLlama's own records.
No protocol data was invented and nothing was fetched live for the board.

`lib/model.ts` (`buildRadar`) scores every protocol:

- **Watchlist (40):** the snapshot's own list — TVL ≥ $50M, no token
  recorded (`gecko_id` and `symbol` null), no version-marker name, no
  `parentProtocol`, category not Bridge / Canonical Bridge / Liquid
  Staking / Liquid Restaking / Restaked BTC / CEX, no whole word
  wrapped/staked/staking in the name, name not starting with an exchange
  name. All 40 are on the board.
- **Early rows (138):** every pre-token protocol below the floor that
  passes the same rankability rule (no token, not versioned, not a
  wrapped/staked product, not an exchange-branded or CEX/Bridge-type
  record). The board is the watchlist + all of them: **178 rows**.
- **Live tokens set aside (24):** the largest token-bearing protocols by
  market cap, shown on the dashboard at the market's own value, not ranked.

**Implied value — model radar-2** (same formula for every row, no
protocol name special-cased):

```
implied = TVL × 0.25
        × (1 + clamp(change_7d, -60%, +120%) × 0.5)
        × (0.6 + 0.4 × min(age_days, 1095) / 1095)      age unknown → 365
        × (1 + 0.04 × min(chains − 1, 6))
```

Rank 1 is Steakhouse Financial, $674,108,739 (TVL $2.75B, −2.2% 7d,
543 days tracked, 11 chains). Every row carries a 6-step farm plan:
category-aware action, capital by TVL tier ($250/$150/$100/$50), hold
days by age (60/45/30), each step with a cost and a time.

One honest limitation, stated on the dashboard: the snapshot's ten
fields do not include `parentProtocol`, so a row may be a child of
another protocol (42 of the 138 early rows have a parent in live
DefiLlama data, checked 2026-11-15). The board does not hide that.

## The dashboard

`dashboard/` is a static page with no network: `index.html` (structure),
`app.css` (one dark palette, ink and amber), `app.js` (renders
`../data.js`, the dataset `main.ts` writes). It has the board with
search / category / chain / watchlist-only filters and four sorts, a
click-to-open detail view per protocol (stats, model breakdown, farm
steps), the live-token table, and a model sandbox whose sliders re-rank
the page live without touching the submitted board. Deep links:
`#detail=<slug>`, `#cat=<category>`, `#chain=<chain>`.

## Screenshots

Three PNGs in `screenshots/` (and copied into `out/screenshots/` by
`main.ts`): `1-board.png` (1280×800, the board), `2-detail.png`
(1280×1000, Steakhouse Financial's detail view with its farm plan),
`3-filtered.png` (1280×800, board filtered to Risk Curators, 33 rows).
All were rendered from the real page and checked by eye. Render them
again with `node tools/render-shots.mjs` — see the header there for the
working browser path on this machine (system Google Chrome +
playwright-core; the bundled `/opt/meta-chromium/chrome` refuses to
start here and Playwright's browser download is blocked).

## Gate status (2026-11-15, local simulation)

All seven gate rows pass — `python3 gate-check.py out` (6 rows) plus
`node gate-dossier.mjs out` (dossier_matches, byte-for-byte):

- dashboard_files: index.html + app.css + app.js, 24,737 bytes, no
  http(s) address in any attribute, CSS file or JS import.
- board_file: 178 rows (100–4,000), 260,322 bytes (< 8 MiB), every slug
  in the snapshot, names non-empty, implied values positive whole ≤ 1e14.
- sorted_by_value: ranks exactly 1..178, implied non-increasing,
  178 distinct values.
- coverage: all 40 watchlist slugs present.
- farm_steps: 6 steps per row, each 130–193 chars (20–600 allowed).
- screenshots: 3 images, 139–148 KB each (< 512 KiB), long side ≤ 1440,
  short side ≥ 800.
- dossier_matches: `out/dossier.json` is byte-for-byte what
  `buildDossier` writes (597,330 bytes, < 1.5 MiB); dashboard source
  (25,004 bytes) fits whole in the dossier text cap.

Determinism: two `main.ts` runs into separate dirs diffed identical.

## What is still needed to submit

Nothing is submitted yet, and nothing in this repo does so. The user
decides submission; these are the remaining steps, all on his side:

1. **Public GitHub repo** for the entry (created after the competition
   opened 2026-11-14; MIT LICENSE is already in the repo; the repo must
   be owned by the signed-in GitHub account, or hold
   `.makefun/owner.json` naming a linked wallet). No repo exists yet and
   no git repo is initialised in `token-radar-01/`. Submit with the kit
   CLI: `node <kit>/cli/makefun.mjs --help` (`makefun submit
   --competition token-radar-01 --repo-url <url> --commit <sha>`), or a
   source bundle (`--source <dir>`) instead.
   - Source-bundle path: run `node cli/makefun.mjs init` in the empty
     repo FIRST, before building — the init anchor line must appear in
     the transcripts before the first counted write (transcript gate,
     `thinking_fresh`). This entry was built without that step, so the
     GitHub-repo path is the clean one; a bundle would need the anchor
     history, which this build does not have.
2. **Transcripts:** the submission must carry the agent sessions that
   built the entry (this session's record). The transcript gate needs ≥
   30% authored-line coverage, ≥ 5 assistant turns with text, and ≥ 2
   revising messages touching a file — this build's history satisfies
   those on its face, but the gate runs on the uploaded bundle.
3. **Solana wallet for the payout.** Prizes are USDC on Solana only,
   and the reward is locked in escrow, so the entry must be signed by a
   Solana wallet linked to the make.fun account. The user's main wallet
   (Binance Agentic Wallet) is BSC and cannot link. He needs a Solana
   wallet (e.g. Phantom on his phone) linked to make.fun, or a fresh
   keypair via `makefun register` — do NOT create one for him without
   his say-so.
4. Submission limits: max 5/day, 10 total; the last submission before
   the deadline is the final entry. Deadline is 29 days away, so there
   is time to submit, get a dev grade, and revise.

## Files

- `main.ts` — entrypoint (Node 22 stdlib only)
- `lib/model.ts` — snapshot parsing, radar-2 model, farm plans, data.js
- `vendor/makefun-board.ts` — kit library, verbatim (dossier builder)
- `dashboard/index.html`, `dashboard/app.css`, `dashboard/app.js`
- `screenshots/1-board.png`, `2-detail.png`, `3-filtered.png`
- `out/` — build output (board.json, data.js, dashboard/, screenshots/,
  dossier.json)
- `LICENSE` (MIT), `BUILD_NOTES.md` (this file), `STATUS.md` (status log)
- `gate-check.py`, `gate-dossier.mjs` — local gate simulation
- `tools/render-shots.mjs` — screenshot renderer
- Kit + sealed snapshot (outside this repo):
  `~/workspace/makefun/kit-token-radar-01/kit/token-radar-01-kit/`
