import React from 'react';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onAdminClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onAdminClick }) => {
  return (
    <nav className="w-full py-4 px-6 flex justify-between items-center z-40">
      <div className="flex items-center gap-3">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <img 
            src="https://images.even3.com/dsbYl5oP6soFkxgNSkt7fz3qmKo=/fit-in/250x250/smart/https://static.even3.com/logos/logo.738e2a58735c4796ade6.png" 
            className="h-8 w-auto" 
            alt="Logo"
          />
        </div>
        <span className="font-display font-bold text-slate-800 tracking-tight hidden md:block">
          Assistec <span className="text-brand">Portal</span>
        </span>
      </div>
      {currentView !== 'dashboard' && (
        <button 
          onClick={onAdminClick} 
          className="text-xs font-semibold text-slate-500 hover:text-brand transition flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white hover:shadow-sm"
        >
          <i className="fa-solid fa-shield-halved"></i> Área Restrita
        </button>
      )}
    </nav>
  );
};

export default Navbar;