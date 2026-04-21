import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  // Intentamos obtener las variables con y sin el prefijo VITE_ para mayor compatibilidad
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
    console.error("Supabase: Credenciales no detectadas o son valores por defecto.");
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
};

// For backward compatibility while we refactor or for simple checks
export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  const isDefaultUrl = url.includes('your-project-id') || !url;
  const isDefaultKey = key.includes('your-anon-key') || key.length < 10;

  return !isDefaultUrl && !isDefaultKey;
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'Faltan credenciales en Secrets' };
  
  try {
    // Intenta leer perfiles con los nombres exactos de la captura
    const { error } = await supabase.from('perfiles').select('id, nombre_completo').limit(1);
    if (error) {
       console.error("Prueba de conexión fallida:", error);
       return { success: false, message: `Supabase: ${error.message}` };
    }
    return { success: true, message: 'Conexión activa y verificada' };
  } catch (err) {
    return { success: false, message: 'Error de red. Revisa el Project URL.' };
  }
};
