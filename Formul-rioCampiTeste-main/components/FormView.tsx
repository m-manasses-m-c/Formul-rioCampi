
import React, { useState, useMemo, useEffect } from 'react';
import { Campus, SelectedCampus, FormConfig } from '../types';
import { api } from '../services/api';

interface FormViewProps {
  onSuccess: (email: string) => void;
  allIcts: string[];
  allCampi: Campus[];
  config?: FormConfig | null;
}

const FormView: React.FC<FormViewProps> = ({ onSuccess, allIcts, allCampi, config }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', ict: '' });
  const [selectedCampi, setSelectedCampi] = useState<SelectedCampus[]>([]);
  
  // ICT Search State
  const [searchIct, setSearchIct] = useState('');
  const [showIctDropdown, setShowIctDropdown] = useState(false);
  
  // Campus Search State
  const [searchCampus, setSearchCampus] = useState('');
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);

  // Defaults if no config is loaded (fallback)
  const displayTitle = config?.title || "Registro de ICTs";
  const displayEdict = config?.edict_name || "Trilha de Inovação";

  const filteredIcts = useMemo(() => {
    if (!searchIct) return allIcts.slice(0, 10);
    return allIcts.filter(ict => ict.toLowerCase().includes(searchIct.toLowerCase())).slice(0, 20);
  }, [allIcts, searchIct]);

  const filteredAvailableCampi = useMemo(() => {
    if (!formData.ict) return [];
    const term = searchCampus.toLowerCase();
    return allCampi.filter(c => 
      c.ictName === formData.ict && 
      c.name.toLowerCase().includes(term) && 
      !selectedCampi.some(sel => sel.id === c.id)
    ).slice(0, 50);
  }, [allCampi, formData.ict, searchCampus, selectedCampi]);

  const handleSelectIct = (ict: string) => {
    setFormData(prev => ({ ...prev, ict }));
    setSearchIct('');
    setShowIctDropdown(false);
    setSelectedCampi([]); // Reset campi when ICT changes
  };

  const handleResetIct = () => {
    setFormData(prev => ({ ...prev, ict: '' }));
    setSelectedCampi([]);
    setSearchCampus('');
  };

  const handleAddCampus = (campus: Campus) => {
    setSelectedCampi(prev => [...prev, { ...campus, addedAt: new Date().toISOString() }]);
    setSearchCampus('');
    setShowCampusDropdown(false); // Close dropdown after selection
  };

  const handleRemoveCampus = (index: number) => {
    setSelectedCampi(prev => prev.filter((_, i) => i !== index));
  };

  // Simple phone mask
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    
    if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    if (val.length > 9) val = `${val.slice(0, 9)}-${val.slice(9)}`;
    
    setFormData(prev => ({ ...prev, phone: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ict || selectedCampi.length === 0) {
      alert("Preencha todos os campos e selecione ao menos um campus.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await api.submitResponse(
        formData.name,
        formData.email,
        formData.phone,
        formData.ict,
        selectedCampi,
        config?.id
      );
      if (error) throw error;

      // Attempt to send confirmation email
      // This is non-blocking to UI success, but we log errors if Edge Function is missing
      try {
        await api.sendConfirmationEmail({
          name: formData.name,
          email: formData.email,
          ict: formData.ict,
          campi: selectedCampi
        });
      } catch (emailErr) {
        console.warn("Email confirmation failed (Edge Function might be missing):", emailErr);
      }

      onSuccess(formData.email);
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl shadow-2xl shadow-indigo-900/10 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        
        <div className="relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-3">
             {new Date().getFullYear()}
          </span>
          <h1 className="font-display text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">
             {displayTitle} - {displayEdict}
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Preencha os dados abaixo para oficializar a participação dos campi da sua instituição no programa <span className="text-white font-semibold">{displayEdict}</span>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
        
        {/* Section 1: ID */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Identificação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Nome Completo</label>
              <div className="relative">
                <i className="fa-regular fa-user absolute left-4 top-3.5 text-slate-400"></i>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-slate-700 font-medium placeholder-slate-400" 
                  placeholder="Seu nome"
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">E-mail Institucional</label>
              <div className="relative">
                <i className="fa-regular fa-envelope absolute left-4 top-3.5 text-slate-400"></i>
                <input 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-slate-700 font-medium placeholder-slate-400" 
                  placeholder="seu.email@inst.edu.br"
                />
              </div>
            </div>

            <div className="relative md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Celular / WhatsApp</label>
              <div className="relative">
                <i className="fa-brands fa-whatsapp absolute left-4 top-3.5 text-slate-400"></i>
                <input 
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required 
                  type="tel" 
                  maxLength={15}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-slate-700 font-medium placeholder-slate-400" 
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: ICT */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Instituição (ICT)</h3>
          <div className="relative">
            <div className="relative">
              <i className="fa-solid fa-building-columns absolute left-4 top-3.5 text-slate-400 z-10"></i>
              <input 
                value={formData.ict || searchIct}
                onChange={(e) => !formData.ict && setSearchIct(e.target.value)}
                onFocus={() => !formData.ict && setShowIctDropdown(true)}
                onBlur={() => setTimeout(() => setShowIctDropdown(false), 200)}
                type="text" 
                className={`w-full pl-10 pr-10 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none transition-all text-slate-700 font-medium ${formData.ict ? 'bg-blue-50/50 border-brand/30 text-brand' : ''}`}
                placeholder="Busque pela sigla ou nome..."
                disabled={!!formData.ict}
                autoComplete="off"
              />
              {formData.ict ? (
                <button type="button" onClick={handleResetIct} className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500 bg-white p-1 rounded-md shadow-sm transition-colors border border-slate-100 cursor-pointer z-20">
                  <i className="fa-solid fa-times text-xs"></i>
                </button>
              ) : (
                <i className="fa-solid fa-chevron-down absolute right-4 top-4 text-slate-300 text-xs pointer-events-none"></i>
              )}

              {showIctDropdown && !formData.ict && (
                <div className="absolute z-30 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up origin-top">
                  <ul className="max-h-60 overflow-y-auto">
                    {filteredIcts.map(ict => (
                      <li 
                        key={ict} 
                        onMouseDown={() => handleSelectIct(ict)} 
                        className="px-4 py-3 hover:bg-brand/5 cursor-pointer text-slate-600 hover:text-brand border-b border-slate-50 last:border-0 text-sm transition-colors flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {ict}
                      </li>
                    ))}
                    {filteredIcts.length === 0 && (
                      <li className="px-4 py-4 text-center text-slate-400 text-sm">Nenhuma ICT encontrada.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Campi */}
        <div className={`space-y-4 ${!formData.ict ? 'opacity-60 grayscale pointer-events-none select-none' : ''}`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Seleção de Campi</h3>
            {formData.ict && (
              <span className="text-xs font-medium text-brand bg-brand/10 px-2 py-1 rounded-md">
                <i className="fa-solid fa-check-circle mr-1"></i> {formData.ict}
              </span>
            )}
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-brand/50 group-focus-within:text-brand transition-colors"></i>
            </div>
            <input 
              value={searchCampus}
              onChange={(e) => setSearchCampus(e.target.value)}
              onFocus={() => setShowCampusDropdown(true)}
              onBlur={() => setTimeout(() => setShowCampusDropdown(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredAvailableCampi.length > 0) handleAddCampus(filteredAvailableCampi[0]);
                }
              }}
              type="text" 
              className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-slate-200 bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none shadow-sm transition-all duration-300 text-lg placeholder-slate-400" 
              placeholder="Digite o nome do campus..."
              disabled={!formData.ict}
              autoComplete="off"
            />
            
            {showCampusDropdown && filteredAvailableCampi.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up origin-top">
                <ul className="max-h-60 overflow-y-auto">
                  {filteredAvailableCampi.map(campus => (
                    <li 
                      key={campus.id} 
                      onMouseDown={() => handleAddCampus(campus)} 
                      className="px-5 py-3.5 hover:bg-green-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 group/item transition-colors"
                    >
                      <span className="text-slate-700 font-medium group-hover/item:text-green-700">{campus.name}</span>
                      <i className="fa-solid fa-plus text-slate-300 group-hover/item:text-green-600 transition-colors"></i>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* List of Selected */}
          <div className="min-h-[120px] bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 relative">
            {selectedCampi.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                <i className="fa-solid fa-map-location-dot text-3xl mb-2 opacity-50"></i>
                <span className="text-sm">Nenhum campus adicionado ainda.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
              {selectedCampi.map((item, index) => (
                <div key={item.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group hover:-translate-y-1 transition-transform duration-300 hover:shadow-md hover:border-brand/20 animate-fade-in-up">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-school text-xs"></i>
                    </div>
                    <p className="font-semibold text-slate-700 text-sm truncate">{item.name}</p>
                  </div>
                  <button type="button" onClick={() => handleRemoveCampus(index)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors cursor-pointer">
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full relative overflow-hidden bg-gradient-to-r from-brand to-indigo-600 hover:from-indigo-500 hover:to-brandLight text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-indigo-500/30 transform hover:scale-[1.01] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-notch fa-spin"></i> Processando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 text-lg tracking-wide">
                Confirmar Adesão <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </span>
            )}
          </button>
        </div>
      </form>

      <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
        <i className="fa-solid fa-lock"></i> Seus dados estão seguros e criptografados.
      </div>
    </div>
  );
};

export default FormView;
