import { getPreview, STATUS_LABEL, type VerificationStatus } from '../lib/atlas';
import { elementInfo } from '../lib/elements';
import { tokenizeFormula } from '../lib/format';

/** Molecular formula with real subscripts and superscript charge. */
export function Formula({ formula }: { formula: string }) {
  return (
    <span className="mono">
      {tokenizeFormula(formula).map((token, i) => {
        if (token.kind === 'count') return <sub key={i}>{token.text}</sub>;
        if (token.kind === 'charge') return <sup key={i}>{token.text}</sup>;
        return <span key={i}>{token.text}</span>;
      })}
    </span>
  );
}

export function StatusDot({ status }: { status: VerificationStatus }) {
  return <span className={`dot dot--${status}`} aria-hidden="true" />;
}

export function StatusPill({ status }: { status: VerificationStatus }) {
  return (
    <span className={`pill pill--${status}`}>
      <StatusDot status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * The flat projection of a molecule, drawn from precomputed coordinates.
 *
 * Carbon is deliberately dimmed to a faint scaffold so the heteroatoms - the parts
 * that actually distinguish one triterpenoid from the next - carry the silhouette.
 */
export function MoleculeGlyph({ slug }: { slug: string }) {
  const preview = getPreview(slug);
  if (!preview) return <div className="glyph glyph--empty" aria-hidden="true" />;

  const { size, atoms, bonds } = preview;
  return (
    <svg className="glyph" viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
      <g className="glyph__bonds">
        {bonds.map(([a, b, order], i) => {
          const from = atoms[a];
          const to = atoms[b];
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from[0]}
              y1={from[1]}
              x2={to[0]}
              y2={to[1]}
              strokeWidth={order > 1 ? 1.6 : 1.1}
            />
          );
        })}
      </g>
      <g>
        {atoms.map(([x, y, element], i) => {
          const carbon = element === 'C';
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={carbon ? 1.7 : 2.7}
              fill={carbon ? 'rgb(255 255 255 / 30%)' : elementInfo(element).color}
            />
          );
        })}
      </g>
    </svg>
  );
}

const ICONS = {
  atlas: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 0 4 20.5z',
  species: 'M12 21c0-6 3-11 8-13-1 8-4 11-8 13zM12 21c0-4-2-7.5-6-9 .5 5 2.5 7.5 6 9zM12 21v-4',
  about: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 7.6v.2',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  back: 'M15 5l-7 7 7 7',
  copy: 'M9 9V6.5A1.5 1.5 0 0 1 10.5 5h7A1.5 1.5 0 0 1 19 6.5v7a1.5 1.5 0 0 1-1.5 1.5H15M6.5 9h7A1.5 1.5 0 0 1 15 10.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 17.5v-7A1.5 1.5 0 0 1 6.5 9z',
  external: 'M14 5h5v5M19 5l-8 8M17 14v4.5A1.5 1.5 0 0 1 15.5 20h-9A1.5 1.5 0 0 1 5 18.5v-9A1.5 1.5 0 0 1 6.5 8H11',
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}
