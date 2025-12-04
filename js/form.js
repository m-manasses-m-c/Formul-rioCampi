const { createApp } = Vue;
const supabase = window.supabaseClient; // Pega do config.js

createApp({
    data() {
        return {
            form: { ... },
            loading: false,
            // ... (Apenas variáveis do formulário)
        }
    },
    methods: {
        async submitForm() { ... },
        // Nada de login, nada de charts
    }
}).mount('#app');
