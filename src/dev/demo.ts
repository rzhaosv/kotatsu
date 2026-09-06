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

export type DemoName = 'chat' | 'rooms' | 'crew' | 'keepsakes' | 'paywall' | 'onboard' | 'waiting' | 'onboard-waiting';
const VALID: DemoName[] = ['chat', 'rooms', 'crew', 'keepsakes', 'paywall', 'onboard', 'waiting', 'onboard-waiting'];

export type Demo = {
  name: DemoName;
  screen: keyof RootStackParamList | null;
  tab: keyof TabParamList;
  pro: boolean;
  snap: boolean;
  /** Onboarding step to open on, for the onboarding demos. */
  onboardStep?: number;
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

/** Waiting mode: a sister on the outside of her brother's door, and the crew answering from their own. */
function waitingThread(now: number): Message[] {
  const t = (m: number) => now - m * MIN;
  return [
    msg('crew', 'So you’re on the outside of a shut door. I did three years of that. Sit down — I’m not going to hand you a plan.', t(44), 'haruka'),
    msg('user', 'he hasn’t come out of his room in two years. i’ve run out of things to say to him', t(41)),
    msg('crew', 'Then stop saying. I left a plate outside my brother’s door most nights. Rice, whatever was on the stove. Knock once, “it’s here, no reply needed”, walk away. Cold food is cheap. It went on for three years.', t(40), 'haruka'),
    msg('crew', 'from the other side: opening a message costs something in there. two years for me, nineteen to twenty-one. the door being shut was never about the person knocking.', t(38), 'sora'),
    msg('crew', 'the ones i could open were small. “saw this, thought of you.” nothing to answer. the long ones sat unread for months and made the whole thing heavier.', t(37), 'sora'),
    msg('user', 'my mum wants to take the door off the hinges', t(21)),
    msg('crew', 'No. Nobody touched my door. My brother-in-law stood outside with two coffees every morning and said he’d be back tomorrow, and then he was back tomorrow. You can be at the corner. You can’t walk him to it.', t(20), 'daichi'),
    msg('crew', 'It might be a year. You’re allowed to eat and sleep while it’s a year.', t(19), 'daichi'),
    msg('crew', 'One thing tonight, then bed. A photo of something stupid, no question mark, nothing for him to answer. That’s the whole errand.', t(3), 'haruka'),
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

const WAITING_MEMORY =
  'Mika is waiting on her younger brother, who has been in his room about two years. She leaves food; their mother wants to force the door. Mika works early shifts and has stopped seeing her own friends. Haruka told her about the plate. Sora told her which messages get opened.';

function buildState(name: DemoName, now: number, pro: boolean): AppState | null {
  if (name === 'onboard' || name === 'onboard-waiting') return null;
  const t = (d: number) => now - d * 24 * 60 * MIN;
  const table: CrewId[] = pro ? ALL_CREW : ['haruka', 'rin', 'sora'];
  const waiting = name === 'waiting';
  return {
    ...DEFAULT_STATE,
    onboarded: true,
    device: 'demo-device',
    name: waiting ? 'Mika' : 'Sam',
    pronouns: waiting ? 'she/her' : 'they/them',
    since: 'days',
    greeted: true,
    waiting,
    waitingFor: waiting ? 'my brother' : '',
    table,
    freeDm: 'sora',
    threads: { group: { messages: groupThread(now, pro) }, waiting: { messages: waiting ? waitingThread(now) : [] } },
    dms: { sora: { messages: dmThread(now) } },
    memory: waiting ? WAITING_MEMORY : MEMORY,
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
  const onboarding = name === 'onboard' || name === 'onboard-waiting';
  return {
    name,
    screen: name === 'paywall' ? 'Paywall' : onboarding ? null : 'Tabs',
    tab,
    pro,
    snap: params.get('snap') === '1',
    onboardStep: name === 'onboard-waiting' ? 1 : undefined,
  };
}

/** Null everywhere except web with `?demo=`. Evaluated once at module load, before hydration. */
export const demo: Demo | null = read();

/** True when animations and timers should be frozen for a screenshot. */
export const snap = !!demo?.snap;
