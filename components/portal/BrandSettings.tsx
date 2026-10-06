'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Image from 'next/image';
import { ChangeEvent, useRef, useState, useTransition } from 'react';
import { Building2, Eye, FileText, Globe, Mail, MessageSquare, Palette, Phone, RefreshCcw, Save, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrand } from '@/components/branding/BrandProvider';
import { DEFAULT_BRAND } from '@/types/branding';
import { saveBrandProfileAction } from '@/app/portal/branding/actions';
import { getPublicAssetUrl } from '@/lib/supabase/storage';

const COLOR_PRESETS = [
  {
    name: 'Caribe Navy & Cobalt',
    primary: '#0c094e',
    secondary: '#1e3a8a',
    accent: '#2563eb',
    surface: '#f8fafc',
  },
  {
    name: 'Cap Cana Gold & Navy',
    primary: '#0b132b',
    secondary: '#1c2541',
    accent: '#d4af37',
    surface: '#fdfbf7',
  },
  {
    name: 'Emerald Palms Luxury',
    primary: '#064e3b',
    secondary: '#047857',
    accent: '#10b981',
    surface: '#f0fdf4',
  },
  {
    name: 'Obsidian Minimalist',
    primary: '#09090b',
    secondary: '#27272a',
    accent: '#6366f1',
    surface: '#fafafa',
  },
  {
    name: 'Punta Cana Sunset',
    primary: '#1e1b4b',
    secondary: '#4338ca',
    accent: '#f97316',
    surface: '#fff7ed',
  },
];

type ActiveTab = 'identity' | 'palette' | 'contact' | 'templates';

