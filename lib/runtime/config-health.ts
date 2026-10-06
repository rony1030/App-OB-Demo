import 'server-only';

export type RuntimeCheck = {
  label: string;
  configured: boolean;
  detail: string;
  requiredFor: string;
};

function present(name: string) {
  return Boolean(process.env[name]?.trim());
}

/** Never returns a secret or its length. Safe to render in the admin UI. */
export function getRuntimeConfigurationHealth(): RuntimeCheck[] {
  return [
    { label: 'Supabase público', configured: present('NEXT_PUBLIC_SUPABASE_URL') && (present('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || present('NEXT_PUBLIC_SUPABASE_ANON_KEY')), detail: 'URL y clave publicable para autenticación, datos y almacenamiento.', requiredFor: 'Portal y páginas públicas' },
    { label: 'Supabase de servidor', configured: present('SUPABASE_SERVICE_ROLE_KEY'), detail: 'Clave privada para traducciones públicas y tareas internas.', requiredFor: 'Traducción pública y auditoría' },
    { label: 'Correo SMTP', configured: present('SMTP_HOST') && present('SMTP_USER') && present('SMTP_PASS') && present('SMTP_FROM'), detail: 'Servidor, usuario, contraseña y remitente configurados.', requiredFor: 'Avisos operativos por correo' },
    { label: 'Gemini y memoria', configured: present('GEMINI_POOL') || present('GEMINI_API_KEY'), detail: 'La IA solo se consulta si falta una traducción vigente; el pool es respaldo.', requiredFor: 'Nuevas traducciones y control de calidad' },
    { label: 'Clave estable de Next.js', configured: present('NEXT_SERVER_ACTIONS_ENCRYPTION_KEY'), detail: 'Debe conservarse idéntica entre despliegues.', requiredFor: 'Acciones seguras en Hostinger' },
    { label: 'Auditoría programada', configured: present('CRON_SECRET'), detail: 'Protege la revisión semanal de traducciones automáticas.', requiredFor: 'Auditoría por cron' },
  ];
}
