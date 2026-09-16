import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted so the first paint does not wait on a third-party font host.
// Fraunces carries the optical-size axis, which is what the display sizes rely on.
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/fraunces/opsz-italic.css';
import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/routes.css';

import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
