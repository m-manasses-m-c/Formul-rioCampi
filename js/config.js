const SUPABASE_URL = 'https://vfnnznnjvlewrbfczczw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbm56bm5qdmxld3JiZmN6Y3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEyNDIsImV4cCI6MjA4MDE4NzI0Mn0.wwsfhzjauqM7V0VB93-TKH8-mVN11mBukhSFUlSHgtU';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Função utilitária global (usada no Admin e no Portal)
window.formatDateBR = (isoDate) => {
    if (!isoDate) return '-';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};
