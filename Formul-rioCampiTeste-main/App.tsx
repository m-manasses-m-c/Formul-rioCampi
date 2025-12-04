
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import FormView from './components/FormView';
import SuccessView from './components/SuccessView';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { ViewState, Campus, FormConfig } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('form');
  const [allIcts, setAllIcts] = useState<string[]>([]);
  const [allCampi, setAllCampi] = useState<Campus[]>([]);
  const [activeFormConfig, setActiveFormConfig] = useState<FormConfig | null>(null);
  
  // State to hold the email of the last successful submission to display in success view
  const [lastSubmissionEmail, setLastSubmissionEmail] = useState('');

  const fetchConfig = async () => {
    const { icts, campi } = await api.fetchGlobalConfig();
    setAllIcts(icts);
    setAllCampi(campi);
  };

  useEffect(() => {
    fetchConfig();
    
    // Check Admin Session
    const session = localStorage.getItem('assistec_admin_session');
    if (session) {
        if (Date.now() < parseInt(session)) {
            // Valid session
        } else {
            localStorage.removeItem('assistec_admin_session');
        }
    }

    // Determine which form to load
    const params = new URLSearchParams(window.location.search);
    const formId = params.get('id');
    
    const loadForm = async () => {
        const config = await api.getActiveFormConfig(formId || undefined);
        if (config) {
            setActiveFormConfig(config);
        }
    };
    loadForm();

  }, []);

  const handleAdminClick = () => {
    const session = localStorage.getItem('assistec_admin_session');
    if (session && Date.now() < parseInt(session)) {
        setCurrentView('dashboard');
    } else {
        setCurrentView('adminLogin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('assistec_admin_session');
    setCurrentView('form');
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <CookieConsent />
      
      <Navbar currentView={currentView} onAdminClick={handleAdminClick} />

      <main className="flex-grow container mx-auto px-4 py-2 max-w-4xl relative z-10 mb-10">
        {currentView === 'form' && (
          <FormView 
            onSuccess={(email) => { 
              setLastSubmissionEmail(email); 
              setCurrentView('success'); 
            }} 
            allIcts={allIcts}
            allCampi={allCampi}
            config={activeFormConfig}
          />
        )}
        
        {currentView === 'success' && (
          <SuccessView 
            email={lastSubmissionEmail} 
            onReset={() => setCurrentView('form')} 
          />
        )}
        
        {currentView === 'adminLogin' && (
          <AdminLogin 
            onLoginSuccess={() => setCurrentView('dashboard')} 
            onBack={() => setCurrentView('form')}
          />
        )}
        
        {currentView === 'dashboard' && (
          <AdminDashboard 
            onLogout={handleLogout} 
            allIcts={allIcts}
            allCampi={allCampi}
            onConfigUpdate={fetchConfig}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
