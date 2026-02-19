import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oeyozovwmnoiabfxoaqr.supabase.co';
const supabaseKey = 'sb_publishable_WHm2gBND648lDfKJxgFnkQ_6y8JH4NS';

export const supabase = createClient(supabaseUrl, supabaseKey);
