import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, type } from '../theme';
import { CrewTile } from '../components/UI';
import ChatView from '../components/ChatView';
import { useApp } from '../store/AppContext';
import { crew } from '../content/crew';
import { TabProps } from '../navigation';
import { demo } from '../dev/demo';

export default function KotatsuScreen({ navigation }: TabProps<'Kotatsu'>) {
  const { state, isPro, table, thread, typing, busy, notice, send, saveLine, groupKey } = useApp();
  const t = thread(groupKey);
  const waiting = groupKey === 'waiting';
  const fired = useRef<Partial<Record<string, boolean>>>({});

  // First open of either thread: the crew speaks first, waiting mode included.
  useEffect(() => {
    if (fired.current[groupKey] || demo) return;
    if (state.onboarded && t.messages.length === 0) {
      fired.current[groupKey] = true;
      send(groupKey, null).then((r) => r === 'limit' && navigation.navigate('Paywall', { reason: 'limit' }));
    }
  }, [state.onboarded, groupKey, t.messages.length, send, navigation]);

  const onSend = async (text: string) => {
    const r = await send(groupKey, text);
    if (r === 'limit') navigation.navigate('Paywall', { reason: 'limit' });
  };

  const left = state.remaining;
  const pill =
    !isPro && left !== null ? (
      <Pressable onPress={() => navigation.navigate('Paywall')} style={styles.pill}>
        <Text style={styles.pillText}>{left === 0 ? 'No messages left today' : `${left} left today`}</Text>
      </Pressable>
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={type.h2}>the kotatsu</Text>
          <Text style={type.caption} numberOfLines={1}>
            {waiting
              ? state.waitingFor
                ? `waiting on ${state.waitingFor}`
                : 'the table, with you waiting'
              : table.length === 6
              ? 'all six at the table'
              : `at the table: ${table.map((id) => crew(id).name.toLowerCase()).join(', ')}`}
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Crew')} style={styles.avatars} hitSlop={8}>
          {table.slice(0, 6).map((id, i) => (
            <CrewTile key={id} emoji={crew(id).emoji} color={crew(id).color} size={28} style={{ marginLeft: i === 0 ? 0 : -8 }} />
          ))}
        </Pressable>
      </View>
      <ChatView
        messages={t.messages}
        typing={typing[groupKey]}
        busy={busy[groupKey]}
        notice={notice[groupKey]}
        onSend={onSend}
        onSave={saveLine}
        footerLeft={pill}
        placeholder="say something to the table"
        empty={
          <View style={{ alignItems: 'center', paddingHorizontal: 30 }}>
            <Text style={{ fontSize: 34 }}>🍊</Text>
            <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 10 }]}>The table’s warm. Give them a second.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  pill: { backgroundColor: colors.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.accentDeep },
});
