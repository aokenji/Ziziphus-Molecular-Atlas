import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { species, compounds } from '../../data';
import './SpeciesListPage.css';

export function SpeciesListPage() {
  
  const speciesWithStats = species.map(sp => {
    const spCompounds = compounds.filter(c => c.species.some(o => o.speciesId === sp.scientificName));
    const classes = Array.from(new Set(spCompounds.map(c => c.chemicalClass)));
    return {
      ...sp,
      compoundCount: spCompounds.length,
      classes
    };
  }).sort((a, b) => a.scientificName.localeCompare(b.scientificName));

  return (
    <div className="species-list-page">
      <Helmet>
        <title>Ziziphus Species — Ziziphus Molecular Atlas</title>
      </Helmet>

      <header className="page-header">
        <h1 className="page-title">Species <span className="count-badge">{species.length}</span></h1>
      </header>

      <div className="species-list">
        {speciesWithStats.map(sp => (
          <div key={sp.slug} className="species-item">
            <div className="species-header">
              <Link to={`/species/${sp.slug}`} className="species-name">
                {sp.scientificName}
              </Link>
              <div className="species-stats">
                <span className="stat-pill">{sp.compoundCount} compounds</span>
              </div>
            </div>
            
            {sp.commonNames && sp.commonNames.length > 0 && (
              <div className="common-names">
                {sp.commonNames.join(', ')}
              </div>
            )}
            
            <p className="species-description">{sp.description}</p>
            
            {sp.classes.length > 0 && (
              <div className="species-classes">
                <span className="classes-label">Chemical classes:</span>
                <span className="classes-list">{sp.classes.join(', ')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
