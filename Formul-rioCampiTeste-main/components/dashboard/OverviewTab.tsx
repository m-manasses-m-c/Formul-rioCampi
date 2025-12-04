import React, { useMemo, useState } from 'react';
import { Submission } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OverviewTabProps {
  submissions: Submission[];
  allCampi: any[]; // Used for mapping if needed
}

const OverviewTab: React.FC<OverviewTabProps> = ({ submissions }) => {
  const [expandedIcts, setExpandedIcts] = useState<string[]>([]);

  // Consolidated Data Logic
  const consolidatedData = useMemo(() => {
    const ictMap: Record<string, {
      ictName: string;
      uniqueCampiIds: Set<string | number>;
      uniqueCampiNames: Set<string>;
      respondents: Set<string>;
    }> = {};

    submissions.forEach(sub => {
      if (!sub.ict || !sub.campi) return;
      if (!ictMap[sub.ict]) {
        ictMap[sub.ict] = {
          ictName: sub.ict,
          uniqueCampiIds: new Set(),
          uniqueCampiNames: new Set(),
          respondents: new Set()
        };
      }
      if (sub.email) ictMap[sub.ict].respondents.add(sub.email);
      if (Array.isArray(sub.campi)) {
        sub.campi.forEach(c => {
          ictMap[sub.ict].uniqueCampiIds.add(c.id);
          ictMap[sub.ict].uniqueCampiNames.add(c.name);
        });
      }
    });

    return Object.values(ictMap).map(item => ({
      ...item,
      uniqueCampiCount: item.uniqueCampiIds.size
    })).sort((a, b) => b.uniqueCampiCount - a.uniqueCampiCount);
  }, [submissions]);

  const globalUniqueCampi = consolidatedData.reduce((acc, curr) => acc + curr.uniqueCampiCount, 0);

  // Chart Data
  const chartData = useMemo(() => {
    return consolidatedData.map(d => ({
      name: d.ictName.split('-')[0],
      count: d.uniqueCampiCount
    }));
  }, [consolidatedData]);

  const toggleIctExpansion = (ictName: string) => {
    setExpandedIcts(prev => 
      prev.includes(ictName) ? prev.filter(i => i !== ictName) : [...prev, ictName]
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Total Respostas</p>
            <p className="text-3xl font-display font-bold text-slate-800">{submissions.length}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl"><i className="fa-solid fa-users"></i></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Campi Aderentes</p>
            <p className="text-3xl font-display font-bold text-slate-800">{globalUniqueCampi}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xl"><i className="fa-solid fa-map-marked-alt"></i></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">ICTs Únicas</p>
            <p className="text-3xl font-display font-bold text-slate-800">{consolidatedData.length}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl"><i className="fa-solid fa-university"></i></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} />
             <XAxis dataKey="name" tick={{fontSize: 12}} />
             <YAxis allowDecimals={false} />
             <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
             <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm uppercase tracking-wide">Detalhamento por ICT</div>
        {consolidatedData.map(data => (
          <div key={data.ictName} className="border-b border-slate-100 last:border-0">
            <div 
              onClick={() => toggleIctExpansion(data.ictName)} 
              className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-brand/10 text-brand flex items-center justify-center text-sm font-bold">
                  {data.ictName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">{data.ictName}</span>
                  <span className="text-xs text-slate-400">{data.respondents.size} responsável(is)</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">{data.uniqueCampiCount} Campi</span>
                <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform duration-300 ${expandedIcts.includes(data.ictName) ? 'rotate-180' : ''}`}></i>
              </div>
            </div>
            {expandedIcts.includes(data.ictName) && (
              <div className="px-6 py-4 bg-slate-50/50 text-sm border-t border-slate-100 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-bold text-slate-400 text-xs uppercase mb-2">Campi Selecionados</p>
                    <ul className="space-y-1">
                      {Array.from(data.uniqueCampiNames).sort().map(c => (
                        <li key={c} className="text-slate-600 flex items-center gap-2">
                          <i className="fa-solid fa-check text-green-500 text-xs"></i> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400 text-xs uppercase mb-2">Contatos</p>
                    <ul className="space-y-1">
                      {Array.from(data.respondents).map(e => (
                        <li key={e} className="text-slate-600 flex items-center gap-2">
                          <i className="fa-regular fa-envelope text-slate-400 text-xs"></i> {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewTab;