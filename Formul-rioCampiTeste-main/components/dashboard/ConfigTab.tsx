import React, { useState } from 'react';
import { api } from '../../services/api';

interface ConfigTabProps {
  currentCount: { icts: number, campi: number };
  onUpdate: () => void;
}

const ConfigTab: React.FC<ConfigTabProps> = ({ currentCount, onUpdate }) => {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleImport = async () => {
    if (!text.trim()) return setMsg({ text: 'Área vazia.', type: 'error' });
    
    try {
        const rows = text.split('\n');
        const tempIcts = new Set<string>();
        const tempCampi: Array<{ id: number, name: string, ictName: string }> = [];
        let idCounter = 1;

        rows.forEach(row => {
            const cols = row.split('\t');
            if (cols.length >= 3) {
                const sigla = cols[0].trim();
                const nome = cols[1].trim();
                const campus = cols[2].trim();
                
                if (sigla && nome && campus) {
                    const ictFullName = `${sigla} - ${nome}`;
                    tempIcts.add(ictFullName);
                    tempCampi.push({ id: idCounter++, name: campus, ictName: ictFullName });
                }
            }
        });

        if (tempIcts.size === 0) throw new Error("Formato inválido ou nenhum dado encontrado.");

        await api.updateGlobalConfig(Array.from(tempIcts).sort(), tempCampi);
        setMsg({ text: 'Base atualizada com sucesso!', type: 'success' });
        onUpdate();
    } catch (e: any) {
        setMsg({ text: 'Erro: ' + e.message, type: 'error' });
    }
  };

  const restoreDefault = async () => {
     await api.updateGlobalConfig(
        ['IFSP - Instituto Federal de São Paulo'],
        [{ id: 1, name: 'Campus São Paulo', ictName: 'IFSP - Instituto Federal de São Paulo' }]
     );
     onUpdate();
     setMsg({ text: 'Restaurado para padrão.', type: 'success' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
        <div className="mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><i className="fa-solid fa-file-excel"></i></div>
                <h3 className="text-lg font-bold text-slate-800">Importação de Dados</h3>
            </div>
            <p className="text-sm text-slate-500 ml-13">Copie as células do Excel e cole abaixo para atualizar a base de ICTs e Campi.</p>
        </div>

        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-100 mb-4 flex items-start gap-3">
            <i className="fa-solid fa-triangle-exclamation mt-1"></i>
            <div>
                <strong>Formato Obrigatório (3 Colunas):</strong>
                <div className="font-mono text-xs mt-1 bg-white/50 p-2 rounded">SIGLA [TAB] NOME DA INSTITUIÇÃO [TAB] NOME DO CAMPUS</div>
            </div>
        </div>

        <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-4 border border-slate-300 rounded-xl font-mono text-xs bg-slate-50 focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none transition" 
            placeholder={`Exemplo de colagem:\nIFSP\tInstituto Federal de São Paulo\tCampus São Paulo\nIFSP\tInstituto Federal de São Paulo\tCampus Pirituba...`}
        />

        <div className="flex justify-between items-center mt-6">
            <div className="text-xs text-slate-500 font-medium">
                <span className="flex items-center"><i className="fa-solid fa-database mr-1"></i> Base Atual: {currentCount.icts} ICTs / {currentCount.campi} Campi</span>
            </div>
            <div className="flex gap-3">
                    <button onClick={restoreDefault} className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2 text-sm transition cursor-pointer">
                    Restaurar Padrão
                </button>
                <button onClick={handleImport} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition shadow-lg shadow-green-600/20 flex items-center gap-2 cursor-pointer">
                    <i className="fa-solid fa-save"></i> Salvar na Nuvem
                </button>
            </div>
        </div>
        
        {msg.text && (
            <div className={`mt-4 p-3 rounded-lg text-sm font-bold border text-center ${msg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                {msg.text}
            </div>
        )}
    </div>
  );
};

export default ConfigTab;