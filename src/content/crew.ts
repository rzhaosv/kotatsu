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
  greet_after_absence?: string;
  on_disappear?: string;
  on_crisis?: string;
  fallback?: string;
};

export const CREW: CrewMember[] = raw as CrewMember[];

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
