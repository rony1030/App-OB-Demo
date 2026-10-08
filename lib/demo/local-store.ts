import 'server-only';

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), '.demo-data');
const DATA_FILE = path.join(DATA_DIR, 'profiles.json');

export type DemoState = {
  contacts: unknown[];
  proposals: unknown[];
  investors: Record<string, { email: string; session: boolean; paymentReports: unknown[] }>;
  investorOtps: Record<string, { code: string; expiresAt: number }>;
  investorSession?: { code: string; email: string } | null;
  contactDetails: Record<string, { notes: Array<{ id: number; body: string; createdAt: string; createdByName: string }>; activities: Array<{ id: number; kind: string; subject: string; details: string | null; dueAt: string | null; completedAt: string | null; createdAt: string }>; stage?: string; opportunities?: Array<{ id: number; publicCode: string; stage: string; priority: string; projectIds: number[]; createdAt: string }> }>;
};

const empty: DemoState = { contacts: [], proposals: [], investors: {}, investorOtps: {}, investorSession: null, contactDetails: {} };
let pending: Promise<unknown> = Promise.resolve();

export async function readDemoState(): Promise<DemoState> {
  try {
    const parsed = JSON.parse(await readFile(DATA_FILE, 'utf8')) as Partial<DemoState>;
    return { ...empty, ...parsed, investors: parsed.investors ?? {}, investorOtps: parsed.investorOtps ?? {}, contactDetails: parsed.contactDetails ?? {} };
  } catch {
    return structuredClone(empty);
  }
}

export async function updateDemoState<T>(update: (state: DemoState) => T | Promise<T>): Promise<T> {
  const operation = pending.then(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const state = await readDemoState();
    const result = await update(state);
    const temporary = `${DATA_FILE}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(state, null, 2), { encoding: 'utf8', mode: 0o600 });
    const { rename } = await import('node:fs/promises');
    await rename(temporary, DATA_FILE);
    return result;
  });
  pending = operation.catch(() => undefined);
  return operation;
}
