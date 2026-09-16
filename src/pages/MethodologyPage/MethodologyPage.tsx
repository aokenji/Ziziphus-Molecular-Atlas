import { Helmet } from 'react-helmet-async';
import { VerificationBadge } from '../../components/VerificationBadge/VerificationBadge';
import './MethodologyPage.css';

export function MethodologyPage() {
  return (
    <div className="methodology-page">
      <Helmet>
        <title>Methodology — Ziziphus Molecular Atlas</title>
      </Helmet>

      <div className="editorial-content">
        <h1>Methodology & Curation</h1>
        
        <p className="lead-text">
          The Ziziphus Molecular Atlas is a curated reference database aimed at standardizing the chemical identity and occurrence records of secondary metabolites isolated from the <i>Ziziphus</i> genus.
        </p>

        <section className="methodology-section">
          <h2>Purpose</h2>
          <p>
            Natural products research often suffers from propagated errors in structural assignments, ambiguous common names, and inconsistent stereochemical representations. The Atlas serves as a verified clearinghouse where molecular identity is rigorously cross-referenced between primary isolation literature and definitive chemical databases.
          </p>
        </section>

        <section className="methodology-section">
          <h2>Data Sources</h2>
          <p>
            Chemical structures and identifiers are primarily sourced from <strong>PubChem</strong>, ensuring interoperability with global chemical informatics infrastructure. Occurrence data (plant part, species) is strictly derived from peer-reviewed primary literature detailing the isolation and characterization of the compounds.
          </p>
        </section>

        <section className="methodology-section">
          <h2>Chemical Identity Verification</h2>
          <p>
            We establish chemical identity by cross-referencing the structural depictions (2D NMR, X-ray crystallography) provided in primary literature with canonical database entries. This process explicitly checks relative and absolute stereochemistry, resolving conflicts where older literature may omit or incorrectly assign chiral centers.
          </p>
        </section>

        <section className="methodology-section">
          <h2>Structure Standardization</h2>
          <p>
            All molecules are standardized to common machine-readable formats:
          </p>
          <ul>
            <li><strong>SMILES</strong> (Simplified Molecular Input Line Entry System): Provided as canonical and isomeric strings for structural database querying.</li>
            <li><strong>InChI & InChIKey</strong>: The IUPAC International Chemical Identifier, providing a unique hash for exact structure matching.</li>
          </ul>
        </section>

        <section className="methodology-section">
          <h2>3D Conformers</h2>
          <p>
            When visualized, 3D coordinates are generally pulled from PubChem's computationally generated conformers. Note that not all complex macrocyclic peptides (e.g., cyclopeptide alkaloids common in Ziziphus) have valid pre-computed 3D conformers in public databases. In such cases, 2D structures or fallback representations are utilized.
          </p>
        </section>

        <section className="methodology-section">
          <h2>Occurrence Verification</h2>
          <p>
            The assertion that compound <em>X</em> occurs in species <em>Y</em> requires direct evidentiary support. We distinguish between "reported in literature" (which may be a passing mention or unverified secondary citation) and "chemically verified" (primary isolation or definitive LC-MS/MS identification).
          </p>
        </section>

        <section className="methodology-section">
          <h2>Verification Status Definitions</h2>
          <div className="status-definitions">
            <div className="status-def-item">
              <VerificationBadge status="verified" />
              <p>The structure or occurrence is unambiguously supported by modern primary literature and matches definitive chemical databases without conflict.</p>
            </div>
            <div className="status-def-item">
              <VerificationBadge status="partially-verified" />
              <p>Evidence exists but contains minor ambiguities (e.g., unspecified stereochemistry in the original paper, or conflicting botanical taxonomy).</p>
            </div>
            <div className="status-def-item">
              <VerificationBadge status="unresolved" />
              <p>Significant conflict exists between sources, or the structure cannot be confidently matched to a known canonical identifier.</p>
            </div>
          </div>
        </section>

        <section className="methodology-section">
          <h2>Limitations</h2>
          <p>
            The Atlas is manually curated and is not exhaustive. The absence of a compound does not imply its absence from the genus. The evidence provided reflects the current state of curation and may be incomplete. This database is a reference tool and not a substitute for rigorous primary literature review.
          </p>
        </section>

        <section className="methodology-section">
          <h2>Citation Policy</h2>
          <p>
            When utilizing data from the Atlas, please cite both the Ziziphus Molecular Atlas (as the curation platform) and the original primary literature referenced in the specific compound's occurrence records.
          </p>
        </section>

        <section className="methodology-section">
          <h2>Updates</h2>
          <p>
            Records are continuously revised as new primary literature is published or when historical structural assignments are corrected in the scientific literature.
          </p>
        </section>
      </div>
    </div>
  );
}
