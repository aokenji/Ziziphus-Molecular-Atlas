/**
 * Element palette and radii.
 *
 * The colours are CPK-adjacent but retuned for a near-black canvas, and deliberately
 * reuse the interface palette: oxygen is the same rose as an unresolved badge, sulfur
 * the same amber as a partial one. Literal CPK red/yellow vibrate badly on #0a0c10.
 */

export interface ElementInfo {
  name: string;
  /** Surface colour, hex. */
  color: string;
  /** Van der Waals radius in angstrom, for space-filling. */
  vdw: number;
  /** Covalent radius in angstrom, for ball-and-stick sizing. */
  covalent: number;
}

const ELEMENTS: Record<string, ElementInfo> = {
  H: { name: 'Hydrogen', color: '#d8d5cc', vdw: 1.2, covalent: 0.31 },
  C: { name: 'Carbon', color: '#8b94a3', vdw: 1.7, covalent: 0.76 },
  N: { name: 'Nitrogen', color: '#5b8dee', vdw: 1.55, covalent: 0.71 },
  O: { name: 'Oxygen', color: '#ff6b5e', vdw: 1.52, covalent: 0.66 },
  S: { name: 'Sulfur', color: '#f5c451', vdw: 1.8, covalent: 1.05 },
  P: { name: 'Phosphorus', color: '#ff9f5e', vdw: 1.8, covalent: 1.07 },
  F: { name: 'Fluorine', color: '#7fe3a8', vdw: 1.47, covalent: 0.57 },
  Cl: { name: 'Chlorine', color: '#3ddc84', vdw: 1.75, covalent: 1.02 },
  Br: { name: 'Bromine', color: '#c98a5e', vdw: 1.85, covalent: 1.2 },
  I: { name: 'Iodine', color: '#a98ae0', vdw: 1.98, covalent: 1.39 },
  Na: { name: 'Sodium', color: '#8f7ce8', vdw: 2.27, covalent: 1.66 },
  K: { name: 'Potassium', color: '#8f7ce8', vdw: 2.75, covalent: 2.03 },
  Ca: { name: 'Calcium', color: '#6fbf8f', vdw: 2.31, covalent: 1.76 },
  Mg: { name: 'Magnesium', color: '#6fbf8f', vdw: 1.73, covalent: 1.41 },
};

const UNKNOWN: ElementInfo = { name: 'Unknown', color: '#6f7683', vdw: 1.6, covalent: 0.8 };

export const elementInfo = (symbol: string): ElementInfo => ELEMENTS[symbol] ?? UNKNOWN;

/** Element symbols present, ordered by how many atoms carry them. */
export function elementTally(symbols: string[]): { symbol: string; count: number; info: ElementInfo }[] {
  const counts = new Map<string, number>();
  for (const s of symbols) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([symbol, count]) => ({ symbol, count, info: elementInfo(symbol) }));
}
