
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Campus, Submission, CalendarDay, DateCategory, CampusEvent, CalendarDataWrapper } from '../../types';
import { api } from '../../services/api';

interface CalendarTabProps {
  submissions: Submission[];
  allCampi: Campus[];
}

// Opções de cores
const COLOR_OPTIONS = [
  { label: 'Azul', value: 'bg-blue-100 text-blue-700 border-blue-200' },
  { label: 'Laranja', value: 'bg-orange-100 text-orange-700 border-orange-200' },
  { label: 'Vermelho', value: 'bg-red-100 text-red-700 border-red-200' },
  { label: 'Verde', value: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { label: 'Roxo', value: 'bg-purple-100 text-purple-700 border-purple-200' },
  { label: 'Rosa', value: 'bg-pink-100 text-pink-700 border-pink-200' },
  { label: 'Amarelo', value: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { label: 'Cinza', value: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const DEFAULT_CATEGORIES: DateCategory[] = [
  { id: 'cat_recess', name: 'Recesso', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'cat_vacation', name: 'Férias', color: 'bg-blue-100 text-blue-700 border-blue-200' }
];

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper Components for the Wizard Input
const SearchInput = ({ 
    label, 
    value, 
    onChange, 
    onSelect, 
    options, 
    disabled = false, 
    placeholder = "Selecione..." 
}: any) => {
    const [show, setShow] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShow(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={wrapperRef}>
            <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setShow(true); }}
                    onFocus={() => setShow(true)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all text-sm font-semibold text-slate-700"
                    placeholder={placeholder}
                    disabled={disabled}
                />
                <i className={`fa-solid fa-chevron-down absolute right-4 top-4 text-slate-400 text-xs transition-transform ${show ? 'rotate-180' : ''}`}></i>
            </div>
            {show && options.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto animate-fade-in-up">
                    {options.map((opt: any, idx: number) => (
                        <div 
                            key={idx} 
                            onClick={() => { onSelect(opt); setShow(false); }}
                            className={`px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm ${opt.special ? 'font-bold text-brand bg-brand/5' : 'text-slate-600'}`}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CalendarTab: React.FC<CalendarTabProps> = ({ submissions, allCampi }) => {
  // Dados Principais
  const [categories, setCategories] = useState<DateCategory[]>(DEFAULT_CATEGORIES);
  const [events, setEvents] = useState<Record<string, CampusEvent[]>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado de Visualização do Calendário
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  // Estados do Formulário Wizard
  const [inputIct, setInputIct] = useState('');
  const [selectedIct, setSelectedIct] = useState<string | 'ALL' | null>(null);

  const [inputCampus, setInputCampus] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string | 'ALL' | null>(null);

  const [inputCategory, setInputCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DateCategory | 'NEW' | null>(null);
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_OPTIONS[0].value);

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Modais
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ title: string, stats: any } | null>(null);

  // --- Processamento de Dados (Flattening) ---
  const uniqueCampiFlatList = useMemo(() => {
    const list: Array<{ id: string | number, ict: string, name: string, fullLabel: string }> = [];
    
    // Mapa para encontrar IDs canônicos
    const allCampiMap = new Map();
    allCampi.forEach(c => allCampiMap.set(`${c.ictName}::${c.name}`, c.id));

    const ictGroups: Record<string, Set<string>> = {};
    submissions.forEach(sub => {
       if(!sub.ict || !sub.campi) return;
       if(!ictGroups[sub.ict]) ictGroups[sub.ict] = new Set();
       sub.campi.forEach(c => ictGroups[sub.ict].add(c.name));
    });

    Object.entries(ictGroups).forEach(([ict, campiNames]) => {
      campiNames.forEach(cName => {
        const originalId = allCampiMap.get(`${ict}::${cName}`);
        const id = originalId || `${ict}-${cName}`;
        list.push({ id, ict, name: cName, fullLabel: `${ict} - ${cName}` });
      });
    });

    return list.sort((a, b) => a.ict.localeCompare(b.ict));
  }, [submissions, allCampi]);

  const uniqueIcts = useMemo(() => {
    return Array.from(new Set(uniqueCampiFlatList.map(c => c.ict))).sort();
  }, [uniqueCampiFlatList]);

  // --- Carregamento Inicial ---
  useEffect(() => {
    const loadDates = async () => {
      setLoadingData(true);
      try {
        const response = await api.fetchCalendarConfig();
        if (response.data && response.data.data) {
          const rawData = response.data.data as any;
          if (rawData.version === 2) {
            setCategories(rawData.categories || DEFAULT_CATEGORIES);
            setEvents(rawData.events || {});
          } else {
            // Migração Legado
            const migratedEvents: Record<string, CampusEvent[]> = {};
            Object.entries(rawData).forEach(([campusId, dates]: [string, any]) => {
               if (typeof dates !== 'object') return;
               const campusEvents: CampusEvent[] = [];
               if (dates.recessStart && dates.recessEnd) {
                 campusEvents.push({ id: generateId(), categoryId: 'cat_recess', startDate: dates.recessStart, endDate: dates.recessEnd });
               }
               if (dates.vacStart && dates.vacEnd) {
                 campusEvents.push({ id: generateId(), categoryId: 'cat_vacation', startDate: dates.vacStart, endDate: dates.vacEnd });
               }
               if (campusEvents.length > 0) migratedEvents[campusId] = campusEvents;
            });
            setEvents(migratedEvents);
            setCategories(DEFAULT_CATEGORIES);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    };
    loadDates();
  }, []);

  // --- Lógica do Wizard ---

  // Opções para Dropdown ICT
  const ictOptions = useMemo(() => {
      const term = inputIct.toLowerCase();
      const base = uniqueIcts.filter(i => i.toLowerCase().includes(term)).map(i => ({ label: i, value: i, special: false }));
      if ("todas as instituições".includes(term)) {
          base.unshift({ label: 'Todas as Instituições', value: 'ALL', special: true });
      }
      return base;
  }, [inputIct, uniqueIcts]);

  // Opções para Dropdown Campus
  const campusOptions = useMemo(() => {
      if (!selectedIct || selectedIct === 'ALL') return [];
      const term = inputCampus.toLowerCase();
      const campi = uniqueCampiFlatList.filter(c => c.ict === selectedIct && c.name.toLowerCase().includes(term));
      const opts = campi.map(c => ({ label: c.name, value: c.id, special: false }));
      
      if ("todas as unidades".includes(term)) {
          opts.unshift({ label: 'Todas as Unidades', value: 'ALL', special: true });
      }
      return opts;
  }, [inputCampus, selectedIct, uniqueCampiFlatList]);

  // Opções para Categoria
  const categoryOptions = useMemo(() => {
      const term = inputCategory.toLowerCase();
      const existing: { label: string; value: DateCategory | string; special: boolean }[] = categories
        .filter(c => c.name.toLowerCase().includes(term))
        .map(c => ({ label: c.name, value: c, special: false }));
      
      // Se não existe match exato, oferece criar
      const exactMatch = categories.some(c => c.name.toLowerCase() === term);
      if (term && !exactMatch) {
          existing.push({ label: `Criar categoria: "${inputCategory}"`, value: 'NEW', special: true });
      }
      return existing;
  }, [inputCategory, categories]);

  // Handlers do Wizard
  const handleSelectIct = (opt: any) => {
      setSelectedIct(opt.value);
      setInputIct(opt.label);
      
      // Reset campus
      setSelectedCampus(null);
      setInputCampus('');
      if (opt.value === 'ALL') {
          setInputCampus('Todas as Unidades');
          setSelectedCampus('ALL');
      }
  };

  const handleSelectCampus = (opt: any) => {
      setSelectedCampus(opt.value);
      setInputCampus(opt.label);
  };

  const handleSelectCategory = (opt: any) => {
      if (opt.value === 'NEW') {
          setSelectedCategory('NEW');
          // Mantém o texto digitado
      } else {
          setSelectedCategory(opt.value);
          setInputCategory(opt.value.name);
      }
  };

  const handleAddWizardEvent = () => {
      if (!selectedIct || !selectedCampus || !inputCategory || !dateStart || !dateEnd) {
          alert("Preencha todos os campos para adicionar.");
          return;
      }
      if (dateEnd < dateStart) {
          alert("Data final deve ser posterior à inicial.");
          return;
      }

      // 1. Resolver Categoria
      let catId = '';
      let currentCats = [...categories];
      
      if (selectedCategory === 'NEW' || !categories.find(c => c.id === (selectedCategory as any)?.id)) {
          // Criar nova
          const newCat: DateCategory = {
              id: generateId(),
              name: inputCategory,
              color: newCategoryColor
          };
          currentCats.push(newCat);
          setCategories(currentCats);
          catId = newCat.id;
      } else {
          catId = (selectedCategory as DateCategory).id;
      }

      // 2. Identificar Campi Alvo
      const targetIds: (string | number)[] = [];

      if (selectedIct === 'ALL') {
          // Todos os campi de todas as ICTs
          uniqueCampiFlatList.forEach(c => targetIds.push(c.id));
      } else if (selectedCampus === 'ALL') {
          // Todos os campi da ICT selecionada
          uniqueCampiFlatList.filter(c => c.ict === selectedIct).forEach(c => targetIds.push(c.id));
      } else {
          // Campus único
          targetIds.push(selectedCampus);
      }

      // 3. Adicionar Eventos
      const newEventsMap = { ...events };
      let addedCount = 0;

      targetIds.forEach(id => {
          if (!newEventsMap[id]) newEventsMap[id] = [];
          
          newEventsMap[id].push({
              id: generateId(),
              categoryId: catId,
              startDate: dateStart,
              endDate: dateEnd
          });
          addedCount++;
      });

      setEvents(newEventsMap);
      
      // Feedback e Limpeza Parcial
      alert(`${addedCount} evento(s) adicionado(s) com sucesso!\nNão esqueça de clicar em "Salvar Alterações" para persistir.`);
      // Resetar datas para facilitar próxima inserção
      setDateStart('');
      setDateEnd('');
  };

  const removeEvent = (campusId: string | number, eventId: string) => {
    setEvents(prev => ({
      ...prev,
      [campusId]: prev[campusId].filter(e => e.id !== eventId)
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: CalendarDataWrapper = { version: 2, categories, events };
      const { error } = await api.updateCalendarConfig(payload as any);
      if (error) throw error;
      
      const btn = document.getElementById('btn-save-cal');
      if (btn) {
          const original = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
          setTimeout(() => btn.innerHTML = original, 2000);
      }
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  // --- Lógica do Calendário Visual (Dinâmica por Ano) ---
  const calendarMonths = useMemo(() => {
    const months = [];
    
    // Gera de Jan a Dez do ano selecionado
    for (let month = 0; month < 12; month++) {
        const year = viewYear;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayWeekday = new Date(year, month, 1).getDay(); 
        
        const daysObj: CalendarDay[] = [];
        
        // Espaços vazios antes do dia 1
        for(let i=0; i<firstDayWeekday; i++) {
            daysObj.push({ day: '', date: '', empty: true, stats: { ratio: 0, events: [], heatClass: '' } });
        }
        
        // Dias do mês
        for(let d=1; d<=daysInMonth; d++) {
            const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEventsAgg: Record<string, { category: DateCategory, count: number, campusNames: string[] }> = {};
            
            uniqueCampiFlatList.forEach(campus => {
                const cEvents = events[campus.id] || [];
                const activeEvent = cEvents.find(e => dateStr >= e.startDate && dateStr <= e.endDate);
                if (activeEvent) {
                    const cat = categories.find(c => c.id === activeEvent.categoryId);
                    if (cat) {
                        if (!dayEventsAgg[cat.id]) dayEventsAgg[cat.id] = { category: cat, count: 0, campusNames: [] };
                        dayEventsAgg[cat.id].count++;
                        dayEventsAgg[cat.id].campusNames.push(campus.fullLabel);
                    }
                }
            });
            
            const totalActive = Object.values(dayEventsAgg).reduce((acc, curr) => acc + curr.count, 0);
            const ratio = uniqueCampiFlatList.length > 0 ? totalActive / uniqueCampiFlatList.length : 0;
            
            let heatClass = '';
            if (ratio > 0) {
                const sorted = Object.values(dayEventsAgg).sort((a,b) => b.count - a.count);
                if (sorted.length > 0) heatClass = sorted[0].category.color;
            }
            
            daysObj.push({ 
                day: d, 
                date: dateStr, 
                empty: false, 
                stats: { ratio, events: Object.values(dayEventsAgg), heatClass } 
            });
        }
        
        months.push({ 
            name: new Date(year, month).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }), 
            days: daysObj 
        });
    }
    return months;
  }, [uniqueCampiFlatList, categories, events, viewYear]);

  if (loadingData) return <div className="p-10 text-center text-slate-500"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Carregando...</div>;

  return (
    <div className="space-y-8">
       
       {/* 1. PAINEL WIZARD DE ADIÇÃO */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <i className="fa-regular fa-calendar-plus text-brand"></i> Gerenciador de Eventos
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Adicione períodos de recesso, férias ou eventos para uma ou múltiplas unidades.</p>
                </div>
                <button 
                    id="btn-save-cal"
                    onClick={save} 
                    disabled={saving}
                    className="bg-brand hover:bg-brandLight text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand/20 disabled:opacity-70 flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                >
                    {saving ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</> : <><i className="fa-solid fa-cloud-arrow-up"></i> Salvar Alterações</>}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                {/* Passo 1: ICT */}
                <SearchInput 
                    label="1. Instituição (ICT)"
                    value={inputIct}
                    onChange={setInputIct}
                    onSelect={handleSelectIct}
                    options={ictOptions}
                    placeholder="Busque ou selecione..."
                />

                {/* Passo 2: Campus */}
                <SearchInput 
                    label="2. Campus / Unidade"
                    value={inputCampus}
                    onChange={setInputCampus}
                    onSelect={handleSelectCampus}
                    options={campusOptions}
                    disabled={!selectedIct}
                    placeholder={selectedIct === 'ALL' ? 'Todos selecionados' : "Selecione a unidade..."}
                />

                {/* Passo 3: Evento/Categoria */}
                <div className="relative">
                    <SearchInput 
                        label="3. Tipo de Evento"
                        value={inputCategory}
                        onChange={setInputCategory}
                        onSelect={handleSelectCategory}
                        options={categoryOptions}
                        placeholder="Ex: Férias, Greve..."
                    />
                    {/* Se for nova categoria, mostra seletor de cor */}
                    {(selectedCategory === 'NEW' || (selectedCategory && !(selectedCategory as any).id)) && (
                        <div className="absolute top-0 right-0 flex gap-1">
                            {COLOR_OPTIONS.slice(0, 5).map(c => (
                                <button 
                                    key={c.value}
                                    onClick={() => setNewCategoryColor(c.value)}
                                    className={`w-3 h-3 rounded-full border ${c.value.replace('text-', 'border-').split(' ')[0]} ${newCategoryColor === c.value ? 'ring-2 ring-slate-400' : ''}`}
                                ></button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Passo 4: Datas e Ação */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Início</label>
                        <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-brand" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Fim</label>
                        <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-brand" />
                    </div>
                </div>
            </div>
            
            <div className="mt-4 flex justify-end">
                <button 
                    onClick={handleAddWizardEvent}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus-circle"></i> Adicionar ao Cronograma
                </button>
            </div>
       </div>

       {/* 2. LISTAGEM DE EVENTOS (Simplificada) */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer" onClick={() => { /* Toggle collapse se quiser */ }}>
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Eventos Cadastrados</h3>
              <span className="text-xs text-slate-400">{Object.keys(events).length > 0 ? 'Verifique e gerencie os eventos abaixo' : 'Nenhum evento registrado'}</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
             <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-slate-100">
                      {uniqueCampiFlatList.map((campus) => {
                         const campusEvents = events[campus.id] || [];
                         if (campusEvents.length === 0) return null; // Só mostra quem tem evento para limpar a view

                         return (
                            <tr key={campus.id} className="bg-white hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 w-1/3 align-top border-r border-slate-50">
                                  <div className="font-bold text-[10px] text-slate-400 uppercase">{campus.ict}</div>
                                  <div className="font-semibold text-slate-700">{campus.name}</div>
                              </td>
                              <td className="px-6 py-3">
                                  <div className="flex flex-wrap gap-2">
                                      {campusEvents.map(ev => {
                                          const cat = categories.find(c => c.id === ev.categoryId);
                                          if (!cat) return null;
                                          return (
                                              <div key={ev.id} className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs border ${cat.color}`}>
                                                  <span className="font-bold">{cat.name}</span>
                                                  <span className="opacity-60 text-[10px]">
                                                    {new Date(ev.startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - {new Date(ev.endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                                  </span>
                                                  <button onClick={() => removeEvent(campus.id, ev.id)} className="hover:text-red-600 ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/50 transition-colors"><i className="fa-solid fa-times"></i></button>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </td>
                            </tr>
                         );
                      })}
                  </tbody>
              </table>
          </div>
       </div>

       {/* 3. CALENDÁRIO VISUAL */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Mapa de Calor (Visualização Geral)</h3>
                
                {/* Year Selector */}
                <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                    <button 
                        onClick={() => setViewYear(y => y - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500 hover:text-brand transition cursor-pointer"
                    >
                        <i className="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <span className="font-display font-bold text-slate-700 w-16 text-center">{viewYear}</span>
                    <button 
                        onClick={() => setViewYear(y => y + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-500 hover:text-brand transition cursor-pointer"
                    >
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {calendarMonths.map(month => (
                    <div key={month.name} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-2 font-bold text-center text-slate-700 text-sm capitalize">{month.name}</div>
                        <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 py-1 bg-white"><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
                        <div className="grid grid-cols-7 text-center text-xs bg-white">
                            {month.days.map((day, idx) => (
                                <div 
                                    key={idx} 
                                    className={`aspect-square flex items-center justify-center border-t border-l border-slate-50 cursor-pointer ${day.empty ? 'bg-slate-50/30' : ''} ${day.stats.heatClass}`}
                                    onClick={() => { if(!day.empty && day.stats.events.length > 0) { setSelectedDay({ title: day.date, stats: day.stats }); setShowDayModal(true); } }}
                                >
                                    {!day.empty && day.day}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
       </div>

       {/* Modal Detalhes do Dia */}
       {showDayModal && selectedDay && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowDayModal(false)}>
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Eventos em {new Date(selectedDay.title).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</h3>
                        <button onClick={() => setShowDayModal(false)}><i className="fa-solid fa-times"></i></button>
                    </div>
                    <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                        {selectedDay.stats.events.map((ev: any, i: number) => (
                            <div key={i} className={`p-3 rounded-lg border ${ev.category.color}`}>
                                <div className="font-bold text-sm mb-1">{ev.category.name} ({ev.count} Campi)</div>
                                <div className="text-xs opacity-80 flex flex-wrap gap-1">{ev.campusNames.slice(0, 10).map((n: string) => <span key={n} className="bg-white/50 px-1 rounded">{n}</span>)} {ev.campusNames.length > 10 && <span>...</span>}</div>
                            </div>
                        ))}
                    </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default CalendarTab;
