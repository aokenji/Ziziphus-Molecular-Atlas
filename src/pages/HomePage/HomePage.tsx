import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { compounds, species, references } from '../../data';
import { VerificationBadge } from '../../components/VerificationBadge/VerificationBadge';
import './HomePage.css';

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/compounds?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const totalCompounds = compounds.length;
  const totalSpecies = species.length;
  const totalReferences = references.length;
  const verifiedRecords = compounds.filter(c => c.fieldVerification.chemicalIdentity === 'verified').length;

  const featuredCompounds = compounds.filter(c => c.featured);
  
  const classCounts = compounds.reduce((acc, c) => {
    acc[c.chemicalClass] = (acc[c.chemicalClass] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="home-page">
      <Helmet>
        <title>Ziziphus Molecular Atlas — Verified Molecular Structures</title>
        <meta name="description" content="A curated molecular database of Ziziphus species, containing chemically verified structural and occurrence data." />
      </Helmet>

      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-eyebrow">MOLECULAR DATABASE</span>
          <h1 className="hero-heading">Ziziphus Molecular Atlas</h1>
          <p className="hero-subtext">A curated collection of chemically verified structures, standardized identities, and occurrence data for metabolites from Ziziphus species.</p>
          
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search compounds by name, formula, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">Search Database</button>
          </form>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-item">
          <span className="stat-number">{totalCompounds}</span>
          <span className="stat-label">Total Compounds</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-number">{totalSpecies}</span>
          <span className="stat-label">Species Covered</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-number">{totalReferences}</span>
          <span className="stat-label">References</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-number">{verifiedRecords}</span>
          <span className="stat-label">Verified Records</span>
        </div>
      </section>

      <div className="home-grid">
        <section className="featured-section">
          <h2 className="section-header">Featured Compounds</h2>
          <div className="featured-list">
            {featuredCompounds.map(compound => (
              <div key={compound.id} className="featured-item">
                <div className="featured-item-header">
                  <Link to={`/compound/${compound.slug}`} className="featured-name">
                    {compound.preferredName}
                  </Link>
                  <VerificationBadge status={compound.fieldVerification.chemicalIdentity} />
                </div>
                <div className="featured-item-details">
                  <span className="featured-formula">{compound.molecularFormula}</span>
                  <span className="featured-class">{compound.chemicalClass}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="home-sidebar">
          <section className="classes-section">
            <h2 className="section-header">Chemical Classes</h2>
            <ul className="classes-list">
              {sortedClasses.map(([className, count]) => (
                <li key={className} className="class-item">
                  <span className="class-name">{className}</span>
                  <span className="class-count">{count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="about-section">
            <h2 className="section-header">About the Atlas</h2>
            <p className="about-text">
              The Ziziphus Molecular Atlas provides high-quality, curated structural and literature evidence for metabolites found across the genus. By standardizing representations and explicitly tracking verification provenance, it aims to reduce propagation of structural errors in natural products research.
            </p>
          </section>

          <section className="methodology-preview">
            <h2 className="section-header">Methodology</h2>
            <p className="methodology-text">
              Chemical identity is verified through cross-referencing primary literature and established databases (e.g., PubChem) to ensure structural precision and accurate stereochemistry.
            </p>
            <Link to="/methodology" className="methodology-link">Read full methodology →</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
