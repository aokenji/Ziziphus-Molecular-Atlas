import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.brandInfo}>
            <div className={styles.brand}>ZIZIPHUS MOLECULAR ATLAS</div>
            <p className={styles.about}>
              A curated molecular reference for compounds reported in Ziziphus. Part of the TalanaiHub research platform.
            </p>
          </div>
          
          <div className={styles.navGroup}>
            <div className={styles.navColumn}>
              <span className={styles.navTitle}>DATABASE</span>
              <Link to="/compounds" className={styles.navLink}>Compounds</Link>
              <Link to="/species" className={styles.navLink}>Species</Link>
            </div>
            <div className={styles.navColumn}>
              <span className={styles.navTitle}>ABOUT</span>
              <Link to="/methodology" className={styles.navLink}>Methodology</Link>
              <Link to="/references" className={styles.navLink}>References</Link>
            </div>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <div className={styles.citation}>
            Data should be cited with reference to original sources.
          </div>
          <div className={styles.copyright}>
            © 2024 TalanaiHub · Ziziphus Molecular Atlas
          </div>
        </div>
      </div>
    </footer>
  );
};
