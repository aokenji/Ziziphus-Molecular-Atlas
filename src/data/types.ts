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
  doi?: string;
  evidenceType: 'primary-literature' | 'database-identification' | 'review';
}

export interface SpeciesReference {
  speciesId: string;
  plantPart?: string;
  notes?: string;
  referenceIds: string[];
}

export interface Species {
  id: string;
  slug: string;
  scientificName: string;
  commonNames: string[];
  description?: string;
}

export interface Compound {
  id: string;
  slug: string;
  preferredName: string;
  synonyms: string[];
  molecularFormula?: string;
  molecularWeight?: number;
  canonicalSmiles?: string;
  isomericSmiles?: string;
  inchi?: string;
  inchikey?: string;
  pubchemCid?: number;
  chemicalClass: string;
  verificationStatus: VerificationStatus;
  fieldVerification: FieldVerification;
  description?: string;
  structure2dSvg?: string;
  structure3dSdf?: string;
  species: SpeciesReference[];
  referenceIds: string[];
  featured?: boolean;
}
