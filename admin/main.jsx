import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import './styles.css';
import { AdminDashboard } from './AdminDashboard.jsx';
import { applyTheme, getInitialTheme } from '../src/utils/theme.js';

applyTheme(getInitialTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode><AdminDashboard /></StrictMode>
);
