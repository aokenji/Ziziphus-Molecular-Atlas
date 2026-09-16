/**
 * Typed access to the generated atlas.
 *
 * `atlas.generated.json` is written by scripts/sync-pubchem.mjs and is the single
 * source of truth at runtime - nothing here re-derives chemistry, it only indexes.
 */
import atlasData from '../data/atlas.generated.json';
import previewData from '../data/previews.generated.json';

export type VerificationStatus = 'verified' | 'partially-verified' | 'unresolved';

export interface FieldVerification {
  chemicalIdentity: VerificationStatus;
  molecularStructure: VerificationStatus;
  occurrence: VerificationStatus;
  literature: VerificationStatus;
}

export interface Reference {
  id: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  evidenceType: 'primary-literature' | 'database-identification' | 'review';
}

export interface Species {
  id: string;
  slug: string;
  scientificName: string;
  commonNames: string[];
  description?: string;
}

export interface Occurrence {
  speciesId: string;
  plantPart?: string;
  notes?: string;
  referenceIds: string[];
}

export interface ComputedProperties {
  xlogp?: number;
  tpsa?: number;
  charge?: number;
  hBondDonors?: number;
  hBondAcceptors?: number;
  rotatableBonds?: number;
}

export interface Compound {
  id: string;
  slug: string;
  preferredName: string;
  synonyms: string[];
  chemicalClass: string;
  molecularFormula?: string;
  molecularWeight?: number;
  canonicalSmiles?: string;
  isomericSmiles?: string;
  inchi?: string;
  inchikey?: string;
  pubchemCid?: number;
  pubchemTitle?: string;
  cidSource?: 'curated' | 'resolved-by-name' | 'unresolved';
  verificationStatus: VerificationStatus;
  fieldVerification: FieldVerification;
  verificationNotes: string[];
  properties?: ComputedProperties;
  structureFile?: string;
  dimensionality?: '3d' | '2d';
  atomCount?: number;
  species: Occurrence[];
  referenceIds: string[];
  featured?: boolean;
  notes?: string;
}

export interface Preview {
  size: number;
  /** [x, y, elementSymbol] in a `size` x `size` box. */
  atoms: [number, number, string][];
  /** [atomIndexA, atomIndexB, bondOrder] */
  bonds: [number, number, number][];
}

interface AtlasFile {
  generatedAt: string;
  source: string;
  compounds: Compound[];
  species: Species[];
  references: Reference[];
}

const atlas = atlasData as unknown as AtlasFile;
const previews = previewData as unknown as Record<string, Preview>;

export const compounds: Compound[] = atlas.compounds;
export const species: Species[] = atlas.species;
export const references: Reference[] = atlas.references;
export const generatedAt = atlas.generatedAt;
export const dataSource = atlas.source;

const compoundBySlug = new Map(compounds.map((c) => [c.slug, c]));
const speciesById = new Map(species.map((s) => [s.id, s]));
const speciesBySlug = new Map(species.map((s) => [s.slug, s]));
const referenceById = new Map(references.map((r) => [r.id, r]));

export const getCompound = (slug: string): Compound | undefined => compoundBySlug.get(slug);
export const getSpeciesById = (id: string): Species | undefined => speciesById.get(id);
export const getSpeciesBySlug = (slug: string): Species | undefined => speciesBySlug.get(slug);
export const getPreview = (slug: string): Preview | undefined => previews[slug];

export const getReferences = (ids: string[]): Reference[] =>
  ids.map((id) => referenceById.get(id)).filter((r): r is Reference => Boolean(r));

/** Compounds reported from a given species, best-verified first. */
export const compoundsForSpecies = (speciesId: string): Compound[] =>
  compounds.filter((c) => c.species.some((o) => o.speciesId === speciesId)).sort(byConfidence);

const STATUS_RANK: Record<VerificationStatus, number> = {
  verified: 0,
  'partially-verified': 1,
  unresolved: 2,
};

export const byConfidence = (a: Compound, b: Compound): number =>
  STATUS_RANK[a.verificationStatus] - STATUS_RANK[b.verificationStatus] ||
  a.preferredName.localeCompare(b.preferredName);

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  verified: 'Verified',
  'partially-verified': 'Partial',
  unresolved: 'Unresolved',
};

export const FIELD_LABEL: Record<keyof FieldVerification, string> = {
  chemicalIdentity: 'Chemical identity',
  molecularStructure: 'Molecular structure',
  occurrence: 'Occurrence in Ziziphus',
  literature: 'Literature support',
};

/** Distinct chemical classes with counts, largest group first. */
export function classTally(): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of compounds) counts.set(c.chemicalClass, (counts.get(c.chemicalClass) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function statusTally(): Record<VerificationStatus, number> {
  return {
    verified: compounds.filter((c) => c.verificationStatus === 'verified').length,
    'partially-verified': compounds.filter((c) => c.verificationStatus === 'partially-verified').length,
    unresolved: compounds.filter((c) => c.verificationStatus === 'unresolved').length,
  };
}

/** Substring match across name, synonyms, class, formula and identifiers. */
export function searchCompounds(query: string, pool: Compound[] = compounds): Compound[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  return pool.filter((c) =>
    [
      c.preferredName,
      c.chemicalClass,
      c.molecularFormula ?? '',
      c.inchikey ?? '',
      String(c.pubchemCid ?? ''),
      ...c.synonyms,
    ]
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
}
