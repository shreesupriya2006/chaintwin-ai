// Main App Component with Protected Routing and Layout (ChainTwin AI)
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/layout/CommandPalette';
import { FloatingAIChat } from './components/chat/FloatingAIChat';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DataManager } from './pages/DataManager';
import { BackupSuppliers } from './pages/BackupSuppliers';
import { WhatIfSimulator } from './pages/WhatIfSimulator';
import { RecoveryPlanner } from './pages/RecoveryPlanner';
import { AlertsHistory } from './pages/AlertsHistory';
import { KnowledgeBase } from './pages/KnowledgeBase';

import { useSupplyChainStore } from './store/useSupplyChainStore';
import { auth, onAuthStateChanged, isFirebaseConfigured } from './lib/firebase';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser } = useSupplyChainStore();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const location = useLocation();

  // Listen to Firebase auth state if configured
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Manager',
            photoURL: firebaseUser.photoURL,
          });
        }
      });
      return () => unsubscribe();
    }
  }, [setUser]);

  // If not signed in and not in demo mode, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/':
        return 'Live Digital Twin Dashboard';
      case '/data':
        return 'Data Manager & Telemetry';
      case '/suppliers':
        return 'Backup Suppliers & Sourcing Studio';
      case '/simulator':
        return 'What-If Simulation Sandbox';
      case '/planner':
        return 'Autonomous Recovery Planner';
      case '/alerts':
        return 'Early Warnings & Audit History';
      case '/knowledge':
        return 'Knowledge Base & Policy RAG';
      default:
        return 'ChainTwin AI';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={getPageTitle(location.pathname)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>

      <FloatingAIChat />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};

export function App() {
  const { theme } = useSupplyChainStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/data" element={<DataManager />} />
                <Route path="/suppliers" element={<BackupSuppliers />} />
                <Route path="/simulator" element={<WhatIfSimulator />} />
                <Route path="/planner" element={<RecoveryPlanner />} />
                <Route path="/alerts" element={<AlertsHistory />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ProtectedLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
