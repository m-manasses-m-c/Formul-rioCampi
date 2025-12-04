
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Submission, AdminTab, FormConfig } from '../types';
import OverviewTab from './dashboard/OverviewTab';
import CalendarTab from './dashboard/CalendarTab';
import ConfigTab from './dashboard/ConfigTab';
import FormsManagerTab from './dashboard/FormsManagerTab';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  onLogout: () => void;
  allIcts: string[];
  allCampi: any[];
  onConfigUpdate: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, allIcts, allCampi, onConfigUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('charts');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Carrega lista de formulários e submissões iniciais
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const [formsRes, subsRes] = await Promise.all([
        api.fetchFormConfigs(),
        api.fetchSubmissions(null) // null busca tudo inicialmente se selectedFormId for 'all'
      ]);
      
      if (formsRes.data) setForms(formsRes.data);
      if (subsRes.data) setSubmissions(subsRes.data);
      setLoading(false);
    };
    initData();
  }, []);

  // Atualiza submissões quando o filtro muda
  useEffect(() => {
    const filterData = async () => {
      setLoading(true);
      const idToFetch = selectedFormId === 'all' ? null : selectedFormId;
      const { data } = await api.fetchSubmissions(idToFetch);
      if (data) setSubmissions(data);
      setLoading(false);
    };
    filterData();
  }, [selectedFormId]);

  const exportExcel = () => {
    if (submissions.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    const rows: any[] = [];
    submissions.forEach(sub => {
        const formName = forms.find(f => f.id === sub.form_config_id)?.edict_name || "Legado/Outro";
        
        if (Array.isArray(sub.campi)) {
            sub.campi.forEach(campus => {
                rows.push({
                    "ID Resposta": sub.id,
                    "Data Cadastro": new Date(sub.created_at).toLocaleString('pt-BR'),
                    "Nome Responsável": sub.name,
                    "Email Responsável": sub.email,
                    "Celular": sub.phone || "N/A",
                    "ICT": sub.ict,
                    "Campus": campus.name,
                    "ID Campus": campus.id,
                    "Edital/Formulário": formName
                });
            });
        }
    });

    const filterName = selectedFormId === 'all' ? 'Geral' : forms.find(f => f.id === selectedFormId)?.title || 'Filtro';
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Adesoes");
    XLSX.writeFile(workbook, `Relatorio_${filterName}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
        {/* Navbar Admin */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col xl:flex-row justify-between items-center gap-4 sticky top-4 z-30">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                <div className="flex items-center gap-3">
                    <div className="bg-brand text-white p-2 rounded-lg"><i className="fa-solid fa-chart-pie"></i></div>
                    <h2 className="text-lg font-bold text-slate-800">Dashboard</h2>
                </div>
                
                {/* Seletor de Formulário (Filtro) */}
                <div className="relative w-full sm:w-64">
                    <i className="fa-solid fa-filter absolute left-3 top-3 text-slate-400 text-xs"></i>
                    <select 
                        value={selectedFormId} 
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">Todos os Formulários</option>
                        {forms.map(f => (
                            <option key={f.id} value={f.id}>
                                {f.title} - {f.edict_name.substring(0, 20)}...
                            </option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-3 text-slate-400 text-xs pointer-events-none"></i>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end overflow-x-auto">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('charts')} className={`px-3 md:px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'charts' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Visão Geral</button>
                    <button onClick={() => setActiveTab('forms')} className={`px-3 md:px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'forms' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Formulários</button>
                    <button onClick={() => setActiveTab('calendar')} className={`px-3 md:px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'calendar' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Cronograma</button>
                    <button onClick={() => setActiveTab('config')} className={`px-3 md:px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'config' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Config</button>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={exportExcel} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap">
                        <i className="fa-solid fa-file-excel"></i> <span className="hidden md:inline">XLS</span>
                    </button>
                    <button onClick={onLogout} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-bold transition cursor-pointer whitespace-nowrap"><i className="fa-solid fa-power-off"></i></button>
                </div>
            </div>
        </div>

        {loading ? (
            <div className="p-12 text-center text-slate-500">
                <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-brand"></i>
                <p>Carregando dados...</p>
            </div>
        ) : (
            <>
                {activeTab === 'charts' && <OverviewTab submissions={submissions} allCampi={allCampi} />}
                {activeTab === 'forms' && <FormsManagerTab />}
                {activeTab === 'calendar' && <CalendarTab submissions={submissions} allCampi={allCampi} />}
                {activeTab === 'config' && <ConfigTab currentCount={{ icts: allIcts.length, campi: allCampi.length }} onUpdate={onConfigUpdate} />}
            </>
        )}
    </div>
  );
};

export default AdminDashboard;
