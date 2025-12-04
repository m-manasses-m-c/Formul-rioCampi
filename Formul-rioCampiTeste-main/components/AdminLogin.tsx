import React, { useState } from 'react';
import { api } from '../services/api';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkLogin = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data: isValid, error: rpcError } = await api.checkAdminAccess(password);
      if (rpcError) throw rpcError;

      if (isValid === true) {
        // Set session for 2 hours
        const expiry = Date.now() + (2 * 60 * 60 * 1000);
        localStorage.setItem('assistec_admin_session', expiry.toString());
        onLoginSuccess();
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(err);
      alert('Login error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl shadow-xl p-8 max-w-md mx-auto mt-20 animate-fade-in-up">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mx-auto mb-3 text-white">
          <i className="fa-solid fa-user-shield"></i>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Acesso Administrativo</h2>
        <p className="text-sm text-slate-500">Digite sua credencial para continuar</p>
      </div>
      <div className="space-y-4">
        <input 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && checkLogin()}
          type="password" 
          placeholder="Senha de acesso" 
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
        />
        <button 
          onClick={checkLogin} 
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-70"
        >
          {loading ? 'Verificando...' : 'Entrar no Painel'}
        </button>
        <button 
          onClick={onBack} 
          className="w-full text-slate-400 hover:text-slate-600 text-sm font-medium py-2"
        >
          Voltar ao site
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-xs text-center mt-4 font-bold">
          <i className="fa-solid fa-circle-exclamation mr-1"></i> Senha incorreta
        </p>
      )}
    </div>
  );
};

export default AdminLogin;