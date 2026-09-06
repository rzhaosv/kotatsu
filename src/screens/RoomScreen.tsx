import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, type } from '../theme';
import { CrewTile } from '../components/UI';
import ChatView from '../components/ChatView';
import { useApp } from '../store/AppContext';
import { crew, tagline } from '../content/crew';
import { ScreenProps } from '../navigation';
import { ThreadKey } from '../store/AppContext';

export default function RoomScreen({ navigation, route }: ScreenProps<'Room'>) {
  const id = route.params.id;
  const c = crew(id);
  const key: ThreadKey = `dm:${id}`;
  const { thread, typing, busy, notice, send, saveLine, state, isPro } = useApp();
  const t = thread(key);

  const onSend = async (text: string) => {
    const r = await send(key, text);
    if (r === 'limit') navigation.navigate('Paywall', { reason: 'limit' });
  };

  const left = state.remaining;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ width: 64 }}>
          <Text style={styles.back}>‹ Rooms</Text>
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CrewTile emoji={c.emoji} color={c.color} size={28} />
          <Text style={[type.h3, { color: c.color }]}>{c.name}</Text>
        </View>
        <View style={{ width: 64 }} />
      </View>
      <ChatView
        messages={t.messages}
        typing={typing[key]}
        busy={busy[key]}
        notice={notice[key]}
        onSend={onSend}
        onSave={saveLine}
        placeholder={`message ${c.name.toLowerCase()}`}
        footerLeft={
          !isPro && left !== null ? (
            <Pressable onPress={() => navigation.navigate('Paywall')} style={styles.pill}>
              <Text style={styles.pillText}>{left === 0 ? 'No messages left today' : `${left} left today`}</Text>
            </Pressable>
          ) : null
        }
        empty={
          <View style={{ alignItems: 'center', paddingHorizontal: 30 }}>
            <CrewTile emoji={c.emoji} color={c.color} size={56} />
            <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 12 }]}>{tagline(c)}.</Text>
            <Text style={[type.caption, { textAlign: 'center', marginTop: 6 }]}>Say something. They’ll answer as themselves.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { color: colors.inkSoft, fontSize: 16, fontWeight: '600' },
  pill: { backgroundColor: colors.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.accentDeep },
});
