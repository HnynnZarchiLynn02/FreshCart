
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbivraswvxzlvfmvnyhq.supabase.co';
const supabaseAnonKey = 'sb_publishable_GRJmp9G8H_ychbP7LwPRmA_zxDabn4c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
