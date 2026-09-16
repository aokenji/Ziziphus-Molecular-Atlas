import { Link, useParams } from 'react-router-dom';
import { CompoundCard } from '../components/CompoundCard';
import { Icon, StatusDot } from '../components/ui';
import { compoundsForSpecies, getSpeciesBySlug, species } from '../lib/atlas';

export function SpeciesListRoute() {
  return (
    <div className="wrap">
      <section className="hero hero--tight">
        <span className="micro">Genus</span>
        <h1 className="display">
          Five species of <em>Ziziphus.</em>
        </h1>
        <p className="hero__lede muted">
          Occurrence is the one claim PubChem cannot settle. Each compound below is tied to the
          species it was reported from, and to the paper that reported it.
        </p>
      </section>

      <ul className="species-list">
        {species.map((sp) => {
          const found = compoundsForSpecies(sp.id);
          return (
            <li key={sp.id}>
              <Link to={`/species/${sp.slug}`} className="species-card panel">
                <div className="species-card__head">
                  <h2 className="serif species-card__name">
                    <i>{sp.scientificName}</i>
                  </h2>
                  <span className="mono species-card__count">{found.length}</span>
                </div>
                <p className="micro">{sp.commonNames.join(' · ')}</p>
                {sp.description && <p className="species-card__desc muted">{sp.description}</p>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SpeciesDetailRoute() {
  const { slug } = useParams<{ slug: string }>();
  const sp = slug ? getSpeciesBySlug(slug) : undefined;

  if (!sp) {
    return (
      <div className="wrap empty-screen">
        <h1 className="serif">Unknown species</h1>
        <p className="muted">That species is not part of this atlas.</p>
        <Link to="/species" className="button">
          All species
        </Link>
      </div>
    );
  }

  const found = compoundsForSpecies(sp.id);

  return (
    <div className="wrap detail">
      <Link to="/species" className="back micro no-select">
        <Icon name="back" size={16} />
        Species
      </Link>

      <header className="detail__head">
        <span className="micro">{sp.commonNames.join(' · ')}</span>
        <h1 className="serif detail__name">
          <i>{sp.scientificName}</i>
        </h1>
        {sp.description && <p className="muted detail__lede">{sp.description}</p>}
      </header>

      <section className="section">
        <h2 className="micro section__title">
          {found.length} compound{found.length === 1 ? '' : 's'} reported
        </h2>
        {found.length > 0 ? (
          <div className="card-grid">
            {found.map((compound) => (
              <CompoundCard key={compound.id} compound={compound} />
            ))}
          </div>
        ) : (
          <p className="empty muted">
            <StatusDot status="unresolved" /> No compound in this atlas is yet tied to this
            species by a cited source.
          </p>
        )}
      </section>
    </div>
  );
}
