# CSH Registry — companion site

Interactive companion to the **Conformational Soft Hash (CSH) v2** manuscript.
Browse, compare, and search 64-bit conformer hashes that are really registered
on the Ethereum **Sepolia** testnet.

The hero is the thesis: a live bit-diff showing that two conformers of the same
molecule differ in a handful of bits, while two different molecules differ in
~32 — the soft-collision property the paper measures, made visible.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`, no config file)
- `react-router-dom` (HashRouter — survives GitHub Pages refreshes)
- No backend: all data is pre-computed JSON in `public/data/`

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview  # serve the production build
```

## Data provenance

Everything in `public/data/` is derived from the real registry, not mocked.

- `conformers.json` — the **64 unique on-chain conformers** (tamoxifen 20,
  imatinib 21, atorvastatin 23), extracted from the indexer SQLite DB
  (`csh_indexer.db`). Each row carries its real `tx_hash` and `block_number`,
  so every conformer deep-links to its exact Sepolia Etherscan transaction.
- `stats.json` — headline figures (within/cross-molecule Hamming separation),
  the adversarial collision study (26 molecules, 130 hashes, 8,125 cross pairs,
  0 collisions at H <= 15), and the two real hash pairs used by the hero.

Hashes are **never** regenerated in the browser or the build — RDKit version
drift would desync them from what is anchored on-chain. To refresh the data,
re-run the extraction against an updated `csh_indexer.db`.

Registry contract (Sepolia): `0x2081c6b3216Bb21811c179C195cbe9490C9F6572`

## Deploy to GitHub Pages

`vite.config.ts` uses `base: "./"`, so the build works on any Pages subpath
(e.g. `/csh-registry-demo/`) or a custom domain without edits.

A workflow is included at `.github/workflows/deploy.yml`. In the repo:
**Settings -> Pages -> Build and deployment -> Source = GitHub Actions**, then
push to `main`. The site builds and publishes automatically.

## Roadmap

- **Browse** — filterable conformer table with per-row Etherscan links ✓
- **Compare** — pick any two conformers, read Hamming off a bit diff ✓
- **Search** — LSH-banding similarity search with a threshold-`T` slider
- **3D viewer** — 3Dmol.js conformer rendering
