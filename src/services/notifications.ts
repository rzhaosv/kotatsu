/**
 * Daily local check-in (Pro). One notification a day at the chosen hour, with a line from a
 * different crew member each day. Everything is scheduled on-device; nothing is sent anywhere.
 */
import { Platform } from 'react-native';
import { CHECKIN_LINES, crew } from '../content/crew';

const DAYS_AHEAD = 12;

type Notif = typeof import('expo-notifications');
let mod: Notif | null = null;
function lib(): Notif | null {
  if (Platform.OS === 'web') return null;
  if (!mod) {
    try {
      mod = require('expo-notifications') as Notif;
      mod.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
      });
    } catch {
      mod = null;
    }
  }
  return mod;
}

export async function requestPermission(): Promise<boolean> {
  const N = lib();
  if (!N) return false;
  const cur = await N.getPermissionsAsync();
  if (cur.granted) return true;
  const res = await N.requestPermissionsAsync();
  return !!res.granted;
}

export async function cancelCheckins(): Promise<void> {
  const N = lib();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync().catch(() => {});
}

/**
 * Schedules the next DAYS_AHEAD days as individual date triggers so each day gets a different line.
 * Re-run on every app open while check-ins are on; it cancels and rebuilds the queue.
 */
export async function scheduleCheckins(hour: number, name: string): Promise<boolean> {
  const N = lib();
  if (!N) return false;
  const ok = await requestPermission();
  if (!ok) return false;
  await cancelCheckins();
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('checkins', { name: 'Check-ins', importance: N.AndroidImportance.DEFAULT }).catch(() => {});
  }
  const now = new Date();
  const offset = Math.floor(now.getTime() / 86_400_000) % CHECKIN_LINES.length;
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const when = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, hour, 0, 0, 0);
    if (when.getTime() <= now.getTime() + 60_000) continue;
    const line = CHECKIN_LINES[(offset + d) % CHECKIN_LINES.length];
    const c = crew(line.who);
    await N.scheduleNotificationAsync({
      content: { title: `${c.emoji} ${c.name}`, body: line.text, sound: false, data: { who: line.who } },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: when },
    }).catch(() => {});
  }
  return true;
}

export function formatHour(h: number): string {
  const ampm = h >= 12 ? 'pm' : 'am';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:00 ${ampm}`;
}
