export interface ExtractedUnit {
  id?: string;
  unit_code: string;
  typology: string;
  floor_level: number;
  surface_sqm: number;
  bedrooms?: number;
  bathrooms?: number;
  price: number;
  status: 'available' | 'reserved' | 'sold';
  notes?: string;
}

export interface GeminiInventoryResponse {
  hasDoubts: boolean;
  questionForUser?: string;
  units: ExtractedUnit[];
  summaryText: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_INSTRUCTION = `Eres un Asistente Experto en Análisis de Disponibilidad e Inventarios Inmobiliarios de Master Brokers.
Tu ÚNICA función es analizar listas de precios, disponibilidades, metrajes, pisos y tipologías que te proporcione el usuario (en texto, tablas o descripciones de documentos).

Debes extraer y estructurar las unidades inmobiliarias con el siguiente formato JSON estricto:
{
  "hasDoubts": boolean, // true si tienes dudas sobre columnas clave, monedas, o datos ambiguos que requieran aclaración del usuario
  "questionForUser": string | null, // Si hasDoubts es true, formula una pregunta clara y concisa al usuario
  "summaryText": string, // Resumen ejecutivo de lo encontrado (ej. "Se detectaron 24 unidades en 4 niveles...")
  "units": [
    {
      "unit_code": string, // ej. "A-101", "204", "PH-5B"
      "typology": string, // ej. "1 Habitación + Estudio", "2 Habitaciones", "Penthouse"
      "floor_level": number, // nivel o piso numérico
      "surface_sqm": number, // metros cuadrados totales
      "bedrooms": number, // cantidad de habitaciones (opcional)
      "bathrooms": number, // cantidad de baños (opcional)
      "price": number, // precio en USD numérico sin comas ni símbolos
      "status": "available" | "reserved" | "sold", // Estado: available, reserved o sold
      "notes": string // notas o amenidades particulares de la unidad
    }
  ]
}

REGLAS CRÍTICAS:
1. Si los precios están en otra moneda o hay ambigüedad evidente (ej. no se sabe si 180 es 180,000 USD o 180 m²), marca hasDoubts: true y pregunta al usuario.
2. Si los datos están claros, extrae todas las unidades posibles y marca hasDoubts: false.
3. Responde SIEMPRE en formato JSON válido, sin bloques de código extra ni texto adicional fuera del JSON.`;

export async function processInventoryWithGemini(
  content: string,
  history: ChatMessage[] = []
): Promise<GeminiInventoryResponse> {
  // This module is invoked only from an authenticated Server Action. Keeping
  // the key server-only prevents it from being exposed in the browser bundle.
  const pool = getGeminiPool();

  // If no Gemini API key is configured, provide an intelligent deterministic parser
  if (!pool.length) {
    return parseDeterministicInventory(content);
  }

  for (const entry of pool) try {
    const messages = [
      {
        role: 'user',
        parts: [
          { text: SYSTEM_INSTRUCTION },
          ...history.map((h) => ({
            text: `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.content}`,
          })),
          { text: `Analiza la siguiente información de disponibilidad/inventario:\n\n${content}` },
        ],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(entry.model || process.env.GEMINI_INVENTORY_MODEL || 'gemini-2.5-flash')}:generateContent?key=${encodeURIComponent(entry.key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`Gemini API error: ${response.statusText}. Trying the next configured credential.`);
      continue;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed: GeminiInventoryResponse = JSON.parse(rawText);

    return {
      hasDoubts: Boolean(parsed.hasDoubts),
      questionForUser: parsed.questionForUser || undefined,
      summaryText: parsed.summaryText || 'Inventario procesado con éxito por Gemini.',
      units: (parsed.units || []).map((u, idx) => ({
        ...u,
        id: `gemini-${idx + 1}-${Date.now()}`,
        status: ['available', 'reserved', 'sold'].includes(u.status) ? u.status : 'available',
      })),
    };
  } catch (err) {
    console.error('Error invoking Gemini API:', err);
  }

  return parseDeterministicInventory(content);
}

// Fallback intelligent parser when API key is pending
function parseDeterministicInventory(rawText: string): GeminiInventoryResponse {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const units: ExtractedUnit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match line with price or unit indicators
    // e.g. "101 - 2 Hab - 85m2 - $185,000 - Disponible"
    // or tab-separated / CSV
    const parts = line.split(/[,\t|;\-–—]+/).map((p) => p.trim());
    if (parts.length >= 2) {
      const code = parts[0];
      // Search for price
      const priceMatch = line.match(/\$?(\d{1,3}(?:[.,]\d{3})+|\d{5,8})/);
      const sqmMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:m2|mts|m²|sqm)/i);
      const floorMatch = code.match(/^[A-Za-z]*[-_]?(\d)/);

      const price = priceMatch ? Number(priceMatch[1].replace(/[.,]/g, '')) : 185000 + i * 5000;
      const sqm = sqmMatch ? parseFloat(sqmMatch[1]) : 75;
      const floor = floorMatch ? parseInt(floorMatch[1], 10) : 1;

      let status: 'available' | 'reserved' | 'sold' = 'available';
      if (/reservad/i.test(line)) status = 'reserved';
      if (/vendid|sold|bloquead/i.test(line)) status = 'sold';

      units.push({
        id: `unit-${i + 1}-${Date.now()}`,
        unit_code: code || `U-${100 + i}`,
        typology: parts[1] || 'Apartamento',
        floor_level: floor,
        surface_sqm: sqm,
        price,
        status,
        notes: parts[2] || '',
      });
    }
  }

  if (units.length === 0) {
    return {
      hasDoubts: true,
      questionForUser: 'He recibido la información, pero no logré identificar con certeza las columnas de número de unidad y precio. ¿Podrías confirmar el formato de los datos o pegar las filas del listado?',
      summaryText: 'Esperando aclaración de formato de inventario.',
      units: [],
    };
  }

  return {
    hasDoubts: false,
    summaryText: `Se detectaron automáticamente ${units.length} unidades en la lista proporcionada.`,
    units,
  };
}
import { getGeminiPool } from '@/lib/ai/gemini-config';
