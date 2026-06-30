import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import '@/styles/index.css';

// The side panel reuses the dashboard — its responsive masonry collapses to a single column
// in the narrow panel viewport.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
);
