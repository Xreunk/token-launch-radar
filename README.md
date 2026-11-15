# Token Launch Radar

Ranks pre-token DeFi protocols by what their token launch would be worth,
with a farm plan for each — an entry for the
[make.fun](https://make.fun) bounty **"Build the best token launch radar"**
(`token-radar-01`, $1,325 total, #1 $1,000).

- **Board:** 178 protocols, rank 1 is Steakhouse Financial at ~$674.1M
  implied launch value. Every row carries a 6-step farm plan with costs
  and time.
- **Model:** `lib/model.ts` scores each protocol from the sealed
  DefiLlama snapshot only — TVL, 7-day growth, age with no token, and
  chain count. No hardcoded list of names.
- **Dashboard:** `dashboard/` is a static page with no network — board,
  detail view per protocol, filters, and a model sandbox.

## Run it

Requires Node 22.18+ (standard library only, no install, no network):

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

It writes `board.json`, `data.js`, `dashboard/`, `screenshots/` and
`dossier.json` into the output directory. Two runs write byte-identical
output.

See [BUILD_NOTES.md](BUILD_NOTES.md) for the model, the gate status
(7/7 checks pass locally), and the submission steps.
