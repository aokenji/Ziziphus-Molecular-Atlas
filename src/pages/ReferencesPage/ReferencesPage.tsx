import { Fragment } from 'react';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { references, compounds, species } from '../../data';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import './ReferencesPage.css';

export function ReferencesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReferences = references.filter(ref => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      ref.title.toLowerCase().includes(q) ||
      ref.authors.toLowerCase().includes(q) ||
      ref.journal.toLowerCase().includes(q) ||
      ref.year.toString().includes(q)
    );
  }).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return a.authors.localeCompare(b.authors);
  });

  return (
    <div className="references-page">
      <Helmet>
        <title>References — Ziziphus Molecular Atlas</title>
      </Helmet>

      <header className="page-header">
        <h1 className="page-title">References <span className="count-badge">{filteredReferences.length}</span></h1>
      </header>

      <div className="controls-section">
        <input
          type="search"
          className="search-input full-width"
          placeholder="Search references by title, author, journal, year..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredReferences.length === 0 ? (
        <EmptyState title="No references match your search criteria." />
      ) : (
        <div className="ref-index-list">
          {filteredReferences.map(ref => {
            const refCompounds = compounds.filter(c => c.referenceIds.includes(ref.id) || c.species.some(o => o.referenceIds.includes(ref.id)));
            const refSpeciesSlugs = new Set<string>();
            refCompounds.forEach(c => c.species.forEach(o => {
              if (o.referenceIds.includes(ref.id)) {
                const sp = species.find(s => s.scientificName === o.speciesId);
                if (sp) refSpeciesSlugs.add(sp.slug);
              }
            }));
            const relatedSpecies = Array.from(refSpeciesSlugs).map(slug => species.find(s => s.slug === slug)!);

            return (
              <div key={ref.id} className="ref-index-item">
                <div className="ref-header">
                  <span className={`ref-type-badge ref-${ref.evidenceType}`}>
                    {ref.evidenceType.replace("-", " ").toUpperCase()}
                  </span>
                </div>
                
                <div className="ref-full-citation">
                  {ref.authors} ({ref.year}). <strong>{ref.title}</strong>. <i>{ref.journal}</i>.
                  {ref.doi && (
                    <a href={`https://doi.org/${ref.doi}`} target="_blank" rel="noopener noreferrer" className="doi-link-index">
                      DOI: {ref.doi}
                    </a>
                  )}
                </div>

                {(refCompounds.length > 0 || relatedSpecies.length > 0) && (
                  <div className="ref-associations">
                    {refCompounds.length > 0 && (
                      <div className="assoc-group">
                        <span className="assoc-label">Compounds:</span>
                        {refCompounds.map((c, i) => (
                          <Fragment key={c.id}>
                            <Link to={`/compound/${c.slug}`} className="assoc-link">{c.preferredName}</Link>
                            {i < refCompounds.length - 1 ? ', ' : ''}
                          </Fragment>
                        ))}
                      </div>
                    )}
                    {relatedSpecies.length > 0 && (
                      <div className="assoc-group">
                        <span className="assoc-label">Species:</span>
                        {relatedSpecies.map((s, i) => (
                          <Fragment key={s.slug}>
                            <Link to={`/species/${s.slug}`} className="assoc-link italic">{s.scientificName}</Link>
                            {i < relatedSpecies.length - 1 ? ', ' : ''}
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
