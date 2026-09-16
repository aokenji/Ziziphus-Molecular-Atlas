/** Small presentation helpers shared across screens. */

export interface FormulaToken {
  text: string;
  kind: 'element' | 'count' | 'charge';
}

/**
 * Split a Hill-notation formula so counts can render as real subscripts.
 * "C19H24NO3+" -> C 19 H 24 N O 3 +
 */
export function tokenizeFormula(formula: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  const pattern = /([A-Z][a-z]?)|(\d+)|([+-]\d*|\d*[+-])/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(formula)) !== null) {
    if (match[1]) tokens.push({ text: match[1], kind: 'element' });
    else if (match[2]) tokens.push({ text: match[2], kind: 'count' });
    else if (match[3]) tokens.push({ text: match[3], kind: 'charge' });
  }
  return tokens;
}

/** Molecular weights are quoted to 2 dp; integers keep a trailing zero pair. */
export const formatWeight = (value: number): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatNumber = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/** Authors are stored as one string; long lists get an et al. */
export function shortenAuthors(authors: string, keep = 3): string {
  const parts = authors.split(/,\s*/);
  if (parts.length <= keep) return authors;
  return `${parts.slice(0, keep).join(', ')} et al.`;
}

export const doiUrl = (doi: string): string => `https://doi.org/${doi}`;

export const pubchemUrl = (cid: number): string =>
  `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`;
