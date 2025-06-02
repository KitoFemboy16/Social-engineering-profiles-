import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { CharacterProvider, useCharacters } from './contexts/CharacterContext';
import './styles/global.css';

// Lazy-loaded components for code splitting
const CharacterList = lazy(() => import('./components/CharacterList'));
const CharacterForm = lazy(() => import('./components/CharacterForm'));
const CharacterDetail = lazy(() => import('./components/CharacterDetail'));
const NetworkView = lazy(() => import('./components/NetworkView'));
const Settings = lazy(() => import('./components/Settings'));
const ErrorBoundary = lazy(() => import('./components/ErrorBoundary'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex-center h-100">
    <div className="spinner"></div>
    <p className="mt-3 text-accent">Loading...</p>
  </div>
);

// Notification component
const Notification = ({ message, type, onClose }: { 
  message: string; 
  type: 'success' | 'error' | 'info'; 
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`notification notification-${type}`}>
      <div className="flex-between">
        <p className="mb-0">{message}</p>
        <button 
          className="btn btn-icon btn-sm" 
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Main layout with navigation
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { 
    theme, 
    toggleTheme, 
    uiState,
    setUIState,
    characters,
    generateNetworkGraph
  } = useCharacters();
  
  // Handle responsive navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Update document theme attribute when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  // Preload network data when navigating to network view
  const handleNetworkNavClick = () => {
    if (characters.length > 0) {
      generateNetworkGraph();
    }
    setMobileMenuOpen(false);
  };
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('.nav-mobile')) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);
  
  return (
    <div className={`app-container ${theme}`}>
      <header className="header">
        <div className="container">
          <nav className="nav flex-between">
            <div className="flex-center">
              <Link to="/" className="nav-logo">SocialProfiler</Link>
              
              {/* Desktop Navigation */}
              <ul className="nav-links d-none d-md-flex">
                <li>
                  <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                    Characters
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/network" 
                    className="nav-link" 
                    onClick={handleNetworkNavClick}
                  >
                    Network
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                    Settings
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="flex-center gap-2">
              {/* Theme Toggle */}
              <button 
                className="btn btn-icon" 
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              
              {/* Create New Character Button */}
              <Link to="/create" className="btn btn-primary d-none d-md-flex">
                New Character
              </Link>
              
              {/* Mobile Menu Toggle */}
              <button 
                className="btn btn-icon d-md-none" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                ☰
              </button>
            </div>
          </nav>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="nav-mobile bg-secondary p-3 rounded shadow-lg d-md-none">
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link 
                    to="/" 
                    className="d-block p-2 rounded hover-bg-tertiary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Characters
                  </Link>
                </li>
                <li className="mb-2">
                  <Link 
                    to="/network" 
                    className="d-block p-2 rounded hover-bg-tertiary"
                    onClick={handleNetworkNavClick}
                  >
                    Network
                  </Link>
                </li>
                <li className="mb-2">
                  <Link 
                    to="/settings" 
                    className="d-block p-2 rounded hover-bg-tertiary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </li>
                <li className="mb-2">
                  <Link 
                    to="/create" 
                    className="btn btn-primary btn-block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    New Character
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>
      
      <main className="content-area">
        <div className="container">
          {children}
        </div>
      </main>
      
      {/* Notification System */}
      {uiState.notification.show && (
        <Notification 
          message={uiState.notification.message} 
          type={uiState.notification.type} 
          onClose={() => setUIState({ 
            notification: { ...uiState.notification, show: false } 
          })}
        />
      )}
      
      {/* Loading Overlay */}
      {uiState.isLoading && (
        <div className="overlay">
          <div className="spinner"></div>
        </div>
      )}
      
      <footer className="bg-secondary p-3 text-center text-secondary">
        <div className="container">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} SocialProfiler - For social analysis and memory assistance only
          </p>
          <p className="text-xs opacity-75 mt-1">
            All data is stored locally in your browser. Your privacy is respected.
          </p>
        </div>
      </footer>
    </div>
  );
};

// App component with routes and context provider
const App: React.FC = () => {
  return (
    <ErrorBoundary fallback={<div className="container p-5 text-center">Something went wrong. Please refresh the page.</div>}>
      <CharacterProvider>
        <Router>
          <MainLayout>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<CharacterList />} />
                <Route path="/character/:id" element={<CharacterDetail />} />
                <Route path="/create" element={<CharacterForm />} />
                <Route path="/edit/:id" element={<CharacterForm />} />
                <Route path="/network" element={<NetworkView />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </MainLayout>
        </Router>
      </CharacterProvider>
    </ErrorBoundary>
  );
};

export default App;
