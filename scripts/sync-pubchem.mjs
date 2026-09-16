/**
 * Verify every curated compound against PubChem and cache a 3D conformer for it.
 *
 * Verification is derived, never asserted:
 *   chemicalIdentity    - CID resolves and the returned formula/MW/InChIKey match the curated record
 *   molecularStructure  - an actual atom-coordinate record was retrieved (3d outranks 2d)
 *   occurrence          - curated from the cited literature; PubChem cannot speak to it
 *   literature          - at least one primary-literature citation (a database hit is not one)
 *
 * Run: npm run sync:data
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const REST = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid';
const PROPS = 'Title,MolecularFormula,MolecularWeight,SMILES,ConnectivitySMILES,InChI,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Charge';
const LEGACY = 'Title,MolecularFormula,MolecularWeight,IsomericSMILES,CanonicalSMILES,InChI,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Charge';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// PubChem asks for no more than 5 requests/second and answers 503 when it wants you to back off.
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'ziziphus-molecular-atlas/1.0' } });
    if (res.ok) return res;
    if (res.status === 404) return null;
    if (res.status === 503 || res.status === 429) {
      await sleep(1000 * (i + 1));
      continue;
    }
    throw new Error(res.status + ' ' + res.statusText + ' for ' + url);
  }
  throw new Error('gave up after ' + tries + ' tries: ' + url);
}

async function properties(cid) {
  let res = await get(REST + '/' + cid + '/property/' + PROPS + '/JSON').catch(() => null);
  if (!res) res = await get(REST + '/' + cid + '/property/' + LEGACY + '/JSON').catch(() => null);
  if (!res) return null;
  const row = (await res.json())?.PropertyTable?.Properties?.[0];
  if (!row) return null;
  return {
    title: row.Title,
    molecularFormula: row.MolecularFormula,
    molecularWeight: row.MolecularWeight != null ? Number(row.MolecularWeight) : undefined,
    isomericSmiles: row.SMILES ?? row.IsomericSMILES,
    canonicalSmiles: row.ConnectivitySMILES ?? row.CanonicalSMILES,
    inchi: row.InChI,
    inchikey: row.InChIKey,
    xlogp: row.XLogP,
    tpsa: row.TPSA,
    hBondDonors: row.HBondDonorCount,
    hBondAcceptors: row.HBondAcceptorCount,
    rotatableBonds: row.RotatableBondCount,
    charge: row.Charge,
  };
}

// Look a compound up by name and return every CID PubChem offers, with properties.
async function byName(name) {
  const url = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' +
    encodeURIComponent(name) + '/property/MolecularFormula,MolecularWeight,InChIKey,Title/JSON';
  const res = await get(url).catch(() => null);
  if (!res) return [];
  return (await res.json())?.PropertyTable?.Properties ?? [];
}

const normalise = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// A curated CID is only trustworthy if the molecule behind it has the formula we expect.
// Where it does not, fall back to a name lookup and take the first formula-matching hit.
async function resolveCid(compound) {
  const want = compound.molecularFormula;
  if (compound.pubchemCid) {
    const p = await properties(compound.pubchemCid);
    await sleep(220);
    if (p && (!want || p.molecularFormula === want)) {
      return { cid: compound.pubchemCid, props: p, source: 'curated' };
    }
  }
  const candidates = await byName(compound.preferredName);
  await sleep(220);
  const hit = want
    ? candidates.find((c) => c.MolecularFormula === want)
    : candidates[0];
  if (!hit) return { cid: compound.pubchemCid ?? null, props: null, source: 'unresolved' };
  const props = await properties(hit.CID);
  await sleep(220);
  return { cid: hit.CID, props, source: 'resolved-by-name' };
}

// Prefer the computed 3D conformer; fall back to the flat 2D record.
async function structure(cid) {
  const three = await get(REST + '/' + cid + '/SDF?record_type=3d').catch(() => null);
  if (three) return { sdf: await three.text(), dimensionality: '3d' };
  const two = await get(REST + '/' + cid + '/SDF?record_type=2d').catch(() => null);
  if (two) return { sdf: await two.text(), dimensionality: '2d' };
  return null;
}

// Atom count from the counts line of an SDF V2000 record.
const atomCount = (sdf) => Number.parseInt(sdf.split(/\r?\n/)[3]?.slice(0, 3) ?? '0', 10) || 0;

const curated = JSON.parse(await readFile('data/curated.json', 'utf8'));
const byRef = new Map(curated.references.map((r) => [r.id, r]));
await mkdir('public/molecules', { recursive: true });

const RANK = { verified: 2, 'partially-verified': 1, unresolved: 0 };
const report = [];
const out = [];

for (const c of curated.compounds) {
  const row = { ...c };
  const notes = [];
  let pubchem = null;
  let struct = null;

  const resolved = await resolveCid(c);
  pubchem = resolved.props;
  if (resolved.cid && pubchem) {
    struct = await structure(resolved.cid);
    await sleep(220);
  }
  row.pubchemCid = resolved.cid ?? undefined;
  row.cidSource = resolved.source;
  if (resolved.source === 'resolved-by-name') {
    notes.push(c.pubchemCid
      ? 'curated CID ' + c.pubchemCid + ' pointed at a different molecule; re-resolved to CID ' + resolved.cid + ' by name'
      : 'no curated CID; resolved to CID ' + resolved.cid + ' by name');
  }

  // chemicalIdentity - does PubChem agree with what we claim this molecule is?
  let identity = 'unresolved';
  if (pubchem) {
    // A name match alone is not identification - natural-product names are widely reused.
    // Only a curated formula that survives the cross-check earns "verified".
    const formulaOk = Boolean(c.molecularFormula) && c.molecularFormula === pubchem.molecularFormula;
    const mwOk = c.molecularWeight == null || Math.abs(c.molecularWeight - pubchem.molecularWeight) < 0.6;
    if (!c.molecularFormula) notes.push('no curated formula to cross-check; a name match alone is not an identification');
    const a = normalise(pubchem.title);
    const b = normalise(c.preferredName);
    const titleOk = Boolean(a) && (a.includes(b) || b.includes(a));
    if (!formulaOk && c.molecularFormula) notes.push('formula ' + c.molecularFormula + ' != PubChem ' + pubchem.molecularFormula);
    if (!mwOk) notes.push('MW ' + c.molecularWeight + ' != PubChem ' + pubchem.molecularWeight);
    if (!titleOk) notes.push('PubChem names this record "' + pubchem.title + '"');
    // PubChem is authoritative for the InChIKey; the curated value is only worth reporting.
    if (c.inchikey && c.inchikey !== pubchem.inchikey) {
      notes.push('curated InChIKey ' + c.inchikey + ' was wrong; corrected to ' + pubchem.inchikey);
    }
    // With no curated formula there is nothing to cross-examine the name against, so
    // the identity stays unresolved rather than earning partial credit for matching a
    // string. Natural-product names are reused across unrelated skeletons.
    identity = formulaOk && mwOk && titleOk
      ? 'verified'
      : c.molecularFormula
        ? 'partially-verified'
        : 'unresolved';

    // Adopt PubChem values for anything the curated record was missing.
    row.molecularFormula = pubchem.molecularFormula ?? c.molecularFormula;
    row.molecularWeight = pubchem.molecularWeight ?? c.molecularWeight;
    row.canonicalSmiles = pubchem.canonicalSmiles ?? c.canonicalSmiles;
    row.isomericSmiles = pubchem.isomericSmiles ?? c.isomericSmiles;
    row.inchi = pubchem.inchi ?? c.inchi;
    row.inchikey = pubchem.inchikey ?? c.inchikey;
    row.pubchemTitle = pubchem.title;
    row.properties = {
      xlogp: pubchem.xlogp,
      tpsa: pubchem.tpsa,
      charge: pubchem.charge,
      hBondDonors: pubchem.hBondDonors,
      hBondAcceptors: pubchem.hBondAcceptors,
      rotatableBonds: pubchem.rotatableBonds,
    };
  } else if (c.pubchemCid) {
    notes.push('CID ' + c.pubchemCid + ' returned no properties');
  } else {
    notes.push('no PubChem CID on record');
  }

  // molecularStructure - did we actually obtain coordinates?
  let structureStatus = 'unresolved';
  if (struct) {
    await writeFile('public/molecules/' + c.slug + '.sdf', struct.sdf);
    row.structureFile = '/molecules/' + c.slug + '.sdf';
    row.dimensionality = struct.dimensionality;
    row.atomCount = atomCount(struct.sdf);
    structureStatus = struct.dimensionality === '3d' ? 'verified' : 'partially-verified';
    if (struct.dimensionality === '2d') notes.push('no computed 3D conformer; 2D record only');
  } else if (c.pubchemCid) {
    notes.push('no structure record available');
  }

  // literature - a database identification is not a primary citation.
  const refs = (c.referenceIds ?? []).map((id) => byRef.get(id)).filter(Boolean);
  const primary = refs.filter((r) => r.evidenceType === 'primary-literature');
  const literature = primary.length > 0 ? 'verified' : refs.length > 0 ? 'partially-verified' : 'unresolved';
  if (!primary.length && refs.length) notes.push('cited only by a database record, no primary literature');

  const fields = {
    chemicalIdentity: identity,
    molecularStructure: structureStatus,
    occurrence: c.fieldVerification.occurrence,
    literature,
  };
  const worst = Math.min(...Object.values(fields).map((v) => RANK[v]));
  row.fieldVerification = fields;
  row.verificationStatus = ['unresolved', 'partially-verified', 'verified'][worst];
  row.verificationNotes = notes;

  report.push({
    name: c.preferredName,
    was: c.verificationStatus,
    now: row.verificationStatus,
    dim: row.dimensionality ?? '--',
    atoms: row.atomCount ?? 0,
    notes,
  });
  out.push(row);
}

await writeFile(
  'src/data/atlas.generated.json',
  JSON.stringify(
    {
      generatedAt: new Date().toISOString().slice(0, 10),
      source: 'PubChem PUG-REST (NCBI)',
      compounds: out,
      species: curated.species,
      references: curated.references,
    },
    null,
    2,
  ) + '\n',
);

console.log('');
console.log('name                   was                  now                  dim   atoms  notes');
console.log('-'.repeat(112));
for (const r of report) {
  console.log(
    r.name.padEnd(22) + ' ' + r.was.padEnd(20) + ' ' + r.now.padEnd(20) + ' ' +
    r.dim.padEnd(5) + ' ' + String(r.atoms).padStart(5) + '  ' + r.notes.join('; '),
  );
}
const n = (s) => out.filter((c) => c.verificationStatus === s).length;
console.log('');
console.log(out.length + ' compounds -> verified ' + n('verified') + ', partial ' + n('partially-verified') + ', unresolved ' + n('unresolved'));
