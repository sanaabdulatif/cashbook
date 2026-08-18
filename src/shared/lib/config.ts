export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://demo-placeholder.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key',
  demoPassword: import.meta.env.VITE_DEMO_PASSWORD || 'DemoPassword123!',
};
