import { createClient } from '@supabase/supabase-js'

// Solo para código de servidor (Server Actions). Usa la clave de servicio: nunca llega al navegador.
export function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
