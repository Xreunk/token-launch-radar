# token-launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/Xreunk/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/Xreunk/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token launch radar: ranks pre-token DeFi protocols by what their token launch would be worth, with a farm plan for each.

- **Board:** 178 protocols, rank 1 is Steakhouse Financial at ~$674.1M
  implied launch value. Every row carries a 6-step farm plan with costs
  and time.
- **Model:** `lib/model.ts` scores each protocol from the sealed
  DefiLlama snapshot only — TVL, 7-day growth, age with no token, and
  chain count. No hardcoded list of names.
- **Dashboard:** `dashboard/` is a static page with no network — board,
  detail view per protocol, filters, and a model sandbox.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

Requires Node 22.18+ (standard library only, no install, no network).
It writes `board.json`, `data.js`, `dashboard/`, `screenshots/` and
`dossier.json` into the output directory. Two runs write byte-identical
output.

See [BUILD_NOTES.md](BUILD_NOTES.md) for the model, the gate status
(7/7 checks pass locally), and the submission steps.

---

<sub>Entered on [make.fun](https://make.fun/?ref=penmmk13&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
