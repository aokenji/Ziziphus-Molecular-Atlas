import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { GlobalSearch } from '../GlobalSearch/GlobalSearch';
import styles from './Header.module.css';

interface HeaderProps {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchOpen, setSearchOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          {/* Left: Brand */}
          <Link to="/" className={styles.brand} onClick={closeMenu}>
            ZIZIPHUS MOLECULAR ATLAS
          </Link>

          {/* Center: Nav links (Desktop) */}
          <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
            <NavLink 
              to="/compounds" 
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              onClick={closeMenu}
            >
              Compounds
            </NavLink>
            <NavLink 
              to="/species" 
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              onClick={closeMenu}
            >
              Species
            </NavLink>
            <NavLink 
              to="/references" 
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              onClick={closeMenu}
            >
              References
            </NavLink>
            <NavLink 
              to="/methodology" 
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              onClick={closeMenu}
            >
              Methodology
            </NavLink>
          </nav>

          {/* Right: Actions */}
          <div className={styles.actions}>
            <button 
              className={styles.iconButton} 
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button 
              className={styles.iconButton} 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <button 
              className={`${styles.iconButton} ${styles.mobileMenuBtn}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <GlobalSearch 
          isOpen={searchOpen} 
          onClose={() => setSearchOpen(false)} 
        />
      )}
    </>
  );
};
