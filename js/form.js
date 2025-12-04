/* --- form.js --- */
const { createApp } = Vue;
const supabase = window.supabaseClient;

createApp({
    data() {
        return {
            currentView: 'form', // 'form' ou 'success'
            loading: false, 
            cookiesAccepted: false,

            form: { name: '', email: '', ict: '', selectedCampi: [] },
            
            searchIct: '',
            showIctDropdown: false,
            searchCampus: '',
            showCampusDropdown: false, 
            
            allIcts: [], 
            allCampi: []
        }
    },
    computed: {
        filteredIcts() {
            if (!this.searchIct) return this.allIcts.slice(0, 10);
            const term = this.searchIct.toLowerCase();
            return this.allIcts.filter(ict => ict.toLowerCase().includes(term)).slice(0, 20);
        },
        filteredAvailableCampi() {
            if (!this.form.ict) return []; 
            let term = this.searchCampus.toLowerCase();
            return this.allCampi.filter(c => 
                c.ictName === this.form.ict && 
                c.name.toLowerCase().includes(term) && 
                !this.form.selectedCampi.some(sel => sel.id === c.id)
            ).slice(0, 50);
        }
    },
    methods: {
        // --- UX / Cookies ---
        checkCookies() { if (localStorage.getItem('cookiesAccepted')) this.cookiesAccepted = true; },
        acceptCookies() { localStorage.setItem('cookiesAccepted', 'true'); this.cookiesAccepted = true; },
        delayHideIct() { setTimeout(() => { this.showIctDropdown = false; }, 200); },
        delayHideCampus() { setTimeout(() => { this.showCampusDropdown = false; }, 200); },

        // --- Configuração Inicial ---
        async fetchGlobalConfig() {
            try {
                const { data } = await supabase.from('app_config').select('*').eq('id', 1).single();
                if (data) {
                    if (data.icts?.length) this.allIcts = data.icts;
                    if (data.campi?.length) this.allCampi = data.campi;
                } else { this.loadDefaultData(); }
            } catch (e) { this.loadDefaultData(); }
        },
        loadDefaultData() {
            this.allIcts = ['IFSP - Instituto Federal de São Paulo'];
            this.allCampi = [{ id: 1, name: 'Campus São Paulo', ictName: 'IFSP - Instituto Federal de São Paulo' }];
        },

        // --- Lógica do Formulário ---
        selectIct(ictName) { this.form.ict = ictName; this.searchIct = ''; this.showIctDropdown = false; this.form.selectedCampi = []; },
        resetIctSelection() { this.form.ict = ''; this.form.selectedCampi = []; this.searchCampus = ''; },
        addCampus(campus) { this.form.selectedCampi.push({ ...campus, addedAt: new Date().toISOString() }); this.searchCampus = ''; },
        tryAddFirstMatch() { if (this.filteredAvailableCampi.length > 0) this.addCampus(this.filteredAvailableCampi[0]); },
        removeCampus(index) { this.form.selectedCampi.splice(index, 1); },
        
        async submitForm() {
            if (!this.form.ict || this.form.selectedCampi.length === 0) { alert("Preencha todos os campos e selecione ao menos um campus."); return; }
            this.loading = true;
            try {
                const { error } = await supabase.from('responses').insert({ 
                    name: this.form.name, 
                    email: this.form.email, 
                    ict: this.form.ict, 
                    campi: this.form.selectedCampi,
                    status: 'pending' // Default status
                });
                if (error) throw error;
                this.currentView = 'success'; 
                this.form = { name: '', email: '', ict: '', selectedCampi: [] }; // Reset
            } catch (error) { alert("Erro ao enviar: " + error.message); } finally { this.loading = false; }
        },
        resetFormState() { this.currentView = 'form'; this.resetIctSelection(); }
    },
    mounted() {
        this.checkCookies();
        this.fetchGlobalConfig();
    }
}).mount('#app'); // Certifique-se que o ID no index.html é #app
