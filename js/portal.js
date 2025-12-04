/* --- portal.js --- */
const { createApp } = Vue;
const supabase = window.supabaseClient;

createApp({
    data() {
        return {
            currentView: 'login', // 'login' ou 'dashboard'
            loading: false,
            accessKey: '',
            loginError: false,
            
            currentUser: null, // Dados da ICT
            userSchedules: {}, // Dados locais das datas
            
            saving: false
        }
    },
    methods: {
        // --- Formatação para View ---
        formatDateBR(val) { return window.formatDateBR(val); },

        // --- Login ---
        async loginWithKey() {
            if (!this.accessKey) return;
            this.loading = true;
            this.loginError = false;

            try {
                // Busca ICT pela chave (Case Insensitive)
                const { data, error } = await supabase
                    .from('responses')
                    .select('*')
                    .ilike('access_key', this.accessKey.trim())
                    .single();

                if (error || !data) throw new Error("Chave inválida");

                this.currentUser = data;
                await this.fetchUserSchedules();
                this.currentView = 'dashboard';

            } catch (e) {
                console.error(e);
                this.loginError = true;
            } finally {
                this.loading = false;
            }
        },

        logout() {
            this.currentUser = null;
            this.accessKey = '';
            this.currentView = 'login';
        },

        // --- Gestão de Datas ---
        async fetchUserSchedules() {
            if (!this.currentUser) return;

            // 1. Inicializa estrutura baseada nos campi cadastrados
            this.userSchedules = {};
            if (Array.isArray(this.currentUser.campi)) {
                this.currentUser.campi.forEach(c => {
                    this.userSchedules[c.id] = { recessStart: '', recessEnd: '', vacStart: '', vacEnd: '' };
                });
            }

            // 2. Busca dados já salvos
            const { data } = await supabase
                .from('campus_schedules')
                .select('*')
                .eq('response_id', this.currentUser.id);

            // 3. Popula estrutura local
            if (data) {
                data.forEach(item => {
                    if (this.userSchedules[item.campus_id]) {
                        this.userSchedules[item.campus_id] = {
                            recessStart: item.recess_start,
                            recessEnd: item.recess_end,
                            vacStart: item.vac_start,
                            vacEnd: item.vac_end
                        };
                    }
                });
            }
        },

        async saveSchedules() {
            this.saving = true;
            try {
                const upserts = [];
                // Prepara payload
                Object.keys(this.userSchedules).forEach(campusId => {
                    const sched = this.userSchedules[campusId];
                    // Só salva se houver alguma data
                    if (sched.recessStart || sched.recessEnd || sched.vacStart || sched.vacEnd) {
                        upserts.push({
                            response_id: this.currentUser.id,
                            campus_id: campusId,
                            recess_start: sched.recessStart || null,
                            recess_end: sched.recessEnd || null,
                            vac_start: sched.vacStart || null,
                            vac_end: sched.vacEnd || null,
                            updated_at: new Date(),
                            last_editor: 'PARTNER'
                        });
                    }
                });

                if (upserts.length === 0) {
                    alert("Preencha ao menos uma data antes de salvar.");
                    return;
                }

                const { error } = await supabase
                    .from('campus_schedules')
                    .upsert(upserts, { onConflict: 'response_id, campus_id' });

                if (error) throw error;
                
                // Feedback visual simples
                const btn = document.activeElement;
                const oldText = btn ? btn.innerHTML : '';
                if(btn) btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
                setTimeout(() => { if(btn) btn.innerHTML = oldText; }, 2000);

            } catch (e) {
                alert("Erro ao salvar: " + e.message);
            } finally {
                this.saving = false;
            }
        },

        // --- Auxiliares de UX ---
        replicateDate(field) {
            if (!this.currentUser.campi.length) return;
            const firstId = this.currentUser.campi[0].id;
            const val = this.userSchedules[firstId][field];
            
            this.currentUser.campi.forEach(c => {
                this.userSchedules[c.id][field] = val;
            });
        }
    }
}).mount('#portalApp'); // Certifique-se que o ID no portal.html é #portalApp
