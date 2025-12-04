
import { supabase } from '../supabase';
import { IctConfig, Submission, Campus, FormConfig } from '../types';

export const api = {
  async fetchGlobalConfig(): Promise<{ icts: string[], campi: Campus[] }> {
    try {
      const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).single();
      if (error || !data) {
        // Fallback default data
        return {
          icts: ['IFSP - Instituto Federal de São Paulo'],
          campi: [{ id: 1, name: 'Campus São Paulo', ictName: 'IFSP - Instituto Federal de São Paulo' }]
        };
      }
      return { icts: data.icts, campi: data.campi };
    } catch (e) {
      console.error(e);
      return { icts: [], campi: [] };
    }
  },

  async updateGlobalConfig(icts: string[], campi: Campus[]) {
    return await supabase.from('app_config').upsert({ id: 1, icts, campi, updated_at: new Date() });
  },

  async submitResponse(name: string, email: string, phone: string, ict: string, campi: Campus[], formConfigId?: string) {
    return await supabase.from('responses').insert({ 
      name, 
      email, 
      phone,
      ict, 
      campi,
      form_config_id: formConfigId 
    });
  },

  async sendConfirmationEmail(data: { name: string, email: string, ict: string, campi: any[] }) {
    // Invokes a Supabase Edge Function named 'send-confirmation'
    // This requires the function to be deployed on your Supabase project
    return await supabase.functions.invoke('send-confirmation', {
      body: data
    });
  },

  async checkAdminAccess(password: string) {
    return await supabase.rpc('check_admin_access', { attempt: password });
  },

  async fetchSubmissions(formConfigId?: string | null) {
    let query = supabase.from('responses').select('*').order('created_at', { ascending: false });
    
    if (formConfigId) {
        query = query.eq('form_config_id', formConfigId);
    }

    return await query;
  },

  // --- Status & Notes Management ---
  async updateSubmissionStatus(id: number, status: string, notes?: string) {
    const updateData: any = { status };
    if (notes !== undefined) updateData.admin_notes = notes;
    
    return await supabase.from('responses').update(updateData).eq('id', id);
  },

  async fetchCalendarConfig() {
    return await supabase.from('calendar_config').select('data').eq('id', 1).single();
  },

  async updateCalendarConfig(data: Record<string, any>) {
    return await supabase.from('calendar_config').upsert({ id: 1, data, updated_at: new Date() });
  },

  // --- Form Config Management ---

  async fetchFormConfigs() {
    return await supabase.from('form_configs').select('*').order('created_at', { ascending: false });
  },

  async getActiveFormConfig(id?: string) {
    if (id) {
        const { data } = await supabase.from('form_configs').select('*').eq('id', id).single();
        return data;
    }
    // Get the most recent active one if no ID provided
    const { data } = await supabase.from('form_configs').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
    return data;
  },

  async createFormConfig(title: string, edictName: string) {
    return await supabase.from('form_configs').insert({
        title,
        edict_name: edictName,
        is_active: true
    }).select().single();
  },

  async toggleFormStatus(id: string, isActive: boolean) {
      return await supabase.from('form_configs').update({ is_active: isActive }).eq('id', id);
  },

  async deleteFormConfig(id: string) {
      // We use .select() to ensure we get data back if successful, 
      // helping verify the delete operation really happened despite 204 status
      return await supabase.from('form_configs').delete().eq('id', id).select();
  },

  // --- Migration / Initialization ---

  async initializeSystemWithLegacyData() {
      // 1. Create the specific default form requested
      const { data: newForm, error: createError } = await supabase.from('form_configs').insert({
          title: 'Registro de ICTs',
          edict_name: 'Trilha de Pré-Incubação Brasil Inovador 2025-2026',
          is_active: true
      }).select().single();

      if (createError) throw createError;
      if (!newForm) throw new Error("Falha ao criar formulário base.");

      // 2. Update legacy responses (those without form_config_id)
      const { error: updateError } = await supabase
          .from('responses')
          .update({ form_config_id: newForm.id })
          .is('form_config_id', null);
      
      if (updateError) throw updateError;

      return newForm;
  }
};
