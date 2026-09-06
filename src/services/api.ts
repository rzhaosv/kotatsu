import { Platform } from 'react-native';
import { CrewId, Message } from '../logic/types';
import { demo } from '../dev/demo';

export const API_URL = 'https://tryforma.app/api/kotatsu';

export type ApiRequest = {
  device: string;
  mode: 'group' | 'dm';
  speaker?: CrewId;
  messages: { role: 'user' | 'crew'; id?: CrewId; text: string }[];
  memory: string;
  user: { name: string; pronouns?: string };
  daysAway: number;
  hour: number;
  pro: boolean;
  rcId: string;
  crew: CrewId[];
};

export type ApiReply = { id: CrewId; text: string };

export type ApiResponse = {
  replies: ApiReply[];
  memory: string;
  risk: boolean;
  remaining: number;
  limit: number;
  pro: boolean;
  degraded?: boolean;
};

export class LimitError extends Error {
  limit: number;
  constructor(limit: number) {
    super('limit');
    this.limit = limit;
  }
}

export function toWire(messages: Message[]): ApiRequest['messages'] {
  return messages.slice(-20).map((m) => (m.role === 'user' ? { role: 'user', text: m.text } : { role: 'crew', id: m.who, text: m.text }));
}

/** Calls the Kotatsu backend. Throws LimitError on 429, a plain Error on other failures. Never called in web demo mode. */
export async function chat(req: ApiRequest): Promise<ApiResponse> {
  if (demo) throw new Error('offline');
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 45_000) : null;
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-platform': Platform.OS },
      body: JSON.stringify(req),
      signal: ctrl?.signal,
    });
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      throw new LimitError(Number(body.limit) || 20);
    }
    if (!res.ok) throw new Error(`http ${res.status}`);
    const data = (await res.json()) as ApiResponse;
    if (!Array.isArray(data.replies)) throw new Error('bad response');
    return data;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
