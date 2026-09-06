import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen, Header, CrewTile, Tag } from '../components/UI';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { CREW, tagline } from '../content/crew';
import { TabProps } from '../navigation';

export default function RoomsScreen({ navigation }: TabProps<'Rooms'>) {
  const { state, isPro, canDm } = useApp();
  return (
    <Screen scroll>
      <Header big title="Rooms" />
      <Text style={[type.bodySoft, { marginTop: 2, marginBottom: 16 }]}>
        {isPro ? 'Knock on any door. One-to-one, off the group chat.' : 'One door is open on the free seat. Pro opens the rest.'}
      </Text>
      <View style={{ gap: 10 }}>
        {CREW.map((c) => {
          const open = canDm(c.id);
          const msgs = state.dms[c.id]?.messages ?? [];
          const last = msgs[msgs.length - 1];
          return (
            <Pressable
              key={c.id}
              onPress={() => (open ? navigation.navigate('Room', { id: c.id }) : navigation.navigate('Paywall', { reason: 'dm' }))}
              style={({ pressed }) => [styles.row, !open && { opacity: 0.72 }, pressed && { opacity: 0.8 }]}
            >
              <CrewTile emoji={c.emoji} color={c.color} size={46} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[type.h3, { color: c.color }]}>{c.name}</Text>
                  {!open ? <Tag text="PRO" tone="gold" /> : null}
                </View>
                <Text style={[type.sub, { marginTop: 2 }]} numberOfLines={1}>
                  {last ? (last.role === 'user' ? `you: ${last.text}` : last.text) : tagline(c)}
                </Text>
              </View>
              <Text style={{ color: colors.inkFaint, fontSize: 20 }}>{open ? '›' : '🔒'}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[type.caption, { marginTop: 18, lineHeight: 17 }]}>
        DMs share the same memory as the table. What they learn in a room, they know at the kotatsu.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.line },
});
