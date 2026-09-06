import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Screen, Header, CrewTile, Tag } from '../components/UI';
import { colors, radius, type, switchProps } from '../theme';
import { useApp } from '../store/AppContext';
import { CREW, tagline } from '../content/crew';
import { FREE_TABLE } from '../logic/types';
import { TabProps } from '../navigation';

export default function CrewScreen({ navigation }: TabProps<'Crew'>) {
  const { state, isPro, table, toggleTable } = useApp();
  return (
    <Screen scroll>
      <Header big title="Crew" />
      <Text style={[type.bodySoft, { marginTop: 2, marginBottom: 16 }]}>
        Six flatmates. Fictional, written by the studio, voiced by an AI model. {isPro ? 'Everyone can sit down.' : `${FREE_TABLE} seats on the free plan.`}
      </Text>
      <View style={{ gap: 14 }}>
        {CREW.map((c) => {
          const seated = table.includes(c.id);
          return (
            <View key={c.id} style={[styles.card, { borderColor: `${c.color}55` }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CrewTile emoji={c.emoji} color={c.color} size={50} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[type.h2, { color: c.color }]}>{c.name}</Text>
                    <Text style={type.caption}>{c.age}</Text>
                  </View>
                  <Text style={type.sub}>{tagline(c)}</Text>
                </View>
              </View>
              <Text style={[type.bodySoft, { marginTop: 10 }]}>{c.role}</Text>
              <Text style={[type.body, { marginTop: 10, fontSize: 15, lineHeight: 22 }]}>{c.backstory}</Text>
              <View style={{ marginTop: 12, gap: 6 }}>
                {c.samples.slice(0, 3).map((s) => (
                  <View key={s} style={[styles.sample, { borderLeftColor: c.color }]}>
                    <Text style={styles.sampleText}>{s}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.toggle}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[type.body, { fontWeight: '600' }]}>{seated ? 'At the table' : 'Ask to join the table'}</Text>
                  {!seated && !isPro && state.table.length >= FREE_TABLE ? <Tag text="PRO" tone="gold" /> : null}
                </View>
                <Switch
                  value={seated}
                  onValueChange={() => {
                    const ok = toggleTable(c.id);
                    if (!ok && !seated) navigation.navigate('Paywall', { reason: 'table' });
                  }}
                  trackColor={{ true: c.color, false: colors.lineStrong }}
                  thumbColor="#fff"
                  {...switchProps}
                />
              </View>
            </View>
          );
        })}
      </View>
      <Text style={[type.caption, { marginTop: 18, lineHeight: 17 }]}>
        Nobody here is a person, a partner or a therapist. They are characters, and they will say so if you ask sincerely.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 18, borderWidth: 1.5 },
  sample: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 2 },
  sampleText: { fontSize: 14, lineHeight: 20, color: colors.inkSoft, fontStyle: 'italic' },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
});
