/**
 * Precompute a flat 2D projection of every cached conformer.
 *
 * The atlas grid draws these as inline SVG, so the list screen costs no WebGL context
 * and no SDF fetches. PubChem conformers arrive in an arbitrary orientation, so each
 * molecule is rotated onto its own two principal axes first - that puts the widest
 * face of the molecule toward the viewer instead of whatever angle it was stored at.
 *
 * Run: npm run sync:data
 */
import { readFile, writeFile } from 'node:fs/promises';
import { parseSdf, withoutHydrogens, centroid } from '../src/lib/sdf.ts';

const BOX = 100;
const PAD = 8;

/** Eigen-decomposition of a symmetric 3x3 matrix by cyclic Jacobi rotation. */
function eigen(m) {
  const a = m.map((row) => row.slice());
  const v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];
  for (let sweep = 0; sweep < 64; sweep++) {
    const off = Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]);
    if (off < 1e-12) break;
    for (const [p, q] of pairs) {
      if (Math.abs(a[p][q]) < 1e-15) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const sign = theta >= 0 ? 1 : -1;
      const t = sign / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1);
      const s = t * c;
      for (let k = 0; k < 3; k++) {
        const kp = a[k][p];
        const kq = a[k][q];
        a[k][p] = c * kp - s * kq;
        a[k][q] = s * kp + c * kq;
      }
      for (let k = 0; k < 3; k++) {
        const pk = a[p][k];
        const qk = a[q][k];
        a[p][k] = c * pk - s * qk;
        a[q][k] = s * pk + c * qk;
      }
      for (let k = 0; k < 3; k++) {
        const kp = v[k][p];
        const kq = v[k][q];
        v[k][p] = c * kp - s * kq;
        v[k][q] = s * kp + c * kq;
      }
    }
  }
  return [0, 1, 2]
    .map((i) => ({ value: a[i][i], vector: [v[0][i], v[1][i], v[2][i]] }))
    .sort((x, y) => y.value - x.value);
}

/** The two axes of greatest spread, so the molecule presents its widest face. */
function principalAxes(points) {
  const cov = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (const p of points) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) cov[i][j] += p[i] * p[j];
    }
  }
  const n = points.length || 1;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) cov[i][j] /= n;
  }
  const e = eigen(cov);
  return [e[0].vector, e[1].vector];
}

const round = (n) => Math.round(n * 10) / 10;

function project(sdf) {
  const mol = withoutHydrogens(parseSdf(sdf));
  if (!mol.atoms.length) return null;

  const c = centroid(mol.atoms);
  const centred = mol.atoms.map((a) => [a.x - c[0], a.y - c[1], a.z - c[2]]);
  const [u, w] = principalAxes(centred);

  const flat = centred.map((p) => [
    p[0] * u[0] + p[1] * u[1] + p[2] * u[2],
    p[0] * w[0] + p[1] * w[1] + p[2] * w[2],
  ]);

  const xs = flat.map((p) => p[0]);
  const ys = flat.map((p) => p[1]);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const scale = (BOX - PAD * 2) / span;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;

  return {
    size: BOX,
    atoms: flat.map((p, i) => [
      round((p[0] - cx) * scale + BOX / 2),
      // SVG y grows downward; flip so the projection is not mirrored.
      round(BOX / 2 - (p[1] - cy) * scale),
      mol.atoms[i].element,
    ]),
    bonds: mol.bonds.map((b) => [b.a, b.b, b.order]),
  };
}

const atlas = JSON.parse(await readFile('src/data/atlas.generated.json', 'utf8'));
const previews = {};
let skipped = 0;

for (const compound of atlas.compounds) {
  if (!compound.structureFile) {
    skipped++;
    continue;
  }
  const sdf = await readFile('public' + compound.structureFile, 'utf8');
  const preview = project(sdf);
  if (preview) previews[compound.slug] = preview;
  else skipped++;
}

await writeFile('src/data/previews.generated.json', JSON.stringify(previews) + '\n');

const atoms = Object.values(previews).reduce((n, p) => n + p.atoms.length, 0);
console.log(
  `previews: ${Object.keys(previews).length} molecules, ${atoms} heavy atoms` +
    (skipped ? `, ${skipped} skipped` : ''),
);
