import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DEFAULT_STATE, CrewId, Message, Keepsake, Thread, FREE_TABLE, SINCE_DAYS, ALL_CREW, uid, uuid } from '../logic/types';
import { chat, toWire, LimitError } from '../services/api';
import { configureBilling, getCustomerInfo, isPremium, addPremiumListener, getAppUserID } from '../services/billing';
import { scheduleCheckins, cancelCheckins } from '../services/notifications';
import { CREW, crew } from '../content/crew';
import { demo, snap } from '../dev/demo';

export const STORAGE_KEY = 'kotatsu.state.v1';
const DEV_UNLOCK = process.env.EXPO_PUBLIC_DEV_UNLOCK === '1' || process.env.EXPO_PUBLIC_DEV_UNLOCK === 'true';
const DAY = 86_400_000;

export type ThreadKey = 'group' | `dm:${CrewId}`;
export type SendResult = 'ok' | 'limit' | 'error';

type Ctx = {
  ready: boolean;
  state: AppState;
  isPro: boolean;
  setPro: (v: boolean) => void;
  /** Crew ids the current tier actually seats (free: first three of the table). */
  table: CrewId[];
  update: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  completeOnboarding: (setup: { name: string; pronouns: AppState['pronouns']; since: AppState['since']; table: CrewId[] }) => void;
  /** Adds or removes a member from the table. Returns false when the free limit blocks it. */
  toggleTable: (id: CrewId) => boolean;
  canDm: (id: CrewId) => boolean;
  thread: (key: ThreadKey) => Thread;
  typing: Partial<Record<ThreadKey, CrewId | null>>;
  busy: Partial<Record<ThreadKey, boolean>>;
  notice: Partial<Record<ThreadKey, string | null>>;
  /** Sends a user message (or, with null, asks the crew to speak first). */
  send: (key: ThreadKey, text: string | null) => Promise<SendResult>;
  saveLine: (m: Message) => void;
  removeKeepsake: (id: string) => void;
  setMemory: (memory: string) => void;
  setCheckins: (enabled: boolean, hour?: number) => Promise<boolean>;
  resetAll: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, snap ? 0 : ms));
const threadOf = (s: AppState, key: ThreadKey): Thread => (key === 'group' ? s.group : s.dms[key.slice(3) as CrewId] ?? { messages: [] });

function withThread(s: AppState, key: ThreadKey, fn: (t: Thread) => Thread): AppState {
  if (key === 'group') return { ...s, group: fn(s.group) };
  const id = key.slice(3) as CrewId;
  return { ...s, dms: { ...s.dms, [id]: fn(s.dms[id] ?? { messages: [] }) } };
}

