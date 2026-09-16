/**
 * Minimal MDL SDF / MOL V2000 reader, scoped to what PubChem returns.
 *
 * V2000 is a fixed-width format, not a whitespace-delimited one. Past 99 atoms the
 * counts and bond-block fields butt up against each other ("178190" is 178 atoms and
 * 190 bonds), so every field here is read by column offset. Jujuboside A trips this.
 */

export interface Atom {
  element: string;
  x: number;
  y: number;
  z: number;
}

export interface Bond {
  /** Zero-based index into `atoms`. */
  a: number;
  b: number;
  /** 1 single, 2 double, 3 triple, 4 aromatic. */
  order: number;
}

export interface Molecule {
  title: string;
  atoms: Atom[];
  bonds: Bond[];
  /** True when at least one atom sits off the z=0 plane. */
  is3d: boolean;
}

const int = (line: string, from: number, to: number): number =>
  Number.parseInt(line.slice(from, to).trim(), 10) || 0;

export function parseSdf(text: string): Molecule {
  const lines = text.split(/\r?\n/);
  if (lines.length < 4) throw new Error('SDF too short to contain a counts line');

  const title = lines[0].trim();
  const counts = lines[3];
  const atomCount = int(counts, 0, 3);
  const bondCount = int(counts, 3, 6);
  if (atomCount <= 0) throw new Error('SDF declares no atoms');

  const atoms: Atom[] = [];
  for (let i = 0; i < atomCount; i++) {
    const line = lines[4 + i];
    if (line == null) throw new Error(`SDF ended early: expected ${atomCount} atoms`);
    atoms.push({
      x: Number.parseFloat(line.slice(0, 10)),
      y: Number.parseFloat(line.slice(10, 20)),
      z: Number.parseFloat(line.slice(20, 30)),
      element: line.slice(31, 34).trim(),
    });
  }

  const bonds: Bond[] = [];
  for (let i = 0; i < bondCount; i++) {
    const line = lines[4 + atomCount + i];
    if (line == null) break;
    // Bond blocks are 1-based; store zero-based so they index `atoms` directly.
    const a = int(line, 0, 3) - 1;
    const b = int(line, 3, 6) - 1;
    if (a < 0 || b < 0 || a >= atomCount || b >= atomCount) continue;
    bonds.push({ a, b, order: int(line, 6, 9) || 1 });
  }

  const is3d = atoms.some((a) => Math.abs(a.z) > 1e-3);
  return { title, atoms, bonds, is3d };
}

/** Drop hydrogens and any bond that touched one, re-indexing what remains. */
export function withoutHydrogens(mol: Molecule): Molecule {
  const keep: number[] = [];
  const remap = new Map<number, number>();
  mol.atoms.forEach((atom, i) => {
    if (atom.element === 'H') return;
    remap.set(i, keep.length);
    keep.push(i);
  });
  return {
    ...mol,
    atoms: keep.map((i) => mol.atoms[i]),
    bonds: mol.bonds
      .filter((bond) => remap.has(bond.a) && remap.has(bond.b))
      .map((bond) => ({ a: remap.get(bond.a)!, b: remap.get(bond.b)!, order: bond.order })),
  };
}

/** Geometric centre of the atoms, used to centre the molecule at the origin. */
export function centroid(atoms: Atom[]): [number, number, number] {
  if (!atoms.length) return [0, 0, 0];
  let x = 0;
  let y = 0;
  let z = 0;
  for (const a of atoms) {
    x += a.x;
    y += a.y;
    z += a.z;
  }
  return [x / atoms.length, y / atoms.length, z / atoms.length];
}

/** Largest distance from the centroid, used to frame the camera. */
export function boundingRadius(atoms: Atom[], centre: [number, number, number]): number {
  let max = 0;
  for (const a of atoms) {
    const dx = a.x - centre[0];
    const dy = a.y - centre[1];
    const dz = a.z - centre[2];
    max = Math.max(max, Math.hypot(dx, dy, dz));
  }
  return max || 1;
}
