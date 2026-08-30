import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Theme, colors } from './theme';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import Projection from './pages/Projection';
import Comparison from './pages/Comparison';
import Settings from './pages/Settings';
import Questions from './pages/Questions';
import TariffReference from './pages/TariffReference';

// Theme Context
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: typeof colors[Theme];
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    // Apply theme to document root if needed
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: colors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

const App: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  return (
    <ThemeProvider>
      <Router>
        <div style={{ display: 'flex', height: '100vh' }}>
          <Navigation selectedCaseId={selectedCaseId} onSelectCase={setSelectedCaseId} />
          <Routes>
            <Route path="/" element={<Dashboard onSelectCase={setSelectedCaseId} />} />
            <Route path="/timeline" element={
              selectedCaseId ? <Timeline caseId={selectedCaseId} /> : <Navigate to="/" />
            } />
            <Route path="/projection" element={
              selectedCaseId ? <Projection caseId={selectedCaseId} /> : <Navigate to="/" />
            } />
            <Route path="/comparison" element={
              selectedCaseId ? <Comparison caseId={selectedCaseId} /> : <Navigate to="/" />
            } />
            <Route path="/questions" element={
              selectedCaseId ? <Questions caseId={selectedCaseId} /> : <Navigate to="/" />
            } />
            <Route path="/tariff" element={<TariffReference />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
