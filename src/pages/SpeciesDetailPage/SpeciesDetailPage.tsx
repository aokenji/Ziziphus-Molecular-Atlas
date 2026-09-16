import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { species, compounds, references } from '../../data';
import { VerificationBadge } from '../../components/VerificationBadge/VerificationBadge';
import './SpeciesDetailPage.css';

export function SpeciesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const sp = species.find(s => s.slug === slug);

  if (!sp) {
    return (
      <div className="not-found-container">
        <Helmet><title>Species Not Found — Ziziphus Molecular Atlas</title></Helmet>
        <h2>Species Not Found</h2>
        <p>The species you requested does not exist in the database.</p>
        <Link to="/species" className="back-link">Return to species list</Link>
      </div>
    );
  }

  const spCompounds = compounds.filter(c => 
    c.species.some(o => o.speciesId === sp.scientificName)
  ).sort((a, b) => a.preferredName.localeCompare(b.preferredName));

  const uniqueClasses = Array.from(new Set(spCompounds.map(c => c.chemicalClass))).sort();

  // Collect all references associated with these occurrences
  const refIds = new Set<string>();
  spCompounds.forEach(c => {
    c.species
      .filter(o => o.speciesId === sp.scientificName)
      .forEach(o => o.referenceIds.forEach(rid => refIds.add(rid)));
  });

  const spReferences = references.filter(r => refIds.has(r.id));

  return (
    <div className="species-detail-page">
      <Helmet>
        <title>{sp.scientificName} — Ziziphus Molecular Atlas</title>
      </Helmet>

      <header className="species-header-section">
        <h1 className="species-title">{sp.scientificName}</h1>
        {sp.commonNames && sp.commonNames.length > 0 && (
          <div className="species-common-names">{sp.commonNames.join(', ')}</div>
        )}
        <p className="species-full-desc">{sp.description}</p>
      </header>

      <div className="species-grid">
        <div className="main-col">
          <section className="detail-section">
            <h2 className="section-title">Associated Compounds <span className="count-badge">{spCompounds.length}</span></h2>
            
            {spCompounds.length > 0 ? (
              <div className="compounds-table-wrapper">
                <table className="sp-compounds-table">
                  <thead>
                    <tr>
                      <th>Compound</th>
                      <th>Class</th>
                      <th>Plant Part</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spCompounds.map(c => {
                      const occ = c.species.find(o => o.speciesId === sp.scientificName);
                      return (
                        <tr key={c.id}>
                          <td>
                            <Link to={`/compound/${c.slug}`} className="compound-link">{c.preferredName}</Link>
                          </td>
                          <td>{c.chemicalClass}</td>
                          <td>{occ?.plantPart || 'Unspecified'}</td>
                          <td><VerificationBadge status={c.fieldVerification.chemicalIdentity} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted">No compounds currently recorded for this species.</p>
            )}
          </section>

          <section className="detail-section">
            <h2 className="section-title">Literature References</h2>
            {spReferences.length > 0 ? (
              <ul className="sp-reference-list">
                {spReferences.map(ref => (
                  <li key={ref.id} className="sp-ref-item">
                    {ref.authors} ({ref.year}). {ref.title}. <i>{ref.journal}</i>.
                    {ref.doi && (
                      <a href={`https://doi.org/${ref.doi}`} target="_blank" rel="noopener noreferrer" className="doi-link-inline">
                        DOI: {ref.doi}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No specific references recorded.</p>
            )}
          </section>
        </div>

        <div className="side-col">
          <section className="detail-section">
            <h2 className="section-title">Chemical Classes</h2>
            {uniqueClasses.length > 0 ? (
              <ul className="sp-class-list">
                {uniqueClasses.map(cls => (
                  <li key={cls} className="sp-class-item">{cls}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No classes recorded.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
