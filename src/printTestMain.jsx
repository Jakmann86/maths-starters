import { createRoot } from 'react-dom/client';
import './index.css';
import PrintTestPage from './dev/PrintTestPage.jsx';

// Mounted outside #root on purpose: print CSS hides #root on paper (the app's
// print screen renders into document.body), so a page mounted there would
// measure as empty in print mode.
createRoot(document.getElementById('print-test')).render(<PrintTestPage />);
