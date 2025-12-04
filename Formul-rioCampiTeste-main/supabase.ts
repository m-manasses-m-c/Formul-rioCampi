import { createClient } from '@supabase/supabase-js';

// Using the keys provided in the source code context
const SUPABASE_URL = 'https://vfnnznnjvlewrbfczczw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbm56bm5qdmxld3JiZmN6Y3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEyNDIsImV4cCI6MjA4MDE4NzI0Mn0.wwsfhzjauqM7V0VB93-TKH8-mVN11mBukhSFUlSHgtU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);