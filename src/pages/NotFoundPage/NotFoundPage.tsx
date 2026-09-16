import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <Helmet>
        <title>Page Not Found — Ziziphus Molecular Atlas</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page not found</h2>
        <p className="error-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="error-actions">
          <Link to="/" className="action-link">Return to Home</Link>
          <span className="action-divider">•</span>
          <Link to="/compounds" className="action-link">Search Database</Link>
        </div>
      </div>
    </div>
  );
}
