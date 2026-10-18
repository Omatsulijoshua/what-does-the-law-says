import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobileSearch.css'
import App from './App.jsx'
import { migrateStoredSettings } from './utils/storageMigration.js'
import { applyTheme, getInitialTheme } from './utils/theme.js'

migrateStoredSettings(localStorage)
applyTheme(getInitialTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
