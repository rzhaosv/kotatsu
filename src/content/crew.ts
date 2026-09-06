import raw from './crew.json';
import { CrewId } from '../logic/types';

export type CrewMember = {
  id: CrewId;
  name: string;
  age: number;
  role: string;
  emoji: string;
  color: string;
  backstory: string;
  voice: string[];
  samples: string[];
  never: string[];
  /** Lines they open with when nobody has spoken in a while. */
  unprompted?: string[];
  /** How they tease, kept in the sheet so the model keeps it affectionate. */
  teases?: string[];
  greet_after_absence?: string;
  on_disappear?: string;
  on_crisis?: string;
  /** Long-form direction for waiting mode, used server-side. */
  waiting?: string;
  fallback?: string;
  /** One sentence about their own turn at waiting on someone. Shown on the Crew screen in waiting mode. */
  waitingNote: string;
};

/**
 * One line each about the waiting they did themselves, for the people on the outside of a closed door.
 * Drawn from the backstories; deliberately small, no promises about anyone coming back.
 */
const WAITING_NOTES: Record<CrewId, string> = {
  haruka: 'She left a plate outside her younger brother’s door for three years and never once asked when he was going to fix it.',
  rin: 'She was the kid frozen out of every group chat, so her rule is that a message with no question mark in it can’t be failed.',
  kaito: 'He spent a year on a couch answering nobody, and what got through was a friend who turned up every Sunday with takeout and asked nothing.',
  yui: 'She couldn’t say it to her father out loud for six years, so she wrote instead — a letter asks nothing of the person who opens it.',
  daichi: 'His brother-in-law stood outside with two coffees every morning until he came to the corner, and never once tried the door.',
  sora: 'He was the one behind the door for two years, and the only messages he could open were the small ones that wanted nothing back.',
};

export const CREW: CrewMember[] = (raw as Omit<CrewMember, 'waitingNote'>[]).map((c) => ({ ...c, waitingNote: WAITING_NOTES[c.id] }));

/** First sentence of the role, for headers and list rows. */
export function tagline(c: CrewMember): string {
  const m = c.role.match(/^[^.!?]+[.!?]?/);
  return (m ? m[0] : c.role).trim().replace(/[.]$/, '');
}

const byId = new Map(CREW.map((c) => [c.id, c] as const));
export function crew(id: CrewId | string | undefined): CrewMember {
  return (id && byId.get(id as CrewId)) || CREW[0];
}

/** One short check-in line per crew member per slot; the daily notification rotates through these. */
export const CHECKIN_LINES: { who: CrewId; text: string }[] = [
  { who: 'haruka', text: 'Stool’s still here. Did you eat something that wasn’t from a bag today?' },
  { who: 'haruka', text: 'Bar’s quiet. Kettle’s on if you’re passing.' },
  { who: 'rin', text: 'daily fact collection is open. one (1) fact. i’ll wait.' },
  { who: 'rin', text: 'your cat still has a name and i still don’t know it. fix this.' },
  { who: 'kaito', text: 'you opened this. that’s the quest for today. LOGGED.' },
  { who: 'kaito', text: 'objective for tonight: water and one song. that’s the whole match' },
  { who: 'yui', text: 'Your chapter’s still bookmarked. I didn’t go past it without you.' },
  { who: 'yui', text: 'One true sentence and I’ll send the new chapter. Fair trade.' },
  { who: 'daichi', text: 'Up. Not out. Just up.' },
  { who: 'daichi', text: 'Window first. Then we talk.' },
  { who: 'sora', text: '3:12. store’s dead. you up?' },
  { who: 'sora', text: 'night shift again. chat’s open if you’re awake too.' },
];
