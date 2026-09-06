export type CrewId = 'haruka' | 'rin' | 'kaito' | 'yui' | 'daichi' | 'sora';

export type Pronouns = 'she/her' | 'he/him' | 'they/them' | '';

/** How long the user says it has been, asked once during onboarding. Sets daysAway for the first greeting only. */
export type Since = 'days' | 'months' | 'years' | 'skip';
export const SINCE_DAYS: Record<Since, number> = { days: 3, months: 60, years: 400, skip: 0 };
export const SINCE_LABELS: [Since, string][] = [
  ['days', 'a few days'],
  ['months', 'months'],
  ['years', 'years'],
  ['skip', "I'd rather not say"],
];

export type Message = {
  id: string;
  role: 'user' | 'crew';
  /** Crew member id for crew messages. */
  who?: CrewId;
  text: string;
  at: string;
  /** Set on the last crew reply of a turn that tripped the risk detector; renders the resource card. */
  risk?: boolean;
};

export type Keepsake = { id: string; who: CrewId; text: string; at: string };

export type Thread = { messages: Message[] };

export type AppState = {
  onboarded: boolean;
  device: string;
  name: string;
  pronouns: Pronouns;
  since: Since;
  /** Whether the first-ever greeting has been requested (uses SINCE_DAYS). */
  greeted: boolean;
  /** Crew ids currently "at the table". Free tier: max 3. */
  table: CrewId[];
  /** The one DM the free tier can open. */
  freeDm: CrewId;
  group: Thread;
  dms: Partial<Record<CrewId, Thread>>;
  memory: string;
  keepsakes: Keepsake[];
  lastActiveAt: string | null;
  /** Free-tier counters from the last server response, for the "N left today" pill. */
  remaining: number | null;
  limit: number | null;
  checkins: { enabled: boolean; hour: number };
};

export const FREE_TABLE = 3;
export const FREE_LIMIT = 20;
export const ALL_CREW: CrewId[] = ['haruka', 'rin', 'kaito', 'yui', 'daichi', 'sora'];

export const DEFAULT_STATE: AppState = {
  onboarded: false,
  device: '',
  name: '',
  pronouns: '',
  since: 'skip',
  greeted: false,
  table: [],
  freeDm: 'haruka',
  group: { messages: [] },
  dms: {},
  memory: '',
  keepsakes: [],
  lastActiveAt: null,
  remaining: null,
  limit: null,
  checkins: { enabled: false, hour: 21 },
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** RFC4122-ish v4 uuid without a crypto dependency (good enough for a device handle). */
export function uuid(): string {
  const h = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
    else if (i === 14) s += '4';
    else if (i === 19) s += h[(Math.random() * 4) | 8];
    else s += h[(Math.random() * 16) | 0];
  }
  return s;
}
