import { Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { compounds, references } from '../../data';
import { MolecularViewer } from '../../components/MolecularViewer/MolecularViewer';
import { VerificationBadge } from '../../components/VerificationBadge/VerificationBadge';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import './CompoundDetailPage.css';

export function CompoundDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const compound = compounds.find(c => c.slug === slug);

  if (!compound) {
    return (
      <div className="not-found-container">
        <Helmet><title>Compound Not Found — Ziziphus Molecular Atlas</title></Helmet>
        <h2>Compound Not Found</h2>
        <p>The compound you requested does not exist or has been moved.</p>
        <Link to="/compounds" className="back-link">Return to database</Link>
      </div>
    );
  }

  const compoundReferences = references.filter(ref => 
    compound.referenceIds.includes(ref.id)
  );

  return (
    <div className="detail-page">
      <Helmet>
        <title>{compound.preferredName} — Ziziphus Molecular Atlas</title>
      </Helmet>

      <div className="header-split">
        <div className="viewer-column">
          <MolecularViewer 
            smiles={compound.canonicalSmiles || ''}
            cid={compound.pubchemCid} 
            compoundName={compound.preferredName} 
          />
        </div>
        <div className="summary-column">
          <h1 className="compound-title">{compound.preferredName}</h1>
          <div className="summary-meta">
            <div className="meta-item">
              <span className="meta-label">Formula</span>
              <span className="meta-value mono">{compound.molecularFormula}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Weight</span>
              <span className="meta-value">{((compound.molecularWeight || 0) || 0).toFixed(2)} Da</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Class</span>
              <span className="meta-value">{compound.chemicalClass}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Verification</span>
              <VerificationBadge status={compound.fieldVerification.chemicalIdentity} />
            </div>
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h2 className="section-title">Chemical Identity</h2>
        <dl className="definition-list">
          <div className="dl-row">
            <dt>Preferred Name</dt>
            <dd>{compound.preferredName}</dd>
          </div>
          <div className="dl-row">
            <dt>Synonyms</dt>
            <dd>{compound.synonyms.length > 0 ? compound.synonyms.join(', ') : 'None recorded'}</dd>
          </div>
          <div className="dl-row">
            <dt>Molecular Formula</dt>
            <dd className="mono">{compound.molecularFormula}</dd>
          </div>
          <div className="dl-row">
            <dt>Molecular Weight</dt>
            <dd>{(compound.molecularWeight || 0)}</dd>
          </div>
          <div className="dl-row">
            <dt>Canonical SMILES</dt>
            <dd className="mono-container">
              {compound.canonicalSmiles ? (
                <><span className="mono-text">{compound.canonicalSmiles}</span> <CopyButton text={compound.canonicalSmiles} /></>
              ) : 'Not available'}
            </dd>
          </div>
          <div className="dl-row">
            <dt>InChI</dt>
            <dd className="mono-container">
              {compound.inchi ? (
                <><span className="mono-text truncate">{compound.inchi}</span> <CopyButton text={compound.inchi} /></>
              ) : 'Not available'}
            </dd>
          </div>
          <div className="dl-row">
            <dt>InChIKey</dt>
            <dd className="mono-container">
              {compound.inchikey ? (
                <><span className="mono-text">{compound.inchikey}</span> <CopyButton text={compound.inchikey} /></>
              ) : 'Not available'}
            </dd>
          </div>
          <div className="dl-row">
            <dt>PubChem CID</dt>
            <dd>
              {compound.pubchemCid ? (
                <a href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.pubchemCid}`} target="_blank" rel="noopener noreferrer" className="external-link">
                  {compound.pubchemCid}
                </a>
              ) : 'Not available'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="detail-section">
        <h2 className="section-title">Ziziphus Occurrence</h2>
        {compound.species.length > 0 ? (
          <div className="occurrence-list">
            {compound.species.map((occ, idx) => (
              <div key={idx} className="occurrence-item">
                <Link to={`/species/${occ.speciesId.toLowerCase().replace(/\s+/g, '-')}`} className="species-name-link">
                  {occ.speciesId}
                </Link>
                {occ.plantPart && <span className="plant-part"> — {occ.plantPart}</span>}
                {occ.notes && <p className="occurrence-notes">{occ.notes}</p>}
                <div className="occurrence-refs">
                  Evidence: {occ.referenceIds.map((refId, i) => (
                    <Fragment key={refId}>
                      <a href={`#ref-${refId}`} className="ref-link">[{refId}]</a>
                      {i < occ.referenceIds.length - 1 ? ', ' : ''}
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No occurrence data available.</p>
        )}
      </section>

      <section className="detail-section">
        <h2 className="section-title">Verification Details</h2>
        <table className="verification-table">
          <tbody>
            <tr>
              <td>Chemical Identity</td>
              <td><VerificationBadge status={compound.fieldVerification.chemicalIdentity} /></td>
            </tr>
            <tr>
              <td>Molecular Structure</td>
              <td><VerificationBadge status={compound.fieldVerification.molecularStructure} /></td>
            </tr>
            <tr>
              <td>Occurrence</td>
              <td><VerificationBadge status={compound.fieldVerification.occurrence} /></td>
            </tr>
            <tr>
              <td>Literature</td>
              <td><VerificationBadge status={compound.fieldVerification.literature} /></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="detail-section">
        <h2 className="section-title">Literature Evidence</h2>
        {compoundReferences.length > 0 ? (
          <div className="reference-list">
            {compoundReferences.map(ref => (
              <div key={ref.id} id={`ref-${ref.id}`} className="reference-item">
                <div className="ref-badge-wrapper">
                  <span className={`ref-type-badge ref-${ref.evidenceType}`}>{ref.evidenceType.replace("-", " ").toUpperCase()}</span>
                </div>
                <div className="ref-citation">
                  {ref.authors} ({ref.year}). {ref.title}. <i>{ref.journal}</i>. 
                  {ref.doi && (
                    <a href={`https://doi.org/${ref.doi}`} target="_blank" rel="noopener noreferrer" className="doi-link">
                      DOI: {ref.doi}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No references available.</p>
        )}
      </section>
    </div>
  );
}
