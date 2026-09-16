import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { compounds, species } from '../../data';
import { VerificationBadge } from '../VerificationBadge/VerificationBadge';
import styles from './GlobalSearch.module.css';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: 'compound' | 'species', item: any }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    
    // Search compounds
    const compoundResults = compounds.filter(c => 
      c.preferredName.toLowerCase().includes(term) ||
      c.synonyms.some(s => s.toLowerCase().includes(term)) ||
      (c.pubchemCid && c.pubchemCid.toString() === term) ||
      (c.inchikey && c.inchikey.toLowerCase().includes(term)) ||
      (c.canonicalSmiles && c.canonicalSmiles.toLowerCase().includes(term)) ||
      c.chemicalClass.toLowerCase().includes(term)
    ).map(c => ({ type: 'compound' as const, item: c }));

    // Search species
    const speciesResults = species.filter(s => 
      s.scientificName.toLowerCase().includes(term) ||
      s.commonNames.some(cn => cn.toLowerCase().includes(term))
    ).map(s => ({ type: 'species' as const, item: s }));

    setResults([...speciesResults, ...compoundResults].slice(0, 20)); // Limit to 20 results
    setSelectedIndex(0);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          handleResultClick(selected.type, selected.item.slug);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleResultClick = (type: 'compound' | 'species', slug: string) => {
    if (type === 'compound') {
      navigate(`/compound/${slug}`);
    } else {
      navigate(`/species/${slug}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search compounds, CIDs, formulas, species..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className={styles.closeButton} onClick={onClose} aria-label="Close search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.results}>
          {query.trim() !== '' && results.length === 0 ? (
            <div className={styles.noResults}>
              No results found for "{query}"
            </div>
          ) : (
            <ul className={styles.resultList}>
              {results.map((result, index) => {
                const isSelected = index === selectedIndex;
                
                if (result.type === 'compound') {
                  const c = result.item;
                  return (
                    <li 
                      key={`c-${c.id}`} 
                      className={`${styles.resultItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleResultClick('compound', c.slug)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={styles.resultMain}>
                        <span className={styles.resultName}>{c.preferredName}</span>
                        {c.molecularFormula && (
                          <span className={styles.resultFormula}>{c.molecularFormula}</span>
                        )}
                      </div>
                      <div className={styles.resultMeta}>
                        <span className={styles.resultClass}>{c.chemicalClass}</span>
                        <VerificationBadge status={c.verificationStatus} compact />
                      </div>
                    </li>
                  );
                } else {
                  const s = result.item;
                  return (
                    <li 
                      key={`s-${s.id}`} 
                      className={`${styles.resultItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleResultClick('species', s.slug)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={styles.resultMain}>
                        <span className={styles.resultName}>
                          <em>{s.scientificName}</em>
                        </span>
                      </div>
                      <div className={styles.resultMeta}>
                        <span className={styles.resultType}>Species</span>
                        {s.commonNames.length > 0 && (
                          <span className={styles.resultCommonName}>{s.commonNames[0]}</span>
                        )}
                      </div>
                    </li>
                  );
                }
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
