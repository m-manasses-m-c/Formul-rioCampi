import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const isAccepted = localStorage.getItem('cookiesAccepted');
    if (!isAccepted) {
      setAccepted(false);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white shadow-2xl rounded-2xl border border-slate-100 p-5 z-50 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <i className="fa-solid fa-cookie-bite text-yellow-500 text-xl mt-1"></i>
        <div>
          <p className="text-sm text-slate-600 mb-3">Utilizamos armazenamento local para melhorar sua experiência e salvar seu progresso.</p>
          <button 
            onClick={accept} 
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition w-full"
          >
            Entendi e Aceito
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;