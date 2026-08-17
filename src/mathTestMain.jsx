import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import MathTestPage from './dev/MathTestPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MathTestPage />
  </StrictMode>,
);
