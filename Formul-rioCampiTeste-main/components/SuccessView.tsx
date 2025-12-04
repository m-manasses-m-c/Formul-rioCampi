
import React from 'react';

interface SuccessViewProps {
  onReset: () => void;
  email?: string;
}

const SuccessView: React.FC<SuccessViewProps> = ({ onReset, email }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 text-center animate-fade-in-up max-w-lg mx-auto mt-10">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <i className="fa-solid fa-check text-4xl text-green-600"></i>
      </div>
      <h2 className="font-display text-3xl font-bold text-slate-800 mb-2">Sucesso!</h2>
      <p className="text-slate-500 mb-2 leading-relaxed">As informações da sua instituição foram registradas em nossa base de dados com segurança.</p>
      
      {email && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-sm text-blue-800">
          <p className="flex items-center justify-center gap-2 font-medium">
             <i className="fa-regular fa-paper-plane"></i> E-mail de confirmação enviado
          </p>
          <p className="text-blue-600/80 mt-1 text-xs">
            Uma cópia dos dados foi encaminhada para: <br/><strong>{email}</strong>
          </p>
        </div>
      )}

      {!email && <div className="mb-8"></div>}

      <button 
        onClick={onReset} 
        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-8 rounded-xl transition-colors cursor-pointer"
      >
        Fazer novo registro
      </button>
    </div>
  );
};

export default SuccessView;
