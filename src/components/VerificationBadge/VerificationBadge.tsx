import type { VerificationStatus } from '../../data/types';
import styles from './VerificationBadge.module.css';

interface VerificationBadgeProps {
  status: VerificationStatus;
  compact?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ status, compact = false }) => {
  const getLabel = () => {
    switch (status) {
      case 'verified': return 'VERIFIED';
      case 'partially-verified': return 'PARTIALLY VERIFIED';
      case 'unresolved': return 'UNRESOLVED';
    }
  };

  return (
    <span className={`${styles.badge} ${styles[status]} ${compact ? styles.compact : ''}`}>
      <span className={styles.dot} />
      {!compact && <span className={styles.label}>{getLabel()}</span>}
    </span>
  );
};
