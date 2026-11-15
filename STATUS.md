# Token Radar (make.fun, token-radar-01) — status 2026-11-15 ~12:45 WIB

Bounty: $1,325, top 10 share ($1,000 / $50 x4 / $25 x5). Deadline **2026-12-14 17:00 WIB**
(2026-12-14T10:00:00Z). User picked it 2026-11-15 12:21 WIB ("Token launch radar ($1.325)").
Escrow funded at open, prizes paid **USDC on Solana only**.

## What is done (verified 2026-11-15, this run)

- Custom entry, NOT the starter: model `radar-2` (base x growth x maturity x
  chains-reach multiplier), dashboard rewritten (board + detail view + live-token
  set + model sandbox), 178 rows vs starter's 200. Only `vendor/` is taken
  verbatim from the kit, as its header requires.
- `out/board.json`: **178 rows, all gate checks pass** — ranks exactly 1..178,
  implied values non-increasing (rank 1 Steakhouse Financial $674,108,739),
  all 40 watchlist slugs covered, every slug in the snapshot, farm steps 3–12
  strings of 20–600 chars each, 260,322 bytes (< 8 MiB).
- `dashboard/`: index.html + app.css + app.js, 24,737 bytes total (< 64 KiB
  dossier text cap), no http(s) in any attribute/CSS/JS import. The only URL
  anywhere is the DefiLlama source attribution string inside `out/data.js`
  (visible text, not a fetch).
- `out/data.js` generated from the sealed snapshot (758 protocols, 40 watchlist).
- **RESOLVED 2026-11-15 ~12:40 WIB — the two blockers from the 12:35 note:**
  - `2-detail.png` re-taken (1280x1000, 141 KB) and **verified by looking at
    it**: Steakhouse Financial detail view, stats grid, model breakdown,
    six-step farm plan, all legible. The blank shot was a
    `chrome --screenshot` scroll artifact; the re-take uses Playwright with
    a fresh page per shot + scrollIntoView + settle wait
    (`tools/render-shots.mjs`).
  - `main.ts` re-run: `out/dossier.json` now exists (597,330 bytes,
    < 1.5 MiB) and is **byte-for-byte what buildDossier writes**
    (`node gate-dossier.mjs out` → PASS).
  - All 7 gate rows pass locally (`python3 gate-check.py out` → 7/7).
  - Determinism: two `main.ts` runs into separate dirs diffed identical.
  - Screenshots 1 and 3 re-verified by eye in the same pass (board, and
    Risk Curators filter showing "33 of 178 rows").
- Render path that works on this VM, documented in `tools/render-shots.mjs`:
  Google Chrome 157 installed from the official .deb
  (`/usr/bin/google-chrome`) + playwright-core with executablePath.
  `/opt/meta-chromium/chrome` refuses to start (Hatch WebGL domain policy);
  Playwright's own browser download is blocked in this sandbox.
- Node **v24.22.1** (requirement is 22.18+; newer majors count).

## What the user still has to decide (nothing to execute yet)

1. **Public GitHub repo** for the entry (`makefun submit --competition
   token-radar-01 --repo-url <url> --commit <sha>`; or `--source <dir>`
   bundle instead). Repo must be created after the competition opened, carry
   an OSI license (MIT LICENSE already in repo), and be owned by the signed-in
   GitHub account (or hold `.makefun/owner.json` naming a linked wallet).
   No repo exists yet; no git repo initialised in `token-radar-01/`.
   Note: the source-bundle path needs `node cli/makefun.mjs init` run in the
   empty repo BEFORE building (transcript-gate anchor); this build was made
   without that step, so the GitHub-repo path is the clean one.
2. **Transcripts** of the sessions that built the entry must ride along
   with the submission (transcript gate: ≥30% authored coverage, ≥5 turns,
   ≥2 revising messages).
3. **Solana wallet for the payout.** Prizes are USDC on Solana only, and with
   the escrow funded, the entry must be signed by a Solana wallet linked to
   the make.fun account. The user's main wallet (baw) is BSC and cannot link.
   He needs a Solana wallet (e.g. Phantom on his phone) linked to make.fun,
   or a fresh keypair via `makefun register` — do NOT create a wallet for him
   without his say-so. Sign-in itself is `makefun login` (approval code on
   the make.fun page, user taps approve).
4. Submission limits: max 5/day, 10 total; last submission before the
   deadline is the final entry. Plenty of time — deadline is 29 days away.

## Files

- Entry: `~/workspace/makefun/token-radar-01/` (main.ts, lib/model.ts,
  dashboard/, out/, screenshots/, tools/render-shots.mjs, gate-check.py,
  gate-dossier.mjs, BUILD_NOTES.md, STATUS.md)
- Kit + sealed snapshot: `~/workspace/makefun/kit-token-radar-01/kit/token-radar-01-kit/`
  (RULES.txt, competition.yaml, input/snapshot.json, starter/)
- CLI: `node ~/workspace/makefun/kit-token-radar-01/kit/token-radar-01-kit/cli/makefun.mjs --help`
