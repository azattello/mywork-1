// supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jhmvsytczeitrcxounlo.supabase.co'; // замени на свой URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobXZzeXRjemVpdHJjeG91bmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODMwNDIsImV4cCI6MjA1ODc1OTA0Mn0.cWDbZZnKSmSSTYJGvPRPRmnKFRvJBHY45UPkxAluZnQ'; // замени на свой anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
