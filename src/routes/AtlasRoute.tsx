import { useMemo, useState } from 'react';
import { CompoundCard } from '../components/CompoundCard';
import { Icon } from '../components/ui';
import {
  byConfidence,
  classTally,
  compounds,
  generatedAt,
  searchCompounds,
  statusTally,
} from '../lib/atlas';

const ALL = 'All';

export function AtlasRoute() {
  const [query, setQuery] = useState('');
  const [activeClass, setActiveClass] = useState(ALL);

  const classes = useMemo(() => classTally(), []);
  const counts = useMemo(() => statusTally(), []);

  const results = useMemo(() => {
    const pool = activeClass === ALL ? compounds : compounds.filter((c) => c.chemicalClass === activeClass);
    return searchCompounds(query, pool).slice().sort(byConfidence);
  }, [query, activeClass]);

  const total = compounds.length;
  const share = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="wrap">
      <section className="hero">
        <span className="micro">Molecular atlas</span>
        <h1 className="display">
          The phytochemistry of <i className="genus">Ziziphus</i>, <em>verified.</em>
        </h1>
        <p className="hero__lede muted">
          Every compound here is checked against PubChem for chemical identity and carries a
          cached atom-coordinate structure you can turn in three dimensions.
        </p>
      </section>

      <section className="summary panel" aria-label="Evidence summary">
        <div className="summary__head">
          <span className="micro">Evidence</span>
          <span className="mono summary__total">{total} compounds</span>
        </div>

        <div className="summary__bar" role="img" aria-label={`${counts.verified} verified, ${counts['partially-verified']} partial, ${counts.unresolved} unresolved`}>
          <span style={{ width: share(counts.verified), background: 'var(--verified)' }} />
          <span style={{ width: share(counts['partially-verified']), background: 'var(--partial)' }} />
          <span style={{ width: share(counts.unresolved), background: 'var(--unresolved)' }} />
        </div>

        <ul className="summary__legend">
          <li>
            <span className="dot dot--verified" /> {counts.verified} verified
          </li>
          <li>
            <span className="dot dot--partially-verified" /> {counts['partially-verified']} partial
          </li>
          <li>
            <span className="dot dot--unresolved" /> {counts.unresolved} unresolved
          </li>
        </ul>

        <p className="summary__foot micro">Checked against PubChem &middot; {generatedAt}</p>
      </section>

      <div className="search">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, formula, InChIKey"
          aria-label="Search compounds"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <div className="chip-row" role="group" aria-label="Filter by chemical class">
        <button
          type="button"
          className="chip"
          aria-pressed={activeClass === ALL}
          onClick={() => setActiveClass(ALL)}
        >
          All<span className="chip__count">{total}</span>
        </button>
        {classes.map((entry) => (
          <button
            key={entry.label}
            type="button"
            className="chip"
            aria-pressed={activeClass === entry.label}
            onClick={() => setActiveClass(entry.label)}
          >
            {entry.label}
            <span className="chip__count">{entry.count}</span>
          </button>
        ))}
      </div>

      {results.length > 0 ? (
        <div className="card-grid">
          {results.map((compound) => (
            <CompoundCard key={compound.id} compound={compound} />
          ))}
        </div>
      ) : (
        <p className="empty muted">
          Nothing matches <strong>{query}</strong>
          {activeClass !== ALL && <> in {activeClass.toLowerCase()}s</>}.
        </p>
      )}
    </div>
  );
}
