import { useMemo } from 'react';
import { Icon } from '../components/ui';
import { compounds, dataSource, generatedAt, references } from '../lib/atlas';
import { citationLocator, doiUrl, pubmedUrl, shortenAuthors } from '../lib/format';

const RULES: { field: string; rule: string }[] = [
  {
    field: 'Chemical identity',
    rule: 'A PubChem record resolves for the compound and returns the molecular formula and weight the curated entry claims. A name match on its own is not enough — natural-product names are reused across unrelated skeletons.',
  },
  {
    field: 'Molecular structure',
    rule: 'Atom coordinates were actually retrieved and cached. A computed 3D conformer counts as verified; a flat 2D record only counts as partial.',
  },
  {
    field: 'Occurrence in Ziziphus',
    rule: 'Carried over from the curated literature. This is the one field a chemical database cannot settle, and it is never upgraded automatically.',
  },
  {
    field: 'Literature support',
    rule: 'At least one primary-literature citation. A database identification is provenance, not evidence, so it scores partial on its own.',
  },
];

export function AboutRoute() {
  // Derived from the data itself, so this page cannot drift from what the sync found.
  const audit = useMemo(() => {
    const notes = compounds.flatMap((c) => c.verificationNotes);
    return {
      reresolved: notes.filter((n) => n.includes('re-resolved')).length,
      keys: notes.filter((n) => n.includes('InChIKey')).length,
      structures: compounds.filter((c) => c.structureFile).length,
      threeD: compounds.filter((c) => c.dimensionality === '3d').length,
    };
  }, []);

  return (
    <div className="wrap">
      <section className="hero hero--tight">
        <span className="micro">Method</span>
        <h1 className="display">
          What <em>verified</em> means here.
        </h1>
        <p className="hero__lede muted">
          A badge is only worth something if it can fail. Every status in this atlas is derived
          from evidence at build time, never written by hand.
        </p>
      </section>

      <section className="section">
        <h2 className="micro section__title">The four checks</h2>
        <ul className="rules">
          {RULES.map((rule) => (
            <li key={rule.field} className="rule-item panel">
              <h3 className="serif rule-item__name">{rule.field}</h3>
              <p className="muted">{rule.rule}</p>
            </li>
          ))}
        </ul>
        <p className="muted note-para">
          A compound's overall status is its weakest check, not its strongest.
        </p>
      </section>

      <section className="section">
        <h2 className="micro section__title">What the last sync found</h2>
        <div className="stats panel">
          <div className="stat">
            <span className="micro">Structures cached</span>
            <span className="mono stat__value">{audit.structures}</span>
          </div>
          <div className="stat">
            <span className="micro">3D conformers</span>
            <span className="mono stat__value">{audit.threeD}</span>
          </div>
          <div className="stat">
            <span className="micro">Identifiers re-resolved</span>
            <span className="mono stat__value">{audit.reresolved}</span>
          </div>
          <div className="stat">
            <span className="micro">InChIKeys corrected</span>
            <span className="mono stat__value">{audit.keys}</span>
          </div>
        </div>
        <p className="muted note-para">
          The first draft of this dataset carried database identifiers that pointed at unrelated
          molecules, and InChIKeys that were not valid keys at all. Those entries rendered
          convincingly under the right names. Re-resolving every identifier by name and
          cross-checking the formula is what the sync step exists to do, and each correction it
          makes is recorded on the compound it affected.
        </p>
      </section>

      <section className="section">
        <h2 className="micro section__title">Provenance</h2>
        <dl className="rows panel">
          <div className="row">
            <dt className="micro">Structure source</dt>
            <dd>{dataSource}</dd>
          </div>
          <div className="row">
            <dt className="micro">Last synced</dt>
            <dd className="mono">{generatedAt}</dd>
          </div>
          <div className="row">
            <dt className="micro">Compounds</dt>
            <dd className="mono">{compounds.length}</dd>
          </div>
        </dl>
        <p className="muted note-para">
          Structures are cached in the repository rather than fetched live, so the atlas renders
          the same molecules offline as it does online, and NCBI is not queried once per visitor.
        </p>
      </section>

      <section className="section">
        <h2 className="micro section__title">Elsewhere</h2>
        <ul className="link-list">
          <li>
            <a
              className="link-card panel"
              href="https://talanaihub.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="link-card__text">
                <span className="serif link-card__name">TalanaiHub</span>
                <span className="muted link-card__desc">
                  A bioinformatics resource for <i>Ziziphus talanai</i>, a Philippine endemic in
                  this same genus. Ten candidate compounds docked against &alpha;-glucosidase.
                </span>
              </span>
              <Icon name="external" size={16} />
            </a>
          </li>
          <li>
            <a
              className="link-card panel"
              href="https://aokenji.dev"
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="link-card__text">
                <span className="serif link-card__name">Ken Alexander</span>
                <span className="muted link-card__desc">
                  Software and cloud systems — the developer behind this atlas.
                </span>
              </span>
              <Icon name="external" size={16} />
            </a>
          </li>
        </ul>
      </section>

      <section className="section">
        <h2 className="micro section__title">Bibliography</h2>
        <ol className="refs">
          {references.map((ref) => (
            <li key={ref.id} className="ref">
              <p className="ref__title">{ref.title}</p>
              <p className="ref__meta muted">
                {shortenAuthors(ref.authors)} &middot; <i>{ref.journal}</i> &middot; {ref.year}
                {citationLocator(ref) && <> &middot; {citationLocator(ref)}</>}
                {ref.evidenceType !== 'primary-literature' && (
                  <> &middot; {ref.evidenceType.replace('-', ' ')}</>
                )}
              </p>
              <p className="ref__ids">
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
                {ref.pmid && (
                  <a
                    className="link mono ref__doi"
                    href={pubmedUrl(ref.pmid)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    PMID {ref.pmid}
                    <Icon name="external" size={13} />
                  </a>
                )}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <p className="colophon muted">
        An independent reference project. Nothing here is medical advice or a claim of
        pharmacological effect.
      </p>
    </div>
  );
}
