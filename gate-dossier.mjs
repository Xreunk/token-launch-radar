// dossier_matches row of the gate, byte for byte:
// rebuild the dossier from out/ with the kit's vendor library and compare.
import { buildDossier } from './vendor/makefun-board.ts';
import { readFileSync, writeFileSync } from 'node:fs';

const outDir = process.argv[2] ?? 'out';
const rebuilt = buildDossier(outDir, { text_max_bytes: 65536 });
const stored = readFileSync(`${outDir}/dossier.json`);
const ok = Buffer.compare(Buffer.from(rebuilt), stored) === 0;
console.log(`dossier_matches: ${ok ? 'PASS' : 'FAIL'} (${stored.length} bytes stored, ${rebuilt.length} bytes rebuilt)`);
if (!ok) {
  writeFileSync('/tmp/dossier-rebuilt.json', rebuilt);
  console.log('rebuilt copy at /tmp/dossier-rebuilt.json');
  process.exit(1);
}
