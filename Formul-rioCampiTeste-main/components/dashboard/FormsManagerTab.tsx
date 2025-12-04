
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FormConfig } from '../../types';

const FormsManagerTab: React.FC = () => {
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [initializing, setInitializing] = useState(false);
  
  // Create New Form State
  const [newTitle, setNewTitle] = useState('');
  const [newEdict, setNewEdict] = useState('');

  const loadForms = async () => {
    setLoading(true);
    setDbError(false);
    try {
        const { data, error } = await api.fetchFormConfigs();
        if (error) {
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                setDbError(true);
            } else {
                console.error("Erro carregando formulários:", error);
            }
        }
        if (data) setForms(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleCreate = async () => {
    if (!newTitle || !newEdict) {
      alert("Preencha o Título e o Nome do Edital.");
      return;
    }

    const { error } = await api.createFormConfig(newTitle, newEdict);
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
          setDbError(true);
      } else {
          alert("Erro ao criar: " + error.message);
      }
    } else {
      setNewTitle('');
      setNewEdict('');
      loadForms();
    }
  };

  const handleInitializeSystem = async () => {
      setInitializing(true);
      try {
          await api.initializeSystemWithLegacyData();
          alert("Sistema inicializado com sucesso! Dados antigos foram migrados para o formulário da Trilha Brasil Inovador.");
          loadForms();
      } catch (e: any) {
          alert("Erro na migração: " + e.message);
      } finally {
          setInitializing(false);
      }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await api.toggleFormStatus(id, !currentStatus);
    loadForms();
  };

  const handleDelete = async (id: string) => {
      // Mensagem mais clara sobre a consequência
      if (window.confirm("ATENÇÃO: Tem certeza que deseja excluir este formulário?\n\nIsso apagará o formulário E TODAS AS RESPOSTAS vinculadas a ele.\n\nEsta ação é irreversível.")) {
          const { error, count } = await api.deleteFormConfig(id);
          
          if (error) {
              // Se ainda der erro de FK, avisa para rodar o SQL novo
              if (error.message.includes('foreign key constraint')) {
                  setDbError(true); // Mostra o script SQL
                  alert("Erro de permissão ou configuração de banco. Veja o script SQL abaixo para corrigir.");
              } else {
                  alert("Erro ao excluir: " + error.message);
              }
          } else {
              if (count === 0) {
                 alert("O formulário não pôde ser excluído. Provavelmente falta permissão (RLS Policy). Execute o script SQL abaixo.");
                 setDbError(true);
              } else {
                 loadForms();
              }
          }
      }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard.writeText(url);
    alert("Link copiado: " + url);
  };

  // SQL Script para o usuário (ATUALIZADO PARA CORRIGIR DELETE)
  const sqlScript = `-- 1. Resetar Políticas de Segurança (Permite Deletar e Editar)
drop policy if exists "Enable All Access" on public.form_configs;
drop policy if exists "Public Read Access" on public.form_configs;
drop policy if exists "Admin Full Access" on public.form_configs;

alter table public.form_configs enable row level security;

create policy "Enable All Access" on public.form_configs
for all
using (true)
with check (true);

-- 2. Permitir exclusão em cascata (Evita erro ao apagar formulário com respostas)
-- Isso apaga as respostas automaticamente quando o formulário é excluído
alter table public.responses
drop constraint if exists responses_form_config_id_fkey;

alter table public.responses
add constraint responses_form_config_id_fkey
foreign key (form_config_id)
references public.form_configs(id)
on delete cascade;

-- 3. (Caso ainda não tenha criado a tabela)
create table if not exists public.form_configs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  edict_name text not null,
  is_active boolean default true
);`;

  return (
    <div className="space-y-6">
      {/* Initialization Banner */}
      {!loading && forms.length === 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                  <h3 className="text-xl font-bold mb-1">Bem-vindo ao Novo Gerenciador</h3>
                  <p className="text-indigo-100 text-sm">Empacote os dados atuais no formulário da Trilha Brasil Inovador e configure o sistema.</p>
              </div>
              <button 
                onClick={handleInitializeSystem}
                disabled={initializing}
                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-80"
              >
                  {initializing ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                  Inicializar Sistema Agora
              </button>
          </div>
      )}

       {/* Área de Erro / Configuração DB (Visível se houver erro ou solicitado) */}
       {dbError && (
          <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200 mb-6 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4 text-amber-800">
                  <i className="fa-solid fa-database text-2xl"></i>
                  <h3 className="text-xl font-bold">Atualização de Banco de Dados Necessária</h3>
              </div>
              <p className="text-amber-700 mb-4 text-sm">
                  Para corrigir erros de criação ou exclusão, execute o código abaixo no <strong>SQL Editor</strong> do Supabase.
                  Isso ajustará as permissões e permitirá apagar formulários junto com suas respostas.
              </p>
              <div className="relative">
                <pre className="bg-slate-800 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs font-mono border border-slate-700 shadow-inner">{sqlScript}</pre>
                <button 
                    onClick={() => { navigator.clipboard.writeText(sqlScript); alert("Código copiado!"); }}
                    className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-bold transition cursor-pointer"
                >
                    Copiar SQL
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                  <button onClick={() => { setDbError(false); loadForms(); }} className="text-amber-700 hover:text-amber-900 text-sm font-bold cursor-pointer">
                      Ocultar Ajuda
                  </button>
              </div>
          </div>
      )}

      {/* Create New Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                <i className="fa-solid fa-file-circle-plus"></i>
            </div>
            <div>
                <h3 className="font-bold text-slate-800">Criar Novo Formulário</h3>
                <p className="text-xs text-slate-500">Gere um novo link de adesão para um edital específico.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Título do Formulário</label>
                <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Registro de ICTs"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Edital/Programa</label>
                <input 
                    type="text" 
                    value={newEdict}
                    onChange={(e) => setNewEdict(e.target.value)}
                    placeholder="Ex: Trilha Brasil Inovador 2025"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all text-sm"
                />
            </div>
        </div>
        <button 
            onClick={handleCreate}
            className="mt-4 bg-brand hover:bg-brandLight text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand/20 cursor-pointer flex items-center gap-2"
        >
            <i className="fa-solid fa-plus"></i> Criar Formulário
        </button>
      </div>

      {/* List Forms */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm uppercase tracking-wide">
            Formulários Gerados
        </div>
        <div className="divide-y divide-slate-100">
            {forms.length === 0 && !loading && (
                <div className="p-8 text-center text-slate-400 text-sm">
                    Nenhum formulário criado ainda. Use o botão de inicialização acima para migrar os dados antigos.
                </div>
            )}
            
            {forms.map(form => (
                <div key={form.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-800">{form.title}</h4>
                            {form.is_active ? (
                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Ativo</span>
                            ) : (
                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Inativo</span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Programa: <span className="font-medium text-slate-700">{form.edict_name}</span></p>
                        <p className="text-xs text-slate-400 font-mono">ID: {form.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => copyLink(form.id)}
                            className="bg-white border border-slate-200 hover:border-brand hover:text-brand text-slate-500 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                            title="Copiar Link"
                        >
                            <i className="fa-regular fa-copy"></i> <span className="hidden sm:inline">Copiar Link</span>
                        </button>
                        <button 
                            onClick={() => handleToggleStatus(form.id, form.is_active)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm text-white ${form.is_active ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
                            title={form.is_active ? "Desativar" : "Ativar"}
                        >
                            {form.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button 
                            onClick={() => handleDelete(form.id)}
                            className="bg-white border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-700 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                            title="Excluir Formulário"
                        >
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default FormsManagerTab;