export default function BrandSettings() {
  const { theme, updateTheme } = useBrand();
  const inputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('identity');
  const [previewMode, setPreviewMode] = useState<'dossier' | 'proposal' | 'card'>('dossier');

  // Form State
  const [name, setName] = useState<string>(theme.name || 'OB Brokers Team');
  const [tagline, setTagline] = useState<string>('Comercialización Inmobiliaria de Alta Precisión');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(
    theme.logo_url || getPublicAssetUrl('ob-brokers-team/brand/ob-brokers-team-horizontal-blue.png')
  );
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);
  const [logoDarkPreview, setLogoDarkPreview] = useState<string>(
    theme.logo_dark_url || getPublicAssetUrl('ob-brokers-team/brand/ob-brokers-team-horizontal-white.png')
  );

  // Palette State
  const [primaryColor, setPrimaryColor] = useState<string>(theme.primary_color || '#0c094e');
  const [secondaryColor, setSecondaryColor] = useState<string>(theme.secondary_color || '#1e3a8a');
  const [accentColor, setAccentColor] = useState<string>(theme.accent_color || '#2563eb');
  const [surfaceColor, setSurfaceColor] = useState<string>(theme.surface_color || '#f8fafc');

  // Contact State
  const [email, setEmail] = useState<string>(theme.contact_email || '');
  const [phone, setPhone] = useState<string>(theme.contact_phone || '');
  const [whatsapp, setWhatsapp] = useState<string>(theme.whatsapp_number || '');
  const [website, setWebsite] = useState<string>(theme.website || '');
  const [address, setAddress] = useState<string>(theme.address || '');

  // Proposals Customization
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    'Estimado inversionista, hemos preparado esta selección inmobiliaria exclusiva adaptada a su perfil.'
  );
  const [legalDisclaimer, setLegalDisclaimer] = useState<string>(
    'La presente propuesta contiene información confidencial y preliminar sobre unidades, precios y esquemas de pago sujetos a confirmación y disponibilidad.'
  );

  const [notice, setNotice] = useState('');
  const [isPending, startTransition] = useTransition();

  function showMessage(value: string) {
    setNotice(value);
    setTimeout(() => setNotice(''), 3000);
  }

  function handleLogo(event: ChangeEvent<HTMLInputElement>, isDark = false) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      showMessage('Usa un archivo PNG, JPG, WebP o SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage('El logo debe pesar menos de 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      if (isDark) {
        setLogoDarkFile(file);
        setLogoDarkPreview(url);
      } else {
        setLogoFile(file);
        setLogoPreview(url);
        updateTheme({ logo_url: url, name });
      }
      showMessage('Logotipo preparado para guardar.');
    };
    reader.readAsDataURL(file);
  }

  function applyPreset(preset: (typeof COLOR_PRESETS)[0]) {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
    setSurfaceColor(preset.surface);
    updateTheme({
      primary_color: preset.primary,
      accent_color: preset.accent,
    });
    showMessage(`Paleta "${preset.name}" aplicada a la vista previa.`);
  }

  function handleSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('primaryColor', primaryColor);
      formData.append('secondaryColor', secondaryColor);
      formData.append('accentColor', accentColor);
      formData.append('surfaceColor', surfaceColor);
      formData.append('contactEmail', email);
      formData.append('contactPhone', phone);
      formData.append('whatsappNumber', whatsapp);
      formData.append('existingLogoUrl', logoPreview);
      formData.append('existingLogoDarkUrl', logoDarkPreview);
      formData.append('website', website);
      formData.append('address', address);
      if (logoFile) {
        formData.append('logoFile', logoFile);
      }
      if (logoDarkFile) {
        formData.append('logoDarkFile', logoDarkFile);
      }

      const res = await saveBrandProfileAction(formData);
      if (res.error) {
        showMessage(`Error: ${res.error}`);
      } else {
        updateTheme({
          name,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
          surface_color: surfaceColor,
          contact_email: email,
          contact_phone: phone,
          whatsapp_number: whatsapp,
          website: website || undefined,
          address: address || undefined,
          logo_url: res.logoUrl || logoPreview,
        });
        showMessage('Configuración de marca guardada con éxito.');
      }
    });
  }

  function resetBrand() {
    updateTheme(DEFAULT_BRAND);
    setName(DEFAULT_BRAND.name);
    setPrimaryColor(DEFAULT_BRAND.primary_color);
    setAccentColor(DEFAULT_BRAND.accent_color);
    setSecondaryColor('#1e3a8a');
    setSurfaceColor('#f8fafc');
    setLogoPreview(DEFAULT_BRAND.logo_url);
    setLogoFile(null);
    showMessage('Valores restaurados por defecto.');
  }

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Palette className="h-4 w-4 text-blue-600" />
            <span><LocalizedText text={"Marca Blanca & Personalización Corporativa"} /></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"><LocalizedText text={"Identidad Comercial y Marca Blanca"} /></h1>
          <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Define la presencia visual, paleta cromática, información de contacto y plantillas que verán tus clientes e inversionistas en propuestas y dossiers."} /></p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetBrand}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition"
          >
            <RefreshCcw className="h-3.5 w-3.5 text-slate-400" />
            <span><LocalizedText text={"Restaurar"} /></span>
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-60 transition active:scale-[0.99]"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isPending ? 'Guardando…' : <LocalizedText text={"Guardar configuración"} />}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls & Right Live Preview */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Deep Configuration Tabs (7 Cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Navigation Tabs */}
          <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1.5 gap-1">
            {[
              { id: 'identity', label: '1. Identidad & Logos', icon: Building2 },
              { id: 'palette', label: '2. Colores & Estilo', icon: Palette },
              { id: 'contact', label: '3. Contacto & Redes', icon: Phone },
              { id: 'templates', label: '4. Textos de Propuesta', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-[11px] font-extrabold transition',
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-950/5'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                <tab.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split('.')[1]}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: IDENTIDAD & LOGOS */}
          {activeTab === 'identity' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Identidad Corporativa y Logotipos"} /></h2>
                <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Configura cómo se presenta tu inmobiliaria en todos los documentos descargables y enlaces públicos."} /></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Nombre comercial de la agencia o equipo *"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      updateTheme({ name: e.target.value });
                    }}
                    placeholder="Ej. OB Brokers Team / Caribe Luxury Properties"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  /></UITranslationBoundary>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Eslogan o Subtítulo Institucional"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Ej. Comercialización Inmobiliaria de Alta Precisión"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  /></UITranslationBoundary>
                </div>

                {/* Primary Logo Upload */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Logotipo Principal (Fondo Claro) *"} /></label>
                  <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-16 w-36 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
                        <UITranslationBoundary attributes={["alt"]}><Image
                          src={logoPreview}
                          alt="Logo Preview"
                          fill
                          unoptimized
                          className="object-contain p-1.5"
                        /></UITranslationBoundary>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900"><LocalizedText text={"Logo activo"} /></p>
                        <p className="text-[11px] text-slate-500"><LocalizedText text={"Recomendado: PNG o SVG transparente (mínimo 400x120px)."} /></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => handleLogo(e, false)}
                      />
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-extrabold text-white hover:bg-blue-700 transition shadow-xs"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span><LocalizedText text={"Subir nuevo logo"} /></span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dark Logo Upload */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Logotipo Secundario (Fondo Oscuro / Invertido)"} /></label>
                  <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-16 w-36 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-xs">
                        <UITranslationBoundary attributes={["alt"]}><Image
                          src={logoDarkPreview}
                          alt="Dark Logo Preview"
                          fill
                          unoptimized
                          className="object-contain p-1.5"
                        /></UITranslationBoundary>
                      </div>
                      <div className="text-slate-300">
                        <p className="text-xs font-bold text-white"><LocalizedText text={"Versión para fondo oscuro"} /></p>
                        <p className="text-[11px] text-slate-400"><LocalizedText text={"Se usará en portadas nocturnas y cabeceras contrastantes."} /></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={darkLogoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => handleLogo(e, true)}
                      />
                      <button
                        type="button"
                        onClick={() => darkLogoInputRef.current?.click()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20 transition"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span><LocalizedText text={"Subir logo blanco"} /></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PALETA CROMATICA */}
          {activeTab === 'palette' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Paleta Cromática Corporativa"} /></h2>
                <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Ajusta los tonos que darán personalidad a tus dossiers, propuestas y componentes interactivos."} /></p>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2"><LocalizedText text={"Paletas Curadas de Alta Gama"} /></label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COLOR_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-left transition hover:border-blue-600 hover:bg-blue-50"
                    >
                      <span className="text-xs font-bold text-slate-800">{preset.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-5 w-5 rounded-full border border-slate-300 shadow-xs"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-slate-300 shadow-xs"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <span className="block text-xs font-bold text-slate-800"><LocalizedText text={"Color Primario (Encabezados y Fondos)"} /></span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        updateTheme({ primary_color: e.target.value });
                      }}
                      className="h-10 w-12 cursor-pointer rounded-xl border border-slate-300 bg-transparent p-1"
                    />
                    <input
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        updateTheme({ primary_color: e.target.value });
                      }}
                      className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <span className="block text-xs font-bold text-slate-800"><LocalizedText text={"Color de Acento (Botones y Destacados)"} /></span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        updateTheme({ accent_color: e.target.value });
                      }}
                      className="h-10 w-12 cursor-pointer rounded-xl border border-slate-300 bg-transparent p-1"
                    />
                    <input
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        updateTheme({ accent_color: e.target.value });
                      }}
                      className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 font-bold uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACTO & REDES */}
          {activeTab === 'contact' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Canales de Contacto Comercial"} /></h2>
                <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Información directa que se mostrará en los botones de llamada y WhatsApp de cada propuesta enviada."} /></p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Correo electrónico de ventas *"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ventas@inmobiliaria.com"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Teléfono directo *"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (809) 000-0000"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"WhatsApp Business Oficial *"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+18090000000"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Sitio web o portal corporativo"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://tuinmobiliaria.com"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Dirección física de oficinas comerciales"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Blue Mall Santo Domingo / Punta Cana Village"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                /></UITranslationBoundary>
              </div>
            </div>
          )}

          {/* TAB 4: TEXTOS DE PROPUESTA */}
          {activeTab === 'templates' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Textos y Plantillas Predeterminadas"} /></h2>
                <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Mensajes automáticos que se incluirán al generar un nuevo enlace interactivo de propuesta para tus clientes."} /></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Mensaje de bienvenida para el inversionista"} /></label>
                  <textarea
                    rows={3}
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Descargo legal de confidencialidad / Términos"} /></label>
                  <textarea
                    rows={3}
                    value={legalDisclaimer}
                    onChange={(e) => setLegalDisclaimer(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Dynamic Preview (5 Cols) */}
        <div className="space-y-4 lg:col-span-5 sticky top-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider"><LocalizedText text={"Vista Previa en Vivo"} /></span>
            </div>

            {/* Preview Mode Switcher */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => setPreviewMode('dossier')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition',
                  previewMode === 'dossier'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              ><LocalizedText text={"Dossier"} /></button>
              <button
                type="button"
                onClick={() => setPreviewMode('proposal')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition',
                  previewMode === 'proposal'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              ><LocalizedText text={"Propuesta /p/"} /></button>
              <button
                type="button"
                onClick={() => setPreviewMode('card')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition',
                  previewMode === 'card'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              ><LocalizedText text={"Tarjeta"} /></button>
            </div>
          </div>

          {/* PREVIEW: DOSSIER PORTADA */}
          {previewMode === 'dossier' && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
              {/* Dossier Top Banner with Brand Primary Color */}
              <div
                className="p-6 text-white transition-colors duration-300"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center justify-between">
                  <div className="relative h-10 w-32">
                    <Image
                      src={logoDarkPreview || logoPreview}
                      alt={name}
                      fill
                      unoptimized
                      className="object-contain object-left brightness-0 invert"
                    />
                  </div>
                  <span className="rounded-md bg-white/15 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md"><LocalizedText text={"Dossier Oficial"} /></span>
                </div>

                <div className="mt-8">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/70"><LocalizedText text={"Propuesta Inmobiliaria Exclusiva"} /></p>
                  <h3 className="mt-1 text-xl font-black text-white"><LocalizedText text={"Mar Azul Residences"} /></h3>
                  <p className="text-xs text-white/80 mt-0.5"><LocalizedText text={"Cap Cana Marina & Resort"} /></p>
                </div>
              </div>

              {/* Dossier Body with Specs & Accent Color */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400"><LocalizedText text={"Unidad"} /></p>
                    <p className="text-xs font-black text-slate-900"><LocalizedText text={"B-302"} /></p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400"><LocalizedText text={"Precio"} /></p>
                    <p className="text-xs font-black text-slate-900"><LocalizedText text={"$185,000 USD"} /></p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400"><LocalizedText text={"Retorno"} /></p>
                    <p className="text-xs font-black" style={{ color: accentColor }}><LocalizedText text={"10.5% ROI"} /></p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed italic"><LocalizedText text={"&ldquo;"} />{welcomeMessage}<LocalizedText text={"&rdquo;"} /></p>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-700">{name}</span>
                  <span>{phone}</span>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW: PROPOSAL MOBILE VIEW */}
          {previewMode === 'proposal' && (
            <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border-4 border-slate-900 bg-slate-950 p-1 shadow-2xl">
              <div className="rounded-2xl bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="relative h-8 w-28">
                    <Image
                      src={logoPreview}
                      alt={name}
                      fill
                      unoptimized
                      className="object-contain object-left"
                    />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase"><LocalizedText text={"Propuesta Interactiva"} /></span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900"><LocalizedText text={"Cana Rock Star Luxury Suite"} /></h4>
                  <p className="text-[11px] text-slate-500"><LocalizedText text={"Hard Rock Golf Club, Punta Cana"} /></p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900"><LocalizedText text={"$189,000 USD"} /></span>
                  <span
                    className="rounded-lg px-2 py-0.5 text-[10px] font-black text-white"
                    style={{ backgroundColor: accentColor }}
                  ><LocalizedText text={"Disponible"} /></span>
                </div>

                <button
                  type="button"
                  className="w-full flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-extrabold text-white shadow-md transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span><LocalizedText text={"Contactar por WhatsApp"} /></span>
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW: BROKER DIGITAL CARD */}
          {previewMode === 'card' && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="relative h-10 w-36">
                  <Image
                    src={logoDarkPreview || logoPreview}
                    alt={name}
                    fill
                    unoptimized
                    className="object-contain object-left brightness-0 invert"
                  />
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white font-black text-xs"
                  style={{ backgroundColor: accentColor }}
                ><LocalizedText text={"OB"} /></div>
              </div>

              <div>
                <p className="text-base font-black text-white">{name}</p>
                <p className="text-xs text-slate-400">{tagline}</p>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-300">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  <span>{website}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Notice Alert */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-blue-600 px-5 py-3.5 text-xs font-extrabold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {notice}
        </div>
      )}
    </div>
  );
}
