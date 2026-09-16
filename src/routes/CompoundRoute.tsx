import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Formula, Icon, StatusDot, StatusPill } from '../components/ui';
import {
  FIELD_LABEL,
  STATUS_LABEL,
  getCompound,
  getReferences,
  getSpeciesById,
  type FieldVerification,
  type VerificationStatus,
} from '../lib/atlas';
import { doiUrl, formatNumber, formatWeight, pubchemUrl, shortenAuthors } from '../lib/format';
import { MoleculeView } from '../three/MoleculeView';

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be refused; the value stays selectable either way.
    }
  };

  return (
    <button type="button" className="copy" onClick={copy} aria-label={`Copy ${label}`}>
      <span className="mono copy__value">{value}</span>
      <span className="copy__icon">{copied ? <span className="micro">Copied</span> : <Icon name="copy" size={15} />}</span>
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row">
      <dt className="micro">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function CompoundRoute() {
  const { slug } = useParams<{ slug: string }>();
  const compound = slug ? getCompound(slug) : undefined;

  if (!compound) {
    return (
      <div className="wrap empty-screen">
        <h1 className="serif">Not in the atlas</h1>
        <p className="muted">No compound is catalogued under that name.</p>
        <Link to="/" className="button">
          Back to the atlas
        </Link>
      </div>
    );
  }

  const references = getReferences(compound.referenceIds);
  const props = compound.properties;
  const fields = Object.entries(compound.fieldVerification) as [keyof FieldVerification, VerificationStatus][];

  return (
    <div className="wrap detail">
      <Link to="/" className="back micro no-select">
        <Icon name="back" size={16} />
        Atlas
      </Link>

      <header className="detail__head">
        <span className="micro">{compound.chemicalClass}</span>
        <h1 className="serif detail__name">{compound.preferredName}</h1>
        <div className="detail__badges">
          <StatusPill status={compound.verificationStatus} />
          {compound.atomCount != null && (
            <span className="micro">{compound.atomCount} atoms</span>
          )}
        </div>
      </header>

      <MoleculeView compound={compound} />

      <section className="section">
        <h2 className="micro section__title">Identity</h2>
        <dl className="rows panel">
          {compound.molecularFormula && (
            <Row label="Molecular formula">
              <Formula formula={compound.molecularFormula} />
            </Row>
          )}
          {compound.molecularWeight != null && (
            <Row label="Molecular weight">
              <span className="mono">{formatWeight(compound.molecularWeight)} g/mol</span>
            </Row>
          )}
          {compound.inchikey && (
            <Row label="InChIKey">
              <CopyValue value={compound.inchikey} label="InChIKey" />
            </Row>
          )}
          {compound.isomericSmiles && (
            <Row label="SMILES">
              <CopyValue value={compound.isomericSmiles} label="SMILES" />
            </Row>
          )}
          {compound.pubchemCid != null && (
            <Row label="PubChem CID">
              <a
                className="mono link"
                href={pubchemUrl(compound.pubchemCid)}
                target="_blank"
                rel="noreferrer noopener"
              >
                {compound.pubchemCid}
                <Icon name="external" size={14} />
              </a>
            </Row>
          )}
        </dl>
      </section>

      {props && (props.xlogp != null || props.tpsa != null) && (
        <section className="section">
          <h2 className="micro section__title">Computed properties</h2>
          <div className="stats panel">
            {props.xlogp != null && <Stat label="XLogP3" value={formatNumber(props.xlogp)} />}
            {props.tpsa != null && <Stat label="TPSA" value={`${formatNumber(props.tpsa)} Å²`} />}
            {props.hBondDonors != null && <Stat label="H-bond donors" value={String(props.hBondDonors)} />}
            {props.hBondAcceptors != null && (
              <Stat label="H-bond acceptors" value={String(props.hBondAcceptors)} />
            )}
            {props.rotatableBonds != null && (
              <Stat label="Rotatable bonds" value={String(props.rotatableBonds)} />
            )}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="micro section__title">Verification</h2>
        <ul className="checks panel">
          {fields.map(([field, status]) => (
            <li key={field} className="check">
              <StatusDot status={status} />
              <span className="check__label">{FIELD_LABEL[field]}</span>
              <span className="check__status micro">{STATUS_LABEL[status]}</span>
            </li>
          ))}
        </ul>

        {compound.verificationNotes.length > 0 && (
          <ul className="notes">
            {compound.verificationNotes.map((note) => (
              <li key={note} className="notes__item muted">
                {note}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2 className="micro section__title">Reported in</h2>
        <ul className="occurrences">
          {compound.species.map((occurrence) => {
            const sp = getSpeciesById(occurrence.speciesId);
            if (!sp) return null;
            return (
              <li key={occurrence.speciesId} className="occurrence panel">
                <Link to={`/species/${sp.slug}`} className="occurrence__name">
                  <i>{sp.scientificName}</i>
                </Link>
                {occurrence.plantPart && (
                  <span className="micro occurrence__part">{occurrence.plantPart}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {references.length > 0 && (
        <section className="section">
          <h2 className="micro section__title">References</h2>
          <ol className="refs">
            {references.map((ref) => (
              <li key={ref.id} className="ref">
                <p className="ref__title">{ref.title}</p>
                <p className="ref__meta muted">
                  {shortenAuthors(ref.authors)} &middot; <i>{ref.journal}</i> &middot; {ref.year}
                </p>
                {ref.doi && (
                  <a
                    className="link mono ref__doi"
                    href={doiUrl(ref.doi)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {ref.doi}
                    <Icon name="external" size={13} />
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="micro">{label}</span>
      <span className="mono stat__value">{value}</span>
    </div>
  );
}
