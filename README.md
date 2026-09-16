# Ziziphus Molecular Atlas

A molecular structure library for compounds reported in the genus *Ziziphus*, with 3D
conformers where available.
Every entry carries a cached atom-coordinate structure you can turn in three dimensions,
a verification status derived from evidence, and the literature it came from.

Live at **[ziziphus.tech](https://ziziphus.tech)**.

## What makes an entry "verified"

Statuses are computed at sync time by `scripts/sync-pubchem.mjs`, never written by hand.
A compound's overall status is its **weakest** check:

| Check | Passes when |
| --- | --- |
| Chemical identity | A PubChem record resolves *and* returns the molecular formula and weight the curated entry claims. A name match alone is not enough. |
| Molecular structure | Atom coordinates were retrieved and cached. A computed 3D conformer is verified; a flat 2D record is only partial. |
| Occurrence in *Ziziphus* | Carried over from the curated literature. A chemical database cannot settle this, so it is never upgraded automatically. |
| Literature support | At least one primary-literature citation. A database identification is provenance, not evidence. |

Every correction the sync makes is recorded on the compound and shown in the UI, so the
data can be audited from the interface rather than taken on trust.

This mattered: the first draft of this dataset carried five PubChem CIDs that pointed at
unrelated molecules (Jujuboside A's resolved to a C18H34N3O2S⁺ ion rather than a
C58H94O26 saponin) and several fabricated InChIKeys — one of which, `IYRMWMYOFI88PL`,
contains digits and so could not be a valid key at all. Those entries rendered
convincingly under the right names. Re-resolving every identifier by name and
cross-checking the formula is what the sync step exists to catch.

## Data pipeline

```
data/curated.json                 hand-maintained: names, classes, occurrence, citations
        │
        ├── scripts/sync-pubchem.mjs      resolve + verify against PubChem PUG-REST
        │        ├── public/molecules/*.sdf          cached 3D conformers
        │        └── src/data/atlas.generated.json   verified records
        │
        └── scripts/build-previews.mjs    PCA-projected 2D previews for the grid
                 └── src/data/previews.generated.json
```

Structures are committed to the repository rather than fetched at runtime, so the atlas
renders the same molecules offline as online and NCBI is not queried once per visitor.

```bash
npm run sync:data     # re-resolve everything against PubChem (network)
npm run build:icons   # regenerate app icons and the social card
```

## Rendering

The viewer is a hand-rolled three.js ball-and-stick renderer (`src/three/scene.ts`)
rather than an off-the-shelf molecular viewer, so the material, lighting and touch
behaviour belong to this interface instead of looking like lab software embedded in it.

- Atoms and bonds are each a single `InstancedMesh` — a 178-atom saponin is two draw calls.
- Bonds are split into two half-cylinders, each taking the colour of the atom it grows
  from, which is what makes a structure readable without labels.
- The camera fits the molecule's bounding sphere to whichever field-of-view angle is
  narrower, so the long axis never clips as it sweeps past.
- three.js is dynamically imported, so it never lands in the bundle that paints the grid.

The SDF reader (`src/lib/sdf.ts`) reads V2000 by column offset rather than by splitting
on whitespace. Past 99 atoms the counts and bond fields butt together — `178190` is 178
atoms and 190 bonds — and naive splitting silently corrupts the molecule.

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Sources

Structures and computed properties come from [PubChem](https://pubchem.ncbi.nlm.nih.gov/)
(NCBI). Occurrence and plant-part claims come from the primary literature cited on each
compound. An independent reference project — nothing here is medical advice or a claim of
pharmacological effect.
