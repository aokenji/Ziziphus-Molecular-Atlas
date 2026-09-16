import { Link } from 'react-router-dom';
import type { Compound } from '../lib/atlas';
import { formatWeight } from '../lib/format';
import { Formula, MoleculeGlyph, StatusDot } from './ui';

export function CompoundCard({ compound }: { compound: Compound }) {
  return (
    <Link
      to={`/compound/${compound.slug}`}
      className="card"
      aria-label={`${compound.preferredName}, ${compound.chemicalClass}`}
    >
      <div className="card__glyph">
        <MoleculeGlyph slug={compound.slug} />
        <StatusDot status={compound.verificationStatus} />
      </div>
      <div className="card__body">
        <span className="micro card__class">{compound.chemicalClass}</span>
        <h3 className="card__name serif">{compound.preferredName}</h3>
        <p className="card__meta">
          {compound.molecularFormula && <Formula formula={compound.molecularFormula} />}
          {compound.molecularWeight != null && (
            <span className="mono card__mw">{formatWeight(compound.molecularWeight)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
