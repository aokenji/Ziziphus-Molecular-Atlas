import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { compounds, species } from '../../data';
import { VerificationBadge } from '../../components/VerificationBadge/VerificationBadge';
import { EmptyState } from '../../components/EmptyState/EmptyState';

import './CompoundsPage.css';

export function CompoundsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [classFilter, setClassFilter] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'weight' | 'class'>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearch) {
      setSearchParams({ q: debouncedSearch });
    } else {
      setSearchParams({});
    }
    setCurrentPage(1); // Reset page on new search
  }, [debouncedSearch, setSearchParams]);

  // Extract filter options
  const classes = useMemo(() => Array.from(new Set(compounds.map(c => c.chemicalClass))).sort(), []);
  const allSpecies = useMemo(() => species.map(s => s.scientificName).sort(), []);

  const filteredCompounds = useMemo(() => {
    let result = compounds;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(c => 
        c.preferredName.toLowerCase().includes(q) ||
        c.synonyms.some(s => s.toLowerCase().includes(q)) ||
        (c.molecularFormula || "").toLowerCase().includes(q) ||
        (c.pubchemCid && c.pubchemCid.toString().includes(q)) ||
        (c.inchikey && c.inchikey.toLowerCase().includes(q)) ||
        (c.canonicalSmiles && c.canonicalSmiles.toLowerCase().includes(q)) ||
        c.chemicalClass.toLowerCase().includes(q)
      );
    }

    if (classFilter) {
      result = result.filter(c => c.chemicalClass === classFilter);
    }

    if (speciesFilter) {
      result = result.filter(c => c.species.some(o => o.speciesId === speciesFilter));
    }

    if (statusFilter) {
      result = result.filter(c => c.fieldVerification.chemicalIdentity === statusFilter);
    }

    return result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.preferredName.localeCompare(b.preferredName);
      } else if (sortBy === 'weight') {
        comparison = (a.molecularWeight || 0) - (b.molecularWeight || 0);
      } else if (sortBy === 'class') {
        comparison = a.chemicalClass.localeCompare(b.chemicalClass);
      }
      return sortDesc ? -comparison : comparison;
    });
  }, [debouncedSearch, classFilter, speciesFilter, statusFilter, sortBy, sortDesc]);

  const totalPages = Math.ceil(filteredCompounds.length / itemsPerPage);
  const paginatedCompounds = filteredCompounds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (column: 'name' | 'weight' | 'class') => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(false);
    }
  };

  return (
    <div className="compounds-page">
      <Helmet>
        <title>Compound Database — Ziziphus Molecular Atlas</title>
      </Helmet>

      <header className="page-header">
        <h1 className="page-title">Compound Database <span className="count-badge">{filteredCompounds.length}</span></h1>
      </header>

      <div className="controls-section">
        <input
          type="search"
          className="search-input full-width"
          placeholder="Search by name, synonym, formula, ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        
        <div className="filters-row">
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="filter-select">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select value={speciesFilter} onChange={e => setSpeciesFilter(e.target.value)} className="filter-select">
            <option value="">All Species</option>
            {allSpecies.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
            <option value="">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="partially-verified">Partially Verified</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </div>
      </div>

      {filteredCompounds.length === 0 ? (
        <EmptyState 
          title={debouncedSearch || classFilter || speciesFilter || statusFilter 
            ? "No compounds found. Try adjusting your filters." 
            : "No compounds match your search criteria."} 
        />
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('name')} className="sortable-th">
                    Compound {sortBy === 'name' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th>Formula / Weight</th>
                  <th onClick={() => toggleSort('class')} className="sortable-th">
                    Class {sortBy === 'class' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th>Primary Species</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompounds.map(compound => (
                  <tr key={compound.id}>
                    <td>
                      <Link to={`/compound/${compound.slug}`} className="compound-link">
                        {compound.preferredName}
                      </Link>
                    </td>
                    <td>
                      <div className="formula-cell">{compound.molecularFormula}</div>
                      <div className="weight-cell">{((compound.molecularWeight || 0) || 0).toFixed(2)}</div>
                    </td>
                    <td>{compound.chemicalClass}</td>
                    <td>
                      {compound.species[0] ? (
                        <span className="species-cell">{compound.species[0].speciesId}</span>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td>
                      <VerificationBadge status={compound.fieldVerification.chemicalIdentity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-list">
            {paginatedCompounds.map(compound => (
              <div key={compound.id} className="mobile-list-item">
                <div className="mobile-item-header">
                  <Link to={`/compound/${compound.slug}`} className="compound-link">
                    {compound.preferredName}
                  </Link>
                  <VerificationBadge status={compound.fieldVerification.chemicalIdentity} />
                </div>
                <div className="mobile-item-meta">
                  <span className="mono-text">{compound.molecularFormula}</span> • <span>{compound.chemicalClass}</span>
                </div>
                <div className="mobile-item-species">
                  {compound.species[0]?.speciesId || 'No species recorded'}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
                className="btn-page"
              >
                Previous
              </button>
              <span className="page-info">Page {currentPage} of {totalPages}</span>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
                className="btn-page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