/** Offline canned reply for the web demo so the chat stays interactive without the backend. */
function demoReply(key: ThreadKey, table: CrewId[]): { id: CrewId; text: string }[] {
  const who = key === 'group' ? table[Math.floor(Math.random() * table.length)] ?? 'haruka' : (key.slice(3) as CrewId);
  const c = crew(who);
  return [{ id: c.id, text: c.samples[Math.floor(Math.random() * c.samples.length)] }];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isPro, setIsPro] = useState(DEV_UNLOCK || !!demo?.pro);
  const [typing, setTyping] = useState<Ctx['typing']>({});
  const [busy, setBusy] = useState<Ctx['busy']>({});
  const [notice, setNotice] = useState<Ctx['notice']>({});
  const stateRef = useRef(state);
  stateRef.current = state;
  const proRef = useRef(isPro);
  proRef.current = isPro;
  const busyRef = useRef<Ctx['busy']>({});
  /** Days away to send with the next request; 0 after it has been consumed once per session. */
  const daysAwayRef = useRef<number | null>(null);
  const rcIdRef = useRef('');

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      let s: AppState = { ...DEFAULT_STATE };
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          s = { ...DEFAULT_STATE, ...parsed, checkins: { ...DEFAULT_STATE.checkins, ...(parsed.checkins ?? {}) } };
        }
      } catch {
        /* start fresh */
      }
      if (!s.device) s.device = uuid();
      // Absence: computed once per session from the last time the app was open.
      if (s.onboarded && s.greeted && s.lastActiveAt) {
        daysAwayRef.current = Math.max(0, Math.floor((Date.now() - new Date(s.lastActiveAt).getTime()) / DAY));
      }
      s.lastActiveAt = new Date().toISOString();
      setState(s);
      configureBilling();
      const info = await getCustomerInfo();
      if (isPremium(info)) setIsPro(true);
      rcIdRef.current = await getAppUserID();
      unsub = addPremiumListener((pro) => setIsPro(pro || DEV_UNLOCK || !!demo?.pro));
      setReady(true);
    })();
    return () => unsub();
  }, []);

  // Coming back to the foreground after a day or more counts as a new session for the absence line.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (st) => {
      if (st !== 'active') return;
      const last = stateRef.current.lastActiveAt;
      if (last) {
        const days = Math.floor((Date.now() - new Date(last).getTime()) / DAY);
        if (days >= 1) daysAwayRef.current = days;
      }
      setState((prev) => ({ ...prev, lastActiveAt: new Date().toISOString() }));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  // Keep the check-in queue topped up while it is on (Pro only).
  useEffect(() => {
    if (!ready || demo) return;
    if (state.checkins.enabled && isPro) scheduleCheckins(state.checkins.hour, state.name).catch(() => {});
    else if (state.checkins.enabled && !isPro) cancelCheckins().catch(() => {});
  }, [ready, isPro, state.checkins.enabled, state.checkins.hour, state.name]);

  const update = useCallback<Ctx['update']>((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const table: CrewId[] = isPro ? state.table : state.table.slice(0, FREE_TABLE);

  const completeOnboarding = useCallback<Ctx['completeOnboarding']>((setup) => {
    const tbl = setup.table.length ? setup.table : ALL_CREW.slice(0, FREE_TABLE);
    daysAwayRef.current = SINCE_DAYS[setup.since];
    setState((prev) => ({
      ...prev,
      name: setup.name.trim() || 'you',
      pronouns: setup.pronouns,
      since: setup.since,
      table: tbl,
      freeDm: tbl[0],
      onboarded: true,
      greeted: false,
      lastActiveAt: new Date().toISOString(),
    }));
  }, []);

  const toggleTable = useCallback<Ctx['toggleTable']>((id) => {
    const s = stateRef.current;
    const has = s.table.includes(id);
    if (!has && !proRef.current && s.table.length >= FREE_TABLE) return false;
    if (has && s.table.length <= 1) return false;
    setState((prev) => ({ ...prev, table: has ? prev.table.filter((x) => x !== id) : [...prev.table, id] }));
    return true;
  }, []);

  const canDm = useCallback((id: CrewId) => isPro || state.freeDm === id, [isPro, state.freeDm]);

  const thread = useCallback((key: ThreadKey) => threadOf(state, key), [state]);

  const setBusyKey = (key: ThreadKey, v: boolean) => {
    busyRef.current = { ...busyRef.current, [key]: v };
    setBusy(busyRef.current);
  };

  const send = useCallback<Ctx['send']>(async (key, text) => {
    const s0 = stateRef.current;
    if (busyRef.current[key]) return 'error';
    const mode = key === 'group' ? 'group' : 'dm';
    const speaker = key === 'group' ? undefined : (key.slice(3) as CrewId);
    const now = new Date().toISOString();
    const userMsg: Message | null = text && text.trim() ? { id: uid(), role: 'user', text: text.trim(), at: now } : null;
    const daysAway = daysAwayRef.current ?? 0;
    daysAwayRef.current = 0;
    const seated = (proRef.current ? s0.table : s0.table.slice(0, FREE_TABLE)) as CrewId[];

    setNotice((n) => ({ ...n, [key]: null }));
    setBusyKey(key, true);
    let next = s0;
    if (userMsg) next = withThread(next, key, (t) => ({ messages: [...t.messages, userMsg] }));
    next = { ...next, greeted: true, lastActiveAt: now };
    stateRef.current = next;
    setState(next);

    let replies: { id: CrewId; text: string }[];
    let risk = false;
    try {
      if (demo) {
        await sleep(500);
        replies = demoReply(key, seated);
      } else {
        const res = await chat({
          device: next.device,
          mode,
          speaker,
          messages: toWire(threadOf(next, key).messages),
          memory: next.memory,
          user: { name: next.name, pronouns: next.pronouns || undefined },
          daysAway,
          hour: new Date().getHours(),
          pro: proRef.current,
          rcId: rcIdRef.current,
          crew: seated,
        });
        replies = res.replies.filter((r) => CREW.some((c) => c.id === r.id) && r.text);
        risk = !!res.risk;
        setState((prev) => ({
          ...prev,
          memory: typeof res.memory === 'string' ? res.memory : prev.memory,
          remaining: Number.isFinite(res.remaining) ? res.remaining : prev.remaining,
          limit: Number.isFinite(res.limit) ? res.limit : prev.limit,
        }));
      }
    } catch (e) {
      setBusyKey(key, false);
      if (e instanceof LimitError) {
        setState((prev) => ({ ...prev, remaining: 0, limit: e.limit }));
        return 'limit';
      }
      setNotice((n) => ({ ...n, [key]: 'Couldn’t reach the flat. Your message is here; try again in a moment.' }));
      return 'error';
    }

    for (let i = 0; i < replies.length; i++) {
      const r = replies[i];
      setTyping((t) => ({ ...t, [key]: r.id }));
      await sleep(600 + Math.floor(Math.random() * 800));
      const m: Message = {
        id: uid(),
        role: 'crew',
        who: r.id,
        text: r.text,
        at: new Date().toISOString(),
        risk: risk && i === replies.length - 1 ? true : undefined,
      };
      setState((prev) => withThread(prev, key, (t) => ({ messages: [...t.messages, m].slice(-400) })));
    }
    setTyping((t) => ({ ...t, [key]: null }));
    setBusyKey(key, false);
    return 'ok';
  }, []);

  const saveLine = useCallback((m: Message) => {
    if (m.role !== 'crew' || !m.who) return;
    setState((prev) => {
      if (prev.keepsakes.some((k) => k.text === m.text && k.who === m.who)) return prev;
      const k: Keepsake = { id: uid(), who: m.who as CrewId, text: m.text, at: new Date().toISOString() };
      return { ...prev, keepsakes: [k, ...prev.keepsakes] };
    });
  }, []);

  const removeKeepsake = useCallback((id: string) => setState((prev) => ({ ...prev, keepsakes: prev.keepsakes.filter((k) => k.id !== id) })), []);
  const setMemory = useCallback((memory: string) => setState((prev) => ({ ...prev, memory: memory.slice(0, 1200) })), []);

  const setCheckins = useCallback<Ctx['setCheckins']>(async (enabled, hour) => {
    const h = hour ?? stateRef.current.checkins.hour;
    if (enabled && !demo) {
      const ok = await scheduleCheckins(h, stateRef.current.name);
      if (!ok) return false;
    } else if (!enabled && !demo) {
      await cancelCheckins();
    }
    setState((prev) => ({ ...prev, checkins: { enabled, hour: h } }));
    return true;
  }, []);

  const resetAll = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    if (!demo) await cancelCheckins().catch(() => {});
    daysAwayRef.current = null;
    busyRef.current = {};
    setTyping({});
    setBusy({});
    setNotice({});
    setState({ ...DEFAULT_STATE, device: uuid() });
  }, []);

  return (
    <AppCtx.Provider
      value={{
        ready,
        state,
        isPro,
        setPro: (v) => setIsPro(v || DEV_UNLOCK || !!demo?.pro),
        table,
        update,
        completeOnboarding,
        toggleTable,
        canDm,
        thread,
        typing,
        busy,
        notice,
        send,
        saveLine,
        removeKeepsake,
        setMemory,
        setCheckins,
        resetAll,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
