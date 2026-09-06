/**
 * Web-only demo seeding for App Store screenshots.
 *
 * With `?demo=<name>` in the URL on web, a canned AppState is written to localStorage under the
 * AsyncStorage key *before* AppContext hydrates, and `demo.screen` / `demo.tab` tell App.tsx what
 * to open. `demo.pro` unlocks Pro for every demo except `paywall` (`&pro=0` keeps it free).
 * In demo mode the app never calls the network: sends get a canned in-character reply.
 *
 * Guarded by `Platform.OS === 'web'`; on iOS/Android `demo` is always `null`.
 */
import { Platform } from 'react-native';
import { AppState, DEFAULT_STATE, Message, CrewId, ALL_CREW } from '../logic/types';
import { RootStackParamList, TabParamList } from '../navigation';

const STORAGE_KEY = 'kotatsu.state.v1';

export type DemoName = 'chat' | 'rooms' | 'crew' | 'keepsakes' | 'paywall' | 'onboard';
const VALID: DemoName[] = ['chat', 'rooms', 'crew', 'keepsakes', 'paywall', 'onboard'];

export type Demo = {
  name: DemoName;
  screen: keyof RootStackParamList | null;
  tab: keyof TabParamList;
  pro: boolean;
  snap: boolean;
};

const iso = (ms: number) => new Date(ms).toISOString();
const MIN = 60_000;

let seq = 0;
function msg(role: 'user' | 'crew', text: string, at: number, who?: CrewId): Message {
  return { id: `d${at}-${seq++}`, role, who, text, at: iso(at) };
}

/** A believable evening around the table, seeded from the crew voices in crew.json. Free tier seats only haruka, rin and sora. */
function groupThread(now: number, pro: boolean): Message[] {
  const t = (m: number) => now - m * MIN;
  return [
    msg('crew', 'Nine days. Your stool’s still here. Did you eat?', t(41), 'haruka'),
    msg('crew', '9 days gone and zero lore. one (1) fact. minimum.', t(40), 'rin'),
    msg('user', 'fact: i replied to the email. the scary one', t(36)),
    ...(pro ? [msg('crew', 'WAIT. the scary email?? that’s boss music. that’s the whole quest for today', t(35), 'kaito')] : []),
    msg('crew', 'on shift till 6. store’s dead. read that on my break. it counts.', t(34), 'sora'),
    msg('crew', 'also, 4am. your sleep schedule is a cryptid. respect, not endorsement.', t(33), 'rin'),
    msg('crew', 'Eat first. Then the email. In that order.', t(2), 'haruka'),
  ];
}

function dmThread(now: number): Message[] {
  const t = (m: number) => now - m * MIN;
  return [
    msg('crew', '3:12. store’s dead. you up?', t(200), 'sora'),
    msg('user', 'up. brain won’t shut off', t(198)),
    msg('crew', 'same guy came in for the same energy drink. small comfort. anyway. i’m here till 6', t(197), 'sora'),
    msg('crew', 'chat’s open. no pressure to fill it', t(196), 'sora'),
  ];
}

const MEMORY =
  'Sam has a cat whose name they still haven’t told Rin. Works late shifts, was away nine days in August. Likes rain and old JRPGs. Replied to the scary work email this week. Drinks tea, not coffee.';

function buildState(name: DemoName, now: number, pro: boolean): AppState | null {
  if (name === 'onboard') return null;
  const t = (d: number) => now - d * 24 * 60 * MIN;
  const table: CrewId[] = pro ? ALL_CREW : ['haruka', 'rin', 'sora'];
  return {
    ...DEFAULT_STATE,
    onboarded: true,
    device: 'demo-device',
    name: 'Sam',
    pronouns: 'they/them',
    since: 'days',
    greeted: true,
    table,
    freeDm: 'sora',
    group: { messages: groupThread(now, pro) },
    dms: { sora: { messages: dmThread(now) } },
    memory: MEMORY,
    keepsakes: [
      { id: 'k1', who: 'haruka', text: 'Nine days. Your stool’s still here. Did you eat?', at: iso(t(0)) },
      { id: 'k2', who: 'yui', text: 'I left your chapter bookmarked. The one where the healer finally lets someone carry the bag.', at: iso(t(2)) },
      { id: 'k3', who: 'sora', text: 'you come out sideways not forward. it still counts', at: iso(t(6)) },
      { id: 'k4', who: 'daichi', text: 'Up. Not out. Just up. Then we talk.', at: iso(t(9)) },
    ],
    lastActiveAt: iso(now),
    remaining: 14,
    limit: 20,
    checkins: { enabled: pro, hour: 21 },
  };
}

function read(): Demo | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined' || !window.location || !window.localStorage) return null;
  const params = new URLSearchParams(window.location.search);
  const name = params.get('demo') as DemoName | null;
  if (!name || !VALID.includes(name)) return null;
  const pro = name !== 'paywall' && params.get('pro') !== '0';
  const state = buildState(name, Date.now(), pro);
  try {
    if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const tab: keyof TabParamList =
    name === 'rooms' ? 'Rooms' : name === 'crew' ? 'Crew' : name === 'keepsakes' ? 'Keepsakes' : 'Kotatsu';
  return {
    name,
    screen: name === 'paywall' ? 'Paywall' : name === 'onboard' ? null : 'Tabs',
    tab,
    pro,
    snap: params.get('snap') === '1',
  };
}

/** Null everywhere except web with `?demo=`. Evaluated once at module load, before hydration. */
export const demo: Demo | null = read();

/** True when animations and timers should be frozen for a screenshot. */
export const snap = !!demo?.snap;
