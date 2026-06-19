// ===============================
// Ranex Media - Supabase Config
// ===============================

const SUPABASE_URL = "https://incllqupwigchudjuhve.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ndOmM1C9VihkZlQlnljneg_ETZkm9pB";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);